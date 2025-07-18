const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5000/api';

async function testAPI() {
  console.log('🧪 Testing Harambee Hub API endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test login
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'ericksaddam2@outlook.com',
      password: 'password123'
    });
    console.log('✅ Login successful');
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test profile endpoint
    console.log('\n3. Testing profile endpoint...');
    const profileResponse = await axios.get(`${BASE_URL}/profile`, { headers });
    console.log('✅ Profile:', profileResponse.data.user.name);

    // Test user clubs endpoint
    console.log('\n4. Testing user clubs endpoint...');
    const clubsResponse = await axios.get(`${BASE_URL}/user/clubs`, { headers });
    console.log('✅ User clubs response format:', {
      hasClubsArray: Array.isArray(clubsResponse.data.clubs),
      clubsCount: clubsResponse.data.clubs?.length || 0
    });

    // Test notifications endpoint
    console.log('\n5. Testing notifications endpoint...');
    const notificationsResponse = await axios.get(`${BASE_URL}/notifications`, { headers });
    console.log('✅ Notifications response format:', {
      isArray: Array.isArray(notificationsResponse.data),
      count: notificationsResponse.data?.length || 0
    });

    // Test tasks endpoint
    console.log('\n6. Testing tasks endpoint...');
    const tasksResponse = await axios.get(`${BASE_URL}/tasks`, { headers });
    console.log('✅ Tasks response format:', {
      hasDataProperty: !!tasksResponse.data.data,
      hasTasksProperty: !!tasksResponse.data.tasks,
      isDirectArray: Array.isArray(tasksResponse.data),
      actualStructure: Object.keys(tasksResponse.data)
    });

    console.log('\n🎉 All API tests passed! The backend is working correctly.');

  } catch (error) {
    console.error('❌ API test failed:', {
      endpoint: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
  }
}

testAPI();
