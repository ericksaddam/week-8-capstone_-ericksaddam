import { getAuthHeaders } from './index';

const API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000/api'
  : '/api';

export async function fetchUserClubRequests() {
  const res = await fetch(`${API_BASE}/user/club-requests`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch your club requests');
  return res.json();
}
