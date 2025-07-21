import axios from 'axios';

const checkGoal = async () => {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // Get clubs
    const clubsResponse = await axios.get('http://localhost:5001/api/admin/clubs', { headers });
    const clubId = clubsResponse.data.clubs[0]._id;
    console.log('Club ID:', clubId);
    
    // Get goals for the club
    const goalsResponse = await axios.get(`http://localhost:5001/api/clubs/${clubId}/goals`, { headers });
    console.log('Goals found:', goalsResponse.data);
    
    if (goalsResponse.data.goals && goalsResponse.data.goals.length > 0) {
      const goalId = goalsResponse.data.goals[0]._id;
      console.log('Trying to get goal details for:', goalId);
      
      // Try to get specific goal
      const goalResponse = await axios.get(`http://localhost:5001/api/goals/${goalId}`, { headers });
      console.log('Goal details:', goalResponse.data);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data || error.message);
  }
};

checkGoal();
