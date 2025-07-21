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

// Get a specific task with full details
export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('club', 'name description')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.author', 'name email avatar')
      .populate('timeLog.user', 'name email avatar')
      .populate('checklist.completedBy', 'name email avatar')
      .populate('attachments.uploadedBy', 'name email avatar');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to this task
    if (task.type === 'personal' && task.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (task.type === 'club') {
      const club = await Club.findById(task.club._id);
      if (!club) {
        return res.status(404).json({ error: 'Associated club not found' });
      }

      const isCreator = task.createdBy._id.toString() === req.user.id;
      const isAssignee = task.assignedTo && task.assignedTo._id.toString() === req.user.id;
      const isMember = club.members.some(m => m.user.toString() === req.user.id);

      if (!isCreator && !isAssignee && !isMember) {
        return res.status(403).json({ error: 'Access denied. You must be the creator, assignee, or a member of the club to view this task.' });
      }
    }

    // Add computed fields
    const taskWithDetails = {
      ...task.toObject(),
      isOverdue: task.isOverdue,
      daysUntilDue: task.daysUntilDue,
      checklistProgress: task.checklistProgress,
      totalTimeLogged: task.totalTimeLogged,
      progressPercentage: task.progress,
      estimatedVsActual: {
        estimated: task.estimatedHours,
        actual: task.actualHours,
        variance: task.actualHours - task.estimatedHours
      },
      statusHistory: {
        created: task.createdAt,
        started: task.startDate,
        completed: task.completedDate
      }
    };

    res.json({ task: taskWithDetails });
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

    console.log('=== UPDATE TASK REQUEST ===');
    console.log('Update task request:', {
      taskId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
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
      createdByString: task.createdBy.toString(),
      userId: req.user.id,
      userIdString: req.user.id.toString(),
      comparison: task.createdBy.toString() === req.user.id.toString()
    });

    // Check permissions
    if (task.type === 'personal' && task.createdBy.toString() !== req.user.id.toString()) {
      console.log('Access denied for personal task - IDs do not match:', {
        taskCreatedBy: task.createdBy.toString(),
        currentUserId: req.user.id.toString()
      });
      return res.status(403).json({ error: 'Access denied' });
    }

    if (task.type === 'club') {
      const club = await Club.findById(task.club);
      if (!club) {
        console.log('Club not found for task:', task.club);
        return res.status(404).json({ error: 'Club not found' });
      }
      const member = club.members.find(m => m.user.toString() === req.user.id);
      const isAssignee = task.assignedTo && task.assignedTo.some(userId => userId.toString() === req.user.id);
      const isCreator = task.createdBy.toString() === req.user.id;
      
      console.log('Club task permission check:', {
        clubId: task.club,
        userId: req.user.id,
        member: member,
        memberRole: member?.role,
        isAssignee,
        isCreator
      });
      
      // Allow access if user is:
      // 1. Club admin/owner
      // 2. Task creator
      // 3. Task assignee
      // 4. Club member (for basic updates like status)
      if (!member) {
        console.log('Access denied - not a club member');
        return res.status(403).json({ error: 'Access denied - not a club member' });
      }
      
      const canUpdate = member.role === 'admin' || member.role === 'owner' || isCreator || isAssignee;
      if (!canUpdate) {
        console.log('Access denied for club task - insufficient permissions');
        return res.status(403).json({ error: 'Access denied - you can only update tasks assigned to you or created by you' });
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
      const isCreator = task.createdBy.toString() === req.user.id;
      
      // Allow deletion if user is club admin/owner or task creator
      const canDelete = member && (member.role === 'admin' || member.role === 'owner' || isCreator);
      if (!canDelete) {
        return res.status(403).json({ error: 'Access denied - only club admins or task creators can delete club tasks' });
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

// Add comment to task
export const addTaskComment = async (req, res) => {
  try {
    const { text } = req.body;
    const taskId = req.params.id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions (same as update task)
    if (task.type === 'personal' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (task.type === 'club') {
      const club = await Club.findById(task.club);
      const member = club.members.find(m => m.user.toString() === req.user.id);
      const isAssignee = task.assignedTo && task.assignedTo.some(userId => userId.toString() === req.user.id);
      const isCreator = task.createdBy.toString() === req.user.id;
      
      const canComment = member && (member.role === 'admin' || member.role === 'owner' || isCreator || isAssignee);
      if (!canComment) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const comment = task.addComment(text.trim(), req.user.id);
    await task.save();

    // Populate the comment author for response
    await task.populate('comments.author', 'name email avatar');
    const populatedComment = task.comments.id(comment.id);

    res.status(201).json({ comment: populatedComment });
  } catch (error) {
    console.error('Add task comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Add time log entry to task
export const addTaskTimeLog = async (req, res) => {
  try {
    const { hours, description, date } = req.body;
    const taskId = req.params.id;

    if (!hours || hours <= 0) {
      return res.status(400).json({ error: 'Valid hours value is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions (same as update task)
    if (task.type === 'personal' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (task.type === 'club') {
      const club = await Club.findById(task.club);
      const member = club.members.find(m => m.user.toString() === req.user.id);
      const isAssignee = task.assignedTo && task.assignedTo.some(userId => userId.toString() === req.user.id);
      const isCreator = task.createdBy.toString() === req.user.id;
      
      const canLog = member && (member.role === 'admin' || member.role === 'owner' || isCreator || isAssignee);
      if (!canLog) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const timeEntry = task.addTimeLog(req.user.id, parseFloat(hours), description, date ? new Date(date) : undefined);
    await task.save();

    // Populate the time log user for response
    await task.populate('timeLog.user', 'name email avatar');
    const populatedTimeEntry = task.timeLog.id(timeEntry.id);

    res.status(201).json({ timeEntry: populatedTimeEntry });
  } catch (error) {
    console.error('Add task time log error:', error);
    res.status(500).json({ error: 'Failed to add time log' });
  }
};

// Toggle checklist item
export const toggleTaskChecklistItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const taskId = req.params.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions (same as update task)
    if (task.type === 'personal' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (task.type === 'club') {
      const club = await Club.findById(task.club);
      const member = club.members.find(m => m.user.toString() === req.user.id);
      const isAssignee = task.assignedTo && task.assignedTo.some(userId => userId.toString() === req.user.id);
      const isCreator = task.createdBy.toString() === req.user.id;
      
      const canToggle = member && (member.role === 'admin' || member.role === 'owner' || isCreator || isAssignee);
      if (!canToggle) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const item = task.toggleChecklistItem(itemId, req.user.id);
    if (!item) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    await task.save();

    // Populate the completed by user for response
    await task.populate('checklist.completedBy', 'name email avatar');
    const populatedItem = task.checklist.id(itemId);

    res.json({ 
      item: populatedItem,
      taskProgress: task.progress,
      checklistProgress: task.checklistProgress
    });
  } catch (error) {
    console.error('Toggle checklist item error:', error);
    res.status(500).json({ error: 'Failed to toggle checklist item' });
  }
};

// Update task progress manually
export const updateTaskProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const taskId = req.params.id;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be between 0 and 100' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions (same as update task)
    if (task.type === 'personal' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (task.type === 'club') {
      const club = await Club.findById(task.club);
      const member = club.members.find(m => m.user.toString() === req.user.id);
      const isAssignee = task.assignedTo && task.assignedTo.some(userId => userId.toString() === req.user.id);
      const isCreator = task.createdBy.toString() === req.user.id;
      
      const canUpdate = member && (member.role === 'admin' || member.role === 'owner' || isCreator || isAssignee);
      if (!canUpdate) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    task.progress = progress;
    
    // Auto-update status based on progress
    if (progress === 100 && task.status !== 'completed') {
      task.status = 'completed';
    } else if (progress > 0 && task.status === 'pending') {
      task.status = 'in-progress';
    }

    await task.save();

    res.json({ 
      progress: task.progress,
      status: task.status,
      completedDate: task.completedDate
    });
  } catch (error) {
    console.error('Update task progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
};
