import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import Goal from '../models/Goal.js';
import Objective from '../models/Objective.js';
import EnhancedTask from '../models/EnhancedTask.js';
import User from '../models/User.js';
import Club from '../models/Club.js';
import ActivityLog from '../models/ActivityLog.js';

const createSampleGoalWorkflow = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find or create a test club
    let testClub = await Club.findOne({ name: 'Digital Engagement Club' });
    if (!testClub) {
      // Find admin user to be the owner
      const adminUser = await User.findOne({ email: 'admin@test.com' });
      if (!adminUser) {
        console.error('Admin user not found. Please create admin user first.');
        process.exit(1);
      }

      testClub = new Club({
        name: 'Digital Engagement Club',
        description: 'A club focused on improving member engagement through digital channels',
        category: 'Technology',
        createdBy: adminUser._id,
        owner: adminUser._id,
        members: [{
          user: adminUser._id,
          role: 'owner',
          joinedAt: new Date()
        }],
        status: 'approved'
      });
      await testClub.save();
      console.log('Created test club:', testClub.name);
    }

    // Find admin user for ownership
    const adminUser = await User.findOne({ email: 'admin@test.com' });
    
    // 1. Create the Goal
    const goal = new Goal({
      title: 'Improve Member Retention',
      description: 'Increase member retention rates by improving engagement through digital channels and community building activities',
      format: 'SMART', // Specific, Measurable, Achievable, Relevant, Time-bound
      status: 'active',
      priority: 'high',
      progress: 0,
      startDate: new Date(), // Start date is today
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      estimatedHours: 40,
      category: 'engagement', // Goal category
      createdBy: adminUser._id, // Created by admin
      owner: adminUser._id,
      club: testClub._id,
      smartCriteria: {
        specific: 'Increase member retention through digital engagement',
        measurable: 'Achieve 85% member retention rate',
        achievable: 'Using existing digital platforms and tools',
        relevant: 'Critical for club sustainability and growth',
        timeBound: '90 days implementation period'
      }
    });
    await goal.save();
    console.log('Created goal:', goal.title);

    // 2. Create the Objective
    const objective = new Objective({
      title: 'Increase member engagement via digital channels',
      description: 'Establish and maintain active digital communication channels to keep members engaged and informed',
      status: 'active',
      priority: 'high',
      progress: 0,
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      goal: goal._id,
      keyResults: [
        {
          title: 'WhatsApp group with 90% member participation',
          description: 'Create and maintain active WhatsApp group',
          targetValue: 90,
          currentValue: 0,
          unit: 'percentage'
        },
        {
          title: 'Monthly newsletter open rate of 70%',
          description: 'Achieve high engagement with monthly newsletters',
          targetValue: 70,
          currentValue: 0,
          unit: 'percentage'
        },
        {
          title: 'Instagram engagement rate of 15%',
          description: 'Maintain active Instagram presence with good engagement',
          targetValue: 15,
          currentValue: 0,
          unit: 'percentage'
        },
        {
          title: 'Feedback response rate of 60%',
          description: 'Collect meaningful feedback from majority of members',
          targetValue: 60,
          currentValue: 0,
          unit: 'percentage'
        }
      ]
    });
    await objective.save();
    console.log('Created objective:', objective.title);

    // 3. Create the Tasks
    const tasks = [
      {
        title: 'Create club WhatsApp group',
        description: 'Set up a WhatsApp group for club members to facilitate quick communication, share updates, and build community. Include group guidelines and moderation rules.',
        status: 'todo',
        priority: 'high',
        progress: 0,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        estimatedHours: 2,
        tags: ['communication', 'setup', 'whatsapp'],
        checklist: [
          { text: 'Create WhatsApp group', completed: false },
          { text: 'Add all current members', completed: false },
          { text: 'Set group description and rules', completed: false },
          { text: 'Pin important messages', completed: false },
          { text: 'Assign group admins', completed: false }
        ]
      },
      {
        title: 'Send monthly newsletters',
        description: 'Design and send engaging monthly newsletters to keep members informed about club activities, achievements, and upcoming events. Include member spotlights and success stories.',
        status: 'todo',
        priority: 'medium',
        progress: 0,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        estimatedHours: 8,
        tags: ['newsletter', 'communication', 'content'],
        checklist: [
          { text: 'Design newsletter template', completed: false },
          { text: 'Collect content for first newsletter', completed: false },
          { text: 'Set up email distribution list', completed: false },
          { text: 'Schedule monthly sending', completed: false },
          { text: 'Track open and click rates', completed: false }
        ]
      },
      {
        title: 'Post event teasers on Instagram',
        description: 'Create and post engaging Instagram content including event teasers, behind-the-scenes content, and member highlights to increase visibility and engagement.',
        status: 'todo',
        priority: 'medium',
        progress: 0,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
        estimatedHours: 6,
        tags: ['instagram', 'social-media', 'marketing'],
        checklist: [
          { text: 'Create Instagram content calendar', completed: false },
          { text: 'Design post templates and graphics', completed: false },
          { text: 'Write engaging captions', completed: false },
          { text: 'Schedule regular posts', completed: false },
          { text: 'Monitor engagement and respond to comments', completed: false }
        ]
      },
      {
        title: 'Collect feedback via Google Forms',
        description: 'Create comprehensive feedback forms to gather member opinions on club activities, suggestions for improvement, and satisfaction levels. Use data to make informed decisions.',
        status: 'todo',
        priority: 'medium',
        progress: 0,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        estimatedHours: 4,
        tags: ['feedback', 'forms', 'data-collection'],
        checklist: [
          { text: 'Design feedback form questions', completed: false },
          { text: 'Create Google Form', completed: false },
          { text: 'Test form functionality', completed: false },
          { text: 'Distribute form to members', completed: false },
          { text: 'Analyze responses and create report', completed: false }
        ]
      }
    ];

    const createdTasks = [];
    for (const taskData of tasks) {
      const task = new EnhancedTask({
        ...taskData,
        owner: adminUser._id,
        club: testClub._id,
        goal: goal._id,
        objective: objective._id,
        assignedTo: [adminUser._id], // Assign to admin user
        dependencies: [], // No dependencies for now
        recurrence: null, // No recurrence
        attachments: [],
        comments: [],
        timeTracking: []
      });
      
      await task.save();
      createdTasks.push(task);
      console.log('Created task:', task.title);
    }

    // Update goal and objective with task references
    goal.objectives = [objective._id];
    goal.tasks = createdTasks.map(task => task._id);
    await goal.save();

    objective.tasks = createdTasks.map(task => task._id);
    await objective.save();

    // Log activity
    await ActivityLog.logActivity({
      action: { category: 'create', verb: 'created', object: 'goal workflow' },
      actor: adminUser._id,
      entityType: 'goal',
      entityId: goal._id,
      entityName: goal.title,
      description: `Created complete goal workflow: "${goal.title}" with 1 objective and ${createdTasks.length} tasks`,
      club: testClub._id,
      metadata: {
        goalId: goal._id,
        objectiveId: objective._id,
        taskIds: createdTasks.map(task => task._id),
        workflow: 'member-retention'
      }
    });

    console.log('\n🎉 Successfully created complete goal workflow:');
    console.log(`📋 Goal: ${goal.title}`);
    console.log(`🎯 Objective: ${objective.title}`);
    console.log(`✅ Tasks: ${createdTasks.length} tasks created`);
    console.log(`🏢 Club: ${testClub.name}`);
    console.log(`👤 Owner: ${adminUser.name}`);
    
    console.log('\n📊 Summary:');
    console.log(`- Goal ID: ${goal._id}`);
    console.log(`- Objective ID: ${objective._id}`);
    console.log(`- Task IDs: ${createdTasks.map(t => t._id).join(', ')}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample goal workflow:', error);
    process.exit(1);
  }
};

createSampleGoalWorkflow();
