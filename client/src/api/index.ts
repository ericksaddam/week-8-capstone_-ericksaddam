import apiClient from '@/lib/apiClient';

// Re-export all interfaces to be used across the application
export * from './interfaces';

// Import specific interfaces needed for function signatures
import {
  RegisterData,
  LoginCredentials,
  User,
  Task,
  CreateTaskData,
  UpdateTaskData,
  Notification,
  AdminDashboardStats,
  AdminDashboardAnalytics,
  Club,
  Community,
  ClubMember,
  ClubRequest,
  UserStats,
} from './interfaces';

// --- Auth ---

export const register = async (userData: RegisterData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

export const login = async (credentials: LoginCredentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

// --- User ---

export const fetchUserClubRequests = async (): Promise<ClubRequest[]> => {
  try {
    const response = await apiClient.get('/users/club-requests');
    return response.data;
  } catch (error) {
    console.error('Error fetching user club requests:', error);
    return [];
  }
};

export const fetchUserStats = async (): Promise<UserStats> => {
  try {
    const response = await apiClient.get('/users/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    // Return mock data for now if endpoint fails
    return {
      totalTasks: 0,
      completedTasks: 0,
      clubs: 0,
      points: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
    };
  }
};

export const getUserProfile = async (): Promise<User | null> => {
  try {
    const response = await apiClient.get('/users/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// --- Tasks ---

export const fetchTasks = async (): Promise<Task[]> => {
  try {
    const response = await apiClient.get('/tasks');
    return response.data.data || response.data.tasks || [];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

export const fetchRecentTasks = async (limit: number = 5): Promise<Task[]> => {
  try {
    const response = await apiClient.get('/tasks');
    const tasks = response.data.data || response.data.tasks || [];
    return tasks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent tasks:', error);
    return [];
  }
};

export const createTask = async (taskData: CreateTaskData): Promise<Task> => {
  const response = await apiClient.post('/tasks', taskData);
  return response.data.data || response.data.task;
};

export const updateTask = async (id: string, updates: UpdateTaskData): Promise<Task> => {
  const response = await apiClient.put(`/tasks/${id}`, updates);
  return response.data.data || response.data.task;
};

export const deleteTask = async (id: string): Promise<void> => {
  await apiClient.delete(`/tasks/${id}`);
};

// --- Notifications ---

export const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await apiClient.get('/notifications');
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await apiClient.post(`/notifications/${notificationId}/read`);
};

// --- Admin ---

export const fetchAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  const response = await apiClient.get('/admin/dashboard');
  return response.data;
};

export const fetchAdminDashboardAnalytics = async (): Promise<AdminDashboardAnalytics> => {
  const response = await apiClient.get('/admin/analytics');
  return response.data;
};

// Admin API object for backward compatibility
export const adminApi = {
  getClubs: async () => {
    const response = await apiClient.get('/admin/clubs');
    return response.data;
  },
  updateClub: async (id: string, updates: { name: string; description: string }) => {
    const response = await apiClient.put(`/admin/clubs/${id}`, updates);
    return response.data;
  },
  deleteClub: async (id: string) => {
    const response = await apiClient.delete(`/admin/clubs/${id}`);
    return response.data;
  },
  getUsers: async () => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },
  blockUser: async (id: string) => {
    const response = await apiClient.post(`/admin/users/${id}/block`);
    return response.data;
  },
  unblockUser: async (id: string) => {
    const response = await apiClient.post(`/admin/users/${id}/unblock`);
    return response.data;
  },
  createUser: async (userData: any) => {
    const response = await apiClient.post('/admin/users', userData);
    return response.data;
  },
  updateUser: async (id: string, userData: any) => {
    const response = await apiClient.put(`/admin/users/${id}`, userData);
    return response.data;
  },
  getClubCreationRequests: async () => {
    const response = await apiClient.get('/admin/club-requests');
    return response.data;
  },
  getJoinRequests: async () => {
    const response = await apiClient.get('/admin/join-requests');
    return response.data;
  },
  approveClubCreationRequest: async (requestId: string) => {
    const response = await apiClient.post(`/admin/club-requests/${requestId}/approve`);
    return response.data;
  },
  rejectClubCreationRequest: async (requestId: string) => {
    const response = await apiClient.post(`/admin/club-requests/${requestId}/reject`);
    return response.data;
  },
  approveJoinRequest: async (clubId: string, requestId: string) => {
    const response = await apiClient.post(`/admin/clubs/${clubId}/join-requests/${requestId}/approve`);
    return response.data;
  },
  rejectJoinRequest: async (clubId: string, requestId: string) => {
    const response = await apiClient.post(`/admin/clubs/${clubId}/join-requests/${requestId}/reject`);
    return response.data;
  },
};

// --- Clubs ---

export const fetchPendingClubs = async (): Promise<Club[]> => {
  try {
    const response = await apiClient.get('/clubs/pending');
    return response.data.clubs || response.data || [];
  } catch (error) {
    console.error('Error fetching pending clubs:', error);
    return [];
  }
};

export const fetchLeftClubs = async (): Promise<Club[]> => {
  try {
    const response = await apiClient.get('/clubs/left');
    return response.data;
  } catch (error) {
    console.error('Error fetching left clubs:', error);
    return [];
  }
};

export const rejoinClub = async (clubId: string) => {
  const response = await apiClient.post(`/clubs/${clubId}/rejoin`);
  return response.data;
};

export const fetchAllApprovedClubs = async (): Promise<Club[]> => {
  try {
    const response = await apiClient.get('/clubs');
    const clubs = Array.isArray(response.data) ? response.data : [];
    return clubs.filter((club: Club) => club.status === 'approved');
  } catch (error) {
    console.error('Error fetching all approved clubs:', error);
    return [];
  }
};

export const fetchUserClubs = async (): Promise<Club[]> => {
  try {
    const response = await apiClient.get('/user/clubs');
    return response.data.clubs || response.data || [];
  } catch (error) {
    console.error('Error fetching user clubs:', error);
    return [];
  }
};

export const fetchClubById = async (clubId: string): Promise<Club> => {
  const response = await apiClient.get(`/clubs/${clubId}`);
  return response.data;
};

export const requestNewClub = async (clubData: { name: string; description: string }) => {
  const response = await apiClient.post('/clubs', clubData);
  return response.data;
};

export const joinClub = async (clubId: string) => {
  const response = await apiClient.post(`/clubs/${clubId}/join`);
  return response.data;
};

export const leaveClub = async (clubId: string) => {
  const response = await apiClient.post(`/clubs/${clubId}/leave`);
  return response.data;
};

export const updateClub = async (id: string, updates: Partial<Club>) => {
  const response = await apiClient.put(`/clubs/${id}`, updates);
  return response.data;
};

export const deleteClub = async (id: string) => {
  const response = await apiClient.delete(`/clubs/${id}`);
  return response.data;
};

// --- Club Members ---

export const fetchClubMembers = async (clubId: string): Promise<ClubMember[]> => {
  try {
    const response = await apiClient.get<{ data: Club }>(`/clubs/${clubId}`);
    const members = response.data.data?.members || [];
    return members;
  } catch (error) {
    console.error('Error fetching club members:', error);
    return [];
  }
};

export const addMemberToClub = async (clubId: string, userId: string) => {
  const response = await apiClient.post(`/clubs/${clubId}/add-member`, { userId });
  return response.data;
};

export const updateClubMemberRole = async (clubId: string, memberId: string, role: 'member' | 'admin') => {
  const response = await apiClient.put(`/clubs/${clubId}/members/${memberId}/role`, { role });
  return response.data;
};

export const removeClubMember = async (clubId: string, memberId: string) => {
  const response = await apiClient.delete(`/clubs/${clubId}/members/${memberId}`);
  return response.data;
};

// --- Club Communities ---

export const fetchClubCommunities = async (clubId: string): Promise<Community[]> => {
  try {
    const response = await apiClient.get<{ data: Club }>(`/clubs/${clubId}`);
    return response.data.data?.communities || [];
  } catch (error) {
    console.error('Error fetching club communities:', error);
    return [];
  }
};

export const requestNewCommunity = async (clubId: string, communityData: { name: string; description: string }) => {
  const response = await apiClient.post(`/clubs/${clubId}/communities/request`, communityData);
  return response.data;
};

// --- Club Topics, Goals, KnowledgeBase ---

export const createClubGoal = async (clubId: string, goalData: { title: string; description?: string; targetDate?: string }) => {
  const response = await apiClient.post(`/clubs/${clubId}/goals`, goalData);
  return response.data;
};

export const fetchClubGoals = async (clubId: string) => {
  const response = await apiClient.get(`/clubs/${clubId}/goals`);
  return response.data.goals || [];
};

export const createClubTopic = async (clubId: string, topicData: { title: string; content: string }) => {
  const response = await apiClient.post(`/clubs/${clubId}/topics`, topicData);
  return response.data;
};

export const fetchClubTopics = async (clubId: string) => {
  const response = await apiClient.get(`/clubs/${clubId}/topics`);
  return response.data.topics || [];
};

export const createTopicReply = async (clubId: string, topicId: string, replyData: { content: string }) => {
  const response = await apiClient.post(`/clubs/${clubId}/topics/${topicId}/replies`, replyData);
  return response.data;
};

export const createKnowledgeBaseEntry = async (clubId: string, entryData: { title: string; content: string; tags?: string[] }) => {
  const response = await apiClient.post(`/clubs/${clubId}/knowledge`, entryData);
  return response.data;
};

export const fetchKnowledgeBase = async (clubId: string) => {
  const response = await apiClient.get(`/clubs/${clubId}/knowledge`);
  return response.data.knowledgeBase || [];
};

// --- General Users ---

export const fetchUsers = async () => {
  const response = await apiClient.get('/users');
  return response.data;
};

export const fetchUser = async (id: string) => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id: string, updates: Partial<User>) => {
  const response = await apiClient.put(`/users/${id}`, updates);
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await apiClient.delete(`/users/${id}`);
  return response.data;
};

// --- Enhanced Task Management ---

// Add comment to task
export const addTaskComment = async (taskId: string, text: string) => {
  const response = await apiClient.post(`/tasks/${taskId}/comments`, { text });
  return response.data.comment;
};

// Add time log entry to task
export const addTaskTimeLog = async (taskId: string, hours: number, description?: string, date?: string) => {
  const response = await apiClient.post(`/tasks/${taskId}/time-log`, { hours, description, date });
  return response.data.timeEntry;
};

// Toggle checklist item
export const toggleTaskChecklistItem = async (taskId: string, itemId: string) => {
  const response = await apiClient.put(`/tasks/${taskId}/checklist/${itemId}/toggle`);
  return response.data;
};

// Update task progress
export const updateTaskProgress = async (taskId: string, progress: number) => {
  const response = await apiClient.put(`/tasks/${taskId}/progress`, { progress });
  return response.data;
};

// Get detailed task information
export const getTaskDetails = async (taskId: string): Promise<Task> => {
  const response = await apiClient.get(`/tasks/${taskId}`);
  return response.data.task;
};
