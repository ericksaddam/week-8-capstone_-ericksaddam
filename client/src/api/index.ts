import axios from 'axios';

export const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
});

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ClubMember {
  user: User;
  role: 'member' | 'admin' | 'owner';
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
  clubs?: { _id: string; name: string; description?: string }[];
  tasks?: Array<{ _id: string; title: string; status: string }>;
}

// Detailed interfaces for nested club data

interface Reply {
  _id: string;
  content: string;
  user: User;
  createdAt: string;
}

interface Topic {
  _id: string;
  title: string;
  content: string;
  user: User;
  createdAt: string;
  replies: Reply[];
}

interface Goal {
  _id: string;
  title: string;
  description: string;
  createdBy: User;
  createdAt: string;
}

interface KnowledgeBaseEntry {
  _id: string;
  title: string;
  content: string;
  createdBy: User;
  createdAt: string;
}

interface Community {
  _id: string;
  name: string;
  description: string;
  createdBy: User;
  members: { user: User; role: 'member' | 'admin' }[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface Notification {
  _id: string;
  user: string; // or User object if populated
  message: string;
  link: string; // e.g., /clubs/123/discussions/456
  read: boolean;
  createdAt: string;
}



export interface TimeSeriesDataPoint {
  date: string;
  count: number;
}

export interface AdminDashboardAnalytics {
  userGrowth: TimeSeriesDataPoint[];
  clubGrowth: TimeSeriesDataPoint[];
}

export interface AdminDashboardStats {
  userStats: {
    totalUsers: number;
    newUsersToday: number;
    admins: number;
  };
  clubStats: {
    totalClubs: number;
    pendingClubs: number;
    newClubsToday: number;
  };
  recentActivities: ClubLog[];
}

interface ClubLog {
  _id: string;
  action: string;
  user: User;
  timestamp: string;
  details?: string;
}

export interface Club {
  _id: string;
  name: string;
  description: string;
  members: { user: User; role: 'member' | 'admin' | 'owner' }[];
  createdBy: User;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  communities: Community[];
  goals: Goal[];
  topics: Topic[];
  knowledgeBase: KnowledgeBaseEntry[];
  clubLogs: ClubLog[];
}

export interface Task {
  _id: string;
  type: 'personal' | 'club';
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  club?: string;
  assignedTo: Array<{
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
  }>;
  createdBy: {
    _id: string;
    name: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
  progress?: number;
  comments?: number;
  tags?: string[];
}

// --- Auth ---

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const register = async (userData: RegisterData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const login = async (credentials: LoginCredentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// --- User ---
export const getUserProfile = async (token: string): Promise<User | null> => {
  const response = await api.get('/users/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const fetchTasks = async (): Promise<Task[]> => {
  try {
    const response = await api.get<{ data: Task[] }>('/tasks');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks. Please try again later.');
  }
};

export const fetchRecentTasks = async (limit: number = 5): Promise<Task[]> => {
  try {
    // The /tasks/recent endpoint is not available, so we fetch all tasks and sort/slice.
    const response = await api.get<{ data: Task[] }>('/tasks');
    const tasks = response.data.data || [];
    return tasks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent tasks:', error);
    return [];
  }
};

export interface CreateTaskData {
  title: string;
  description: string;
  type: 'personal' | 'club';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  club?: string;
  assignedTo?: string[];
}

export const createTask = async (taskData: CreateTaskData): Promise<Task> => {
  try {
    const response = await api.post<{ data: Task }>('/tasks', taskData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error('Failed to create task. Please try again.');
  }
};

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string | null;
  assignedTo?: string[];
}

export const updateTask = async (id: string, updates: UpdateTaskData): Promise<Task> => {
  try {
    const response = await api.put<{ data: Task }>(`/tasks/${id}`, updates);
    return response.data.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw new Error('Failed to update task. Please try again.');
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    await api.delete(`/tasks/${id}`);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task. Please try again.');
  }
};

export const createClubGoal = async (clubId: string, goalData: { title: string; description: string }) => {
  const response = await api.post(`/clubs/${clubId}/goals`, goalData);
  return response.data;
};

export const createClubTopic = async (clubId: string, topicData: { title: string; content: string }) => {
  const response = await api.post(`/clubs/${clubId}/topics`, topicData);
  return response.data;
};

export const createTopicReply = async (clubId: string, topicId: string, replyData: { content: string }) => {
  const response = await api.post(`/clubs/${clubId}/topics/${topicId}/replies`, replyData);
  return response.data;
};

export const createKnowledgeBaseEntry = async (clubId: string, entryData: { title: string; content: string }) => {
  const response = await api.post(`/clubs/${clubId}/knowledge-base`, entryData);
  return response.data;
};

// --- Notifications ---
export const fetchNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await api.post(`/notifications/${notificationId}/read`);
};

// --- Admin ---
export const fetchAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  // Return mock data for now since the endpoint doesn't exist
  return {
    userStats: {
      totalUsers: 0,
      newUsersToday: 0,
      admins: 0
    },
    clubStats: {
      totalClubs: 0,
      pendingClubs: 0,
      newClubsToday: 0
    },
    recentActivities: []
  };
};

export const fetchAdminDashboardAnalytics = async (): Promise<AdminDashboardAnalytics> => {
  // Return mock data for now since the endpoint doesn't exist
  return {
    userGrowth: [],
    clubGrowth: []
  };
};

// --- Clubs ---
export const fetchAllApprovedClubs = async (): Promise<Club[]> => {
  try {
    const response = await api.get('/clubs');
    // Filter approved clubs on the client side
    const clubs = Array.isArray(response.data) ? response.data : [];
    return clubs.filter((club: Club) => club.status === 'approved');
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return [];
  }
};

export const fetchUserClubs = async () => {
  return api.get('/user/clubs').then(res => res.data);
};

// Note: These endpoints need to be implemented on the backend
export const fetchPendingClubs = async () => {
  return []; // TODO: Implement this when backend is ready
};

export const fetchLeftClubs = async () => {
  return []; // TODO: Implement this when backend is ready
};

export const leaveClub = async (clubId: string) => {
  return api.post(`/clubs/${clubId}/leave`).then(res => res.data);
};

export const rejoinClub = async (clubId: string) => {
  return api.post(`/clubs/${clubId}/rejoin`).then(res => res.data);
};

export const fetchClubCommunities = async (clubId: string): Promise<Community[]> => {
  try {
    // First, check if the user has access to this club
    const clubResponse = await api.get<{ data: Club }>(`/clubs/${clubId}`);
    const club = clubResponse.data.data;
    
    if (!club) {
      console.error('Club not found or access denied');
      return [];
    }
    
    // The communities are included in the club response
    return club.communities || [];
  } catch (error) {
    console.error('Error fetching club communities:', error);
    return [];
  }
};

export const fetchClubGoals = async (clubId: string): Promise<Goal[]> => {
  try {
    // First, check if the user has access to this club
    const clubResponse = await api.get<{ data: Club }>(`/clubs/${clubId}`);
    const club = clubResponse.data.data;
    
    if (!club) {
      console.error('Club not found or access denied');
      return [];
    }
    
    // The goals are included in the club response
    return club.goals || [];
  } catch (error) {
    console.error('Error fetching club goals:', error);
    return [];
  }
};

export const fetchClubTopics = async (clubId: string): Promise<Topic[]> => {
  try {
    // First, check if the user has access to this club
    const clubResponse = await api.get<{ data: Club }>(`/clubs/${clubId}`);
    const club = clubResponse.data.data;
    
    if (!club) {
      console.error('Club not found or access denied');
      return [];
    }
    
    // The topics are included in the club response
    return club.topics || [];
  } catch (error) {
    console.error('Error fetching club topics:', error);
    return [];
  }
};

export const fetchClubKnowledgeBase = async (clubId: string): Promise<KnowledgeBaseEntry[]> => {
  try {
    // First, check if the user has access to this club
    const clubResponse = await api.get<{ data: Club }>(`/clubs/${clubId}`);
    const club = clubResponse.data.data;
    
    if (!club) {
      console.error('Club not found or access denied');
      return [];
    }
    
    // The knowledge base entries are included in the club response
    return club.knowledgeBase || [];
  } catch (error) {
    console.error('Error fetching club knowledge base:', error);
    return [];
  }
};

export const fetchClubMembers = async (clubId: string): Promise<ClubMember[]> => {
  try {
    // Fetch the club details which includes the members
    const response = await api.get<{ data: Club }>(`/clubs/${clubId}`);
    
    // Extract members from the club data and map to the expected format
    const members = response.data.data?.members || [];
    return members.map(member => ({
      user: member.user as unknown as User, // Type assertion since we know the structure
      role: member.role
    }));
  } catch (error) {
    console.error('Error fetching club members:', error);
    return [];
  }
};

export const fetchClubById = async (clubId: string): Promise<Club> => {
  const response = await api.get(`/clubs/${clubId}`);
  return response.data;
};

export const requestClubCreation = async (clubData: { name: string, description: string, purpose: string }) => {
  const response = await api.post('/clubs/request', clubData);
  return response.data;
};

export const requestCommunityCreation = async (clubId: string, communityData: { name: string; description: string }) => {
  const response = await api.post(`/clubs/${clubId}/communities/request`, communityData);
  return response.data;
};

export const requestToJoinClub = async (clubId: string) => {
  try {
    const token = localStorage.getItem('token');
    console.log('Auth token:', token ? 'Token exists' : 'No token found');
    
    const response = await api.post(`/clubs/${clubId}/join`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Join club response:', response.data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
    console.error('Error in requestToJoinClub:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.config?.headers
    });
    throw error;
  }}
};

export const updateClub = async (id: string, updates: Partial<Club>) => {
  const response = await api.put(`/clubs/${id}`, updates);
  return response.data;
};
export const deleteClub = async (id: string) => {
  const response = await api.delete(`/clubs/${id}`);
  return response.data;
};
export const addMemberToClub = async (clubId: string, userId: string) => {
  const response = await api.post(`/clubs/${clubId}/add-member`, { userId });
  return response.data;
};
export const updateClubMemberRole = async (clubId: string, userId: string, role: 'member' | 'admin') => {
  const response = await api.put(`/clubs/${clubId}/members/${userId}`, { role });
  return response.data;
};

export const removeMemberFromClub = async (clubId: string, userId: string) => {
  const response = await api.post(`/clubs/${clubId}/remove-member`, { userId });
  return response.data;
};

// --- Users ---

export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  clubs: number;
  points: number;
  pendingTasks: number;
  inProgressTasks: number;
}

export const fetchUserStats = async (): Promise<UserStats> => {
  // Return mock data for now since the endpoint doesn't exist
  return {
    totalTasks: 0,
    completedTasks: 0,
    clubs: 0,
    points: 0,
    pendingTasks: 0,
    inProgressTasks: 0
  };
};

export const fetchUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};
export const fetchUser = async (id: string) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};
export const updateUser = async (id: string, updates: Partial<User>) => {
  const response = await api.put(`/users/${id}`, updates);
  return response.data;
};
export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
