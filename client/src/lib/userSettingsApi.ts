import { apiFetch } from './apiClient';

export async function getUserProfile(token: string) {
  return apiFetch('/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateUserProfile(data: { name: string; email: string; phone?: string; bio?: string }, token: string) {
  return apiFetch('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function changeUserPassword(data: { currentPassword: string; newPassword: string }, token: string) {
  return apiFetch('/user/password', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateUserPreferences(data: { notifications?: { email: boolean; sms: boolean }; theme?: string; language?: string; timezone?: string }, token: string) {
  return apiFetch('/user/preferences', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteUserAccount(token: string) {
  return apiFetch('/user', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
