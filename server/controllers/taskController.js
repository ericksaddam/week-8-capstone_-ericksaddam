import Task from '../models/Task.js';
import Club from '../models/Club.js';
import User from '../models/User.js';

// Get all tasks for the current user
export const getTasks = async (req, res) => {
  try {
    const { type, status, priority, page = 1, limit = 10 } = req.query;
    const query = { createdBy: req.user.id };

    // Add filters
    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;

    const tasks = await Task.find(query)
      .populate('club', 'name description')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: tasks.length,
        totalTasks: total
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Get a specific task
export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('club', 'name description')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to this task
    if (task.type === 'personal' && task.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (task.type === 'club') {
      const club = await Club.findById(task.club._id);
      const isMember = club.members.some(m => m.user.toString() === req.user.id);
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

// Create a new task
export const createTask = async (req, res) => {
  try {
    const { title, description, type, priority, dueDate, club, assignedTo } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const taskData = {
      title: title.trim(),
      description: description?.trim(),
      type: type || 'personal',
      priority: priority || 'medium',
      createdBy: req.user.id
    };

    if (dueDate) {
      taskData.dueDate = new Date(dueDate);
    }

    // Handle club tasks
    if (type === 'club') {
      if (!club) {
        return res.status(400).json({ error: 'Club is required for club tasks' });
      }

      const clubDoc = await Club.findById(club);
      if (!clubDoc || clubDoc.status !== 'approved') {
        return res.status(404).json({ error: 'Club not found or not approved' });
      }

      // Check if user is admin/owner of the club
      const member = clubDoc.members.find(m => m.user.toString() === req.user.id);
      if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
        return res.status(403).json({ error: 'Only club admins can create club tasks' });
      }

      taskData.club = club;

      // Handle task assignment
      if (assignedTo && assignedTo.length > 0) {
        // Verify all assigned users are club members
        const validAssignees = [];
        for (const userId of assignedTo) {
          const isClubMember = clubDoc.members.some(m => m.user.toString() === userId);
          if (isClubMember) {
            validAssignees.push(userId);
          }
        }
        taskData.assignedTo = validAssignees;
      }
    }

    const task = new Task(taskData);
    await task.save();

    // Populate the task before sending response
    await task.populate('club', 'name description');
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    // Add task to club if it's a club task
    if (type === 'club') {
      await Club.findByIdAndUpdate(club, {
        $push: { tasks: task._id }
      });
    }

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo } = req.body;
    const taskId = req.params.id;

    console.log('Update task request:', {
      taskId,
      userId: req.user.id,
      updates: { title, description, status, priority, dueDate, assignedTo }
    });

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('Task found:', {
      taskId: task._id,
      taskType: task.type,
      createdBy: task.createdBy,
      userId: req.user.id,
      comparison: task.createdBy.toString() === req.user.id
    });

    // Check permissions
    if (task.type === 'personal' && task.createdBy.toString() !== req.user.id) {
      console.log('Access denied for personal task');
      return res.status(403).json({ error: 'Access denied' });
    }

    if (task.type === 'club') {
      const club = await Club.findById(task.club);
      if (!club) {
        console.log('Club not found for task:', task.club);
        return res.status(404).json({ error: 'Club not found' });
      }
      const member = club.members.find(m => m.user.toString() === req.user.id);
      console.log('Club task permission check:', {
        clubId: task.club,
        userId: req.user.id,
        member: member,
        memberRole: member?.role
      });
      if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
        console.log('Access denied for club task - insufficient permissions');
        return res.status(403).json({ error: 'Only club admins can update club tasks' });
      }
    }

    // Update fields
    const updates = {};
    if (title) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (dueDate) updates.dueDate = new Date(dueDate);
    if (assignedTo) updates.assignedTo = assignedTo;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updates,
      { new: true, runValidators: true }
    )
      .populate('club', 'name description')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions
    if (task.type === 'personal' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (task.type === 'club') {
      const club = await Club.findById(task.club);
      const member = club.members.find(m => m.user.toString() === req.user.id);
      if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
        return res.status(403).json({ error: 'Only club admins can delete club tasks' });
      }

      // Remove task from club
      await Club.findByIdAndUpdate(task.club, {
        $pull: { tasks: taskId }
      });
    }

    await Task.findByIdAndDelete(taskId);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

// Get tasks for a specific club
export const getClubTasks = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { status, priority, page = 1, limit = 10 } = req.query;

    const club = await Club.findById(clubId);
    if (!club || club.status !== 'approved') {
      return res.status(404).json({ error: 'Club not found or not approved' });
    }

    // Check if user is a member
    const isMember = club.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = { club: clubId };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: tasks.length,
        totalTasks: total
      }
    });
  } catch (error) {
    console.error('Get club tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch club tasks' });
  }
};
