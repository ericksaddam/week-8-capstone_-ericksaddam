const API_BASE = 'http://localhost:5000/api';

// Test function to check goals API
async function testGoalsAPI() {
  try {
    console.log('Testing Goals API endpoints...\n');
    
    // Test health endpoint first
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`http://localhost:5000/health`);
    const healthData = await healthResponse.text();
    console.log('Health response:', healthData);
    console.log('Health status:', healthResponse.status);
    
    // Test goals endpoint (this will fail without auth, but we can see the response)
    console.log('\n2. Testing goals endpoint (without auth)...');
    const goalsResponse = await fetch(`${API_BASE}/clubs/test-club-id/goals`);
    const goalsData = await goalsResponse.text();
    console.log('Goals response status:', goalsResponse.status);
    console.log('Goals response:', goalsData.substring(0, 200) + '...');
    
    // Test tasks endpoint
    console.log('\n3. Testing tasks endpoint (without auth)...');
    const tasksResponse = await fetch(`${API_BASE}/clubs/test-club-id/tasks`);
    const tasksData = await tasksResponse.text();
    console.log('Tasks response status:', tasksResponse.status);
    console.log('Tasks response:', tasksData.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testGoalsAPI();
