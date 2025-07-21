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

// Enhanced Goal interface with SMART/OKR format support
export interface Goal {
  _id: string;
  title: string;
  description: string;
  club: string; // Club ID
  owner: User;
  assignedTo: User[];
  format: 'SMART' | 'OKR';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  progress: number; // 0-100
  
  // SMART criteria
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  timeBound?: string;
  
  // OKR format
  keyResults?: string[];
  
  // Dates
  startDate: string;
  dueDate: string;
  completedAt?: string;
  
  // Relationships
  objectives: string[]; // Objective IDs
  tasks: string[]; // Task IDs
  dependencies: string[]; // Goal IDs this depends on
  
  // Metadata
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  attachments: Attachment[];
  
  // Metrics
  estimatedHours?: number;
  actualHours?: number;
  budget?: number;
  actualCost?: number;
}

// New Objective interface
export interface Objective {
  _id: string;
  title: string;
  description: string;
  goal: string; // Goal ID
  club: string; // Club ID
  owner: User;
  assignedTo: User[];
  
  // Status and Progress
  status: 'draft' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  progress: number; // 0-100
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Key Results (for OKR format)
  keyResults: KeyResult[];
  
  // Dates
  startDate: string;
  dueDate: string;
  completedAt?: string;
  
  // Relationships
  tasks: string[]; // Task IDs
  dependencies: string[]; // Objective IDs this depends on
  
  // Metadata
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  attachments: Attachment[];
  
  // Metrics
  estimatedHours?: number;
  actualHours?: number;
}

// Key Result interface for OKR objectives
export interface KeyResult {
  _id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string; // e.g., '%', 'users', 'revenue'
  status: 'not-started' | 'in-progress' | 'completed' | 'at-risk';
  dueDate: string;
  owner: User;
}

// Enhanced Attachment interface
export interface Attachment {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: User;
  uploadedAt: string;
}

// Enhanced Comment interface
export interface Comment {
  _id: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt?: string;
  edited: boolean;
  mentions: User[];
  attachments: Attachment[];
  reactions: Reaction[];
}

// Reaction interface for comments
export interface Reaction {
  _id: string;
  emoji: string;
  user: User;
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

// Enhanced Activity Log interface
export interface ActivityLog {
  _id: string;
  
  // Core information
  action: ActivityAction;
  actor: User;
  timestamp: string;
  
  // Context
  club?: string;
  goal?: string;
  objective?: string;
  task?: string;
  
  // Entity details
  entityType: 'club' | 'goal' | 'objective' | 'task' | 'user' | 'comment' | 'attachment';
  entityId: string;
  entityName?: string;
  
  // Change details
  changes?: ActivityChange[];
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  
  // Additional context
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  
  // Visibility
  visibility: 'public' | 'club' | 'private';
  
  // Related entities
  relatedUsers?: User[];
  mentions?: User[];
}

// Activity Action enum-like interface
export interface ActivityAction {
  category: 'create' | 'read' | 'update' | 'delete' | 'assign' | 'complete' | 'comment' | 'attach';
  verb: string; // e.g., 'created', 'updated', 'assigned', 'completed'
  object: string; // e.g., 'task', 'goal', 'objective'
}

// Activity Change interface for tracking field changes
export interface ActivityChange {
  field: string;
  oldValue: any;
  newValue: any;
  fieldType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
}

// Legacy ClubLog interface for backward compatibility
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

// Enhanced Club interface with comprehensive management features
export interface Club {
  _id: string;
  name: string;
  description: string;
  
  // Membership and Roles
  members: ClubMember[];
  memberCount: number;
  maxMembers?: number;
  
  // Hierarchy and Organization
  goals: Goal[];
  objectives: Objective[];
  tasks: Task[];
  
  // Settings and Configuration
  settings: ClubSettings;
  permissions: ClubPermissions;
  
  // Status and Visibility
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'archived';
  visibility: 'public' | 'private' | 'invite-only';
  
  // Metadata
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  avatar?: string;
  banner?: string;
  
  // Legacy features
  communities: Community[];
  topics: Topic[];
  knowledgeBase: KnowledgeBaseEntry[];
  
  // Activity and Analytics
  activityLogs: ActivityLog[];
  analytics: ClubAnalytics;
  
  // Integration
  integrations: ClubIntegration[];
}

// Club Settings interface
export interface ClubSettings {
  allowPublicJoin: boolean;
  requireApprovalToJoin: boolean;
  allowMemberInvites: boolean;
  allowGoalCreation: boolean;
  allowTaskCreation: boolean;
  notificationSettings: NotificationSettings;
  workflowSettings: WorkflowSettings;
}

// Club Permissions interface
export interface ClubPermissions {
  canCreateGoals: string[]; // Role names
  canEditGoals: string[]; // Role names
  canDeleteGoals: string[]; // Role names
  canCreateTasks: string[]; // Role names
  canAssignTasks: string[]; // Role names
  canViewAnalytics: string[]; // Role names
  canManageMembers: string[]; // Role names
  canManageSettings: string[]; // Role names
}

// Notification Settings interface
export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  slackIntegration?: boolean;
  overdueTaskAlerts: boolean;
  goalProgressAlerts: boolean;
  assignmentNotifications: boolean;
  mentionNotifications: boolean;
  digestFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
}

// Workflow Settings interface
export interface WorkflowSettings {
  defaultTaskStatuses: string[];
  customFields: CustomField[];
  automationRules: AutomationRule[];
  approvalWorkflows: ApprovalWorkflow[];
}

