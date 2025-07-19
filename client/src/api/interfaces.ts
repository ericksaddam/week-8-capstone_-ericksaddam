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

export interface Community {
  _id: string;
  name: string;
  description: string;
  createdBy: User;
  members: { user: User; role: 'member' | 'admin' }[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface Notification {
  _id: string;
  user: string; 
  message: string;
  link: string; 
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

interface ClubLog {
  _id: string;
  action: string;
  user: User;
  timestamp: string;
  details?: string;
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

export interface Club {
  _id: string;
  name: string;
  description: string;
  members: ClubMember[];
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

export interface CreateTaskData {
  title: string;
  description: string;
  type: 'personal' | 'club';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  club?: string;
  assignedTo?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string | null;
  assignedTo?: string[];
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ClubRequest {
  _id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string; 
}

export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  clubs: number;
  points: number;
  pendingTasks: number;
  inProgressTasks: number;
}

export interface ClubCreationRequest {
  _id: string;
  name: string;
  description: string;
  createdBy: User;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ClubJoinRequest {
  _id: string;
  user: User;
  club: Club;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

