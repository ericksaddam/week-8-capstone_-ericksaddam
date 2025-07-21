import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

const createGoalWorkflow = async () => {
  try {
    console.log('🚀 Starting goal workflow creation...');

    // 1. Login as admin to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Admin login successful');

    // 2. Get or create a club
    console.log('2. Getting clubs...');
    const clubsResponse = await axios.get(`${API_BASE}/admin/clubs`, { headers });
    let clubId;
    
    if (clubsResponse.data.clubs && clubsResponse.data.clubs.length > 0) {
      clubId = clubsResponse.data.clubs[0]._id;
      console.log(`✅ Using existing club: ${clubsResponse.data.clubs[0].name}`);
    } else {
      // Create a club if none exists
      console.log('Creating new club...');
      const newClubResponse = await axios.post(`${API_BASE}/clubs`, {
        name: 'Digital Engagement Club',
        description: 'A club focused on improving member engagement through digital channels',
        category: 'Technology'
      }, { headers });
      clubId = newClubResponse.data.club._id;
      console.log('✅ Created new club');
    }

    // 3. Create the Goal
    console.log('3. Creating goal...');
    const goalData = {
      title: 'Improve Member Retention',
      description: 'Increase member retention rates by improving engagement through digital channels and community building activities',
      format: 'SMART',
      priority: 'high',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedHours: 40
    };

    const goalResponse = await axios.post(`${API_BASE}/clubs/${clubId}/goals`, goalData, { headers });
    console.log('Goal response:', goalResponse.data);
    const goalId = goalResponse.data.goal?._id || goalResponse.data._id;
    console.log(`✅ Created goal: ${goalResponse.data.goal?.title || goalResponse.data.title} (ID: ${goalId})`);

    // 4. Create the Objective
    console.log('4. Creating objective...');
    const objectiveData = {
      title: 'Increase member engagement via digital channels',
      description: 'Establish and maintain active digital communication channels to keep members engaged and informed',
      priority: 'high',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
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
    };

    console.log(`Attempting to create objective for goal ID: ${goalId}`);
    const objectiveResponse = await axios.post(`${API_BASE}/goals/${goalId}/objectives`, objectiveData, { headers });
    console.log('Objective response:', objectiveResponse.data);
    const objectiveId = objectiveResponse.data.objective?._id || objectiveResponse.data._id;
    console.log(`✅ Created objective: ${objectiveResponse.data.objective?.title || objectiveResponse.data.title} (ID: ${objectiveId})`);

    // 5. Create the Tasks
    console.log('5. Creating tasks...');
    const tasks = [
      {
        title: 'Create club WhatsApp group',
        description: 'Set up a WhatsApp group for club members to facilitate quick communication, share updates, and build community. Include group guidelines and moderation rules.',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
        priority: 'medium',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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
        priority: 'medium',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
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
        priority: 'medium',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
    for (let i = 0; i < tasks.length; i++) {
      const taskData = {
        ...tasks[i],
        goalId: goalId,
        objectiveId: objectiveId
      };
      
      const taskResponse = await axios.post(`${API_BASE}/clubs/${clubId}/tasks`, taskData, { headers });
      createdTasks.push(taskResponse.data.task);
      console.log(`✅ Created task ${i + 1}: ${taskResponse.data.task.title}`);
    }

    console.log('\n🎉 Successfully created complete goal workflow:');
    console.log(`📋 Goal: ${goalResponse.data.goal.title} (ID: ${goalId})`);
    console.log(`🎯 Objective: ${objectiveResponse.data.objective.title} (ID: ${objectiveId})`);
    console.log(`✅ Tasks: ${createdTasks.length} tasks created`);
    console.log(`🏢 Club ID: ${clubId}`);
    
    console.log('\n📊 Task Summary:');
    createdTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.title} (Due: ${new Date(task.dueDate).toLocaleDateString()})`);
    });

    console.log('\n🚀 Workflow is ready! You can now view it in the admin dashboard.');
    
  } catch (error) {
    console.error('❌ Error creating goal workflow:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    if (error.response?.status === 401) {
      console.log('💡 Make sure the backend server is running on port 5001');
    }
  }
};

createGoalWorkflow();
