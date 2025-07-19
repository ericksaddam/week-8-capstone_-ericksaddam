import apiClient from './apiClient';

export async function getUserProfile(token: string) {
  const response = await apiClient.get('/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function updateUserProfile(data: { name: string; email: string; phone?: string; bio?: string }, token: string) {
  const response = await apiClient.put('/user/profile', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function changeUserPassword(data: { currentPassword: string; newPassword: string }, token: string) {
  const response = await apiClient.post('/user/password', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function updateUserPreferences(data: { notifications?: { email: boolean; sms: boolean }; theme?: string; language?: string; timezone?: string }, token: string) {
  const response = await apiClient.put('/user/preferences', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function deleteUserAccount(token: string) {
  const response = await apiClient.delete('/user', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
