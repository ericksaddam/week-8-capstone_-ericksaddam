import { getAuthHeaders } from './index';

const API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000/api'
  : '/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  createdAt: string;
  lastLogin?: string;
  clubs?: Array<{ _id: string; name: string; description?: string }>;
  tasks?: Array<{ _id: string; title: string; status: string }>;
}

export interface Club {
  _id: string;
  name: string;
  description: string;
  members: Array<{ user: { _id: string; name: string; email?: string; }; role: string; }>,
  createdBy: { _id: string; name: string; };
  createdAt: string;
  isActive: boolean;
}

export interface ClubCreationRequest {
  _id: string;
  name: string;
  description: string;
  purpose: string;
  createdBy: { _id: string; name: string; };
  createdAt: string;
}

export interface ClubJoinRequest {
    _id: string;
    user: { _id: string; name: string; email: string; };
    club: { _id: string; name: string; };
    requestedAt: string;
}

export const adminApi = {
  // User Management
  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  getUser: async (id: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  createUser: async (userData: {
    name: string;
    email: string;
    password: string;
    role?: 'user' | 'admin';
  }): Promise<User> => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return res.json();
  },

  updateUser: async (
    id: string,
    updates: Partial<{
      name: string;
      email: string;
      password?: string;
      role: 'user' | 'admin';
    }>
  ): Promise<User> => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update user');
    }
    return res.json();
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete user');
    }
    return res.json();
  },

  blockUser: async (id: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/admin/users/${id}/block`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to block user');
    }
    return res.json();
  },

  unblockUser: async (id: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/admin/users/${id}/unblock`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to unblock user');
    }
    return res.json();
  },

  // Club Management
  getClubs: async (): Promise<Club[]> => {
    const res = await fetch(`${API_BASE}/admin/clubs`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch clubs');
    return res.json();
  },

  updateClub: async (id: string, updates: Partial<Club>): Promise<Club> => {
    const res = await fetch(`${API_BASE}/admin/clubs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update club');
    }
    return res.json();
  },

  deleteClub: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/admin/clubs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete club');
    }
    return res.json();
  },

  // Request Management
  getClubCreationRequests: async (): Promise<ClubCreationRequest[]> => {
    const res = await fetch(`${API_BASE}/admin/clubs/requests`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch club creation requests');
    return res.json();
  },

  approveClubCreationRequest: async (requestId: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/admin/clubs/requests/${requestId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to approve club request');
    return res.json();
  },

  rejectClubCreationRequest: async (requestId: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/admin/clubs/requests/${requestId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to reject club request');
    return res.json();
  },

  getJoinRequests: async (): Promise<ClubJoinRequest[]> => {
    const res = await fetch(`${API_BASE}/admin/join-requests`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch join requests');
    return res.json();
  },

  approveJoinRequest: async (clubId: string, requestId: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/admin/clubs/${clubId}/join-requests/${requestId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to approve join request');
    return res.json();
  },

  rejectJoinRequest: async (clubId: string, requestId: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/admin/clubs/${clubId}/join-requests/${requestId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to reject join request');
    return res.json();
  },

  unblockUser: async (id: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/admin/users/${id}/unblock`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to unblock user');
    }
    return res.json();
  },
};

export default adminApi;