// Custom Field interface
export interface CustomField {
  _id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  options?: string[]; // For select/multiselect
  required: boolean;
  defaultValue?: any;
  appliesTo: 'goal' | 'objective' | 'task' | 'all';
}

// Approval Workflow interface
export interface ApprovalWorkflow {
  _id: string;
  name: string;
  triggers: string[]; // What triggers this workflow
  approvers: User[];
  requiredApprovals: number;
  autoApproveAfter?: number; // Hours
}

// Club Analytics interface
export interface ClubAnalytics {
  totalGoals: number;
  completedGoals: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageTaskCompletionTime: number; // Hours
  memberProductivity: MemberProductivity[];
  goalProgress: GoalProgress[];
  activityTrends: ActivityTrend[];
}

// Member Productivity interface
export interface MemberProductivity {
  user: User;
  tasksCompleted: number;
  tasksAssigned: number;
  averageCompletionTime: number;
  productivityScore: number;
}

// Goal Progress interface
export interface GoalProgress {
  goal: Goal;
  progress: number;
  tasksCompleted: number;
  tasksTotal: number;
  daysRemaining: number;
  onTrack: boolean;
}

// Activity Trend interface
export interface ActivityTrend {
  date: string;
  tasksCreated: number;
  tasksCompleted: number;
  goalsCreated: number;
  goalsCompleted: number;
  activeMembers: number;
}

// Club Integration interface
export interface ClubIntegration {
  _id: string;
  type: 'slack' | 'discord' | 'teams' | 'calendar' | 'email' | 'webhook';
  name: string;
  enabled: boolean;
  configuration: Record<string, any>;
  createdBy: User;
  createdAt: string;
}

// Enhanced Task interface with comprehensive features
export interface Task {
  _id: string;
  type: 'personal' | 'club';
  title: string;
  description?: string;
  
  // Status and Priority
  status: 'pending' | 'in-progress' | 'completed' | 'archived' | 'cancelled' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number; // 0-100
  
  // Time tracking
  estimatedHours: number;
  actualHours: number;
  
  // Assignment and Ownership
  club?: Club;
  assignedTo: User[];
  createdBy: User;
  
  // Dates
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
  
  // Content and Organization
  tags: string[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  checklist: ChecklistItem[];
  timeLog: TimeLogEntry[];
  
  // Computed fields (from backend virtuals)
  isOverdue?: boolean;
  daysUntilDue?: number;
  checklistProgress?: number;
  totalTimeLogged?: number;
  progressPercentage?: number;
  estimatedVsActual?: {
    estimated: number;
    actual: number;
    variance: number;
  };
  statusHistory?: {
    created: string;
    started?: string;
    completed?: string;
  };
  
  // Metrics
  storyPoints?: number;
  complexity: 'simple' | 'medium' | 'complex';
  
  // Automation
  automationRules: AutomationRule[];
}

// Task Dependency interface
export interface TaskDependency {
  _id: string;
  dependentTask: string; // Task ID
  dependsOnTask: string; // Task ID
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  lag?: number; // Days
  createdAt: string;
}

// Task Recurrence interface
export interface TaskRecurrence {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  dayOfMonth?: number; // 1-31
  endDate?: string;
  maxOccurrences?: number;
}

// Task Label interface
export interface TaskLabel {
  _id: string;
  name: string;
  color: string;
  description?: string;
}

// Checklist Item interface
export interface ChecklistItem {
  _id: string;
  title: string;
  completed: boolean;
  assignedTo?: User;
  dueDate?: string;
  createdAt: string;
}

// Automation Rule interface
export interface AutomationRule {
  _id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  createdBy: User;
  createdAt: string;
}

export interface AutomationTrigger {
  type: 'status_change' | 'due_date' | 'assignment' | 'time_based' | 'progress_update';
  value?: any;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface AutomationAction {
  type: 'send_notification' | 'update_status' | 'assign_user' | 'create_task' | 'send_email';
  parameters: Record<string, any>;
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
  status?: 'pending' | 'in-progress' | 'completed' | 'archived' | 'cancelled' | 'on-hold';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
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
  pointsBreakdown?: {
    taskCompletion: number;
    clubParticipation: number;
    leadership: number;
    engagement: number;
    bonuses: number;
  };
  achievements?: {
    firstTaskCompleted: boolean;
    taskMaster: boolean;
    clubLeader: boolean;
    socialButterfly: boolean;
    earlyBird: boolean;
    veteran: boolean;
  };
  level?: number;
  nextLevelPoints?: number;
}

export interface ClubCreationRequest {
  _id: string;
  name: string;
  description: string;
  category?: string;
  createdBy: User;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ClubJoinRequest {
  _id: string;
  user: User;
  club: Club;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  processedBy?: User;
}

// Enhanced Task-related interfaces
export interface TaskComment {
  id: string;
  text: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
  uploadedBy: User;
  uploadedAt: string;
}

export interface TimeLogEntry {
  id: string;
  user: User;
  description?: string;
  hours: number;
  date: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: User;
}

// Task status badge colors and labels
export const TASK_STATUS_CONFIG = {
  'pending': { label: 'Pending', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  'in-progress': { label: 'In Progress', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  'completed': { label: 'Completed', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  'archived': { label: 'Archived', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  'cancelled': { label: 'Cancelled', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  'on-hold': { label: 'On Hold', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' }
} as const;

export const TASK_PRIORITY_CONFIG = {
  'low': { label: 'Low', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  'medium': { label: 'Medium', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  'high': { label: 'High', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  'urgent': { label: 'Urgent', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' }
} as const;
