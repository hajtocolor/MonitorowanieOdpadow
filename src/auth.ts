import { UserRole } from './types';

const TOKEN_KEY = 'wastetrack_token';
const ROLE_KEY = 'wastetrack_role';

export interface LoginResult {
  success: boolean;
  role?: UserRole;
  token?: string;
  error?: string;
}

export async function login(role: UserRole, password: string): Promise<LoginResult> {
  try {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${apiBase}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, password }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return { success: false, error: payload?.error || 'Nieprawidłowy login lub hasło' };
    }

    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(ROLE_KEY, data.role);
    return { success: true, role: data.role, token: data.token };
  } catch {
    return { success: false, error: 'Nie można połączyć się z serwerem' };
  }
}

export function getStoredRole(): UserRole | null {
  const stored = localStorage.getItem(ROLE_KEY);
  if (stored === 'admin' || stored === 'worker') {
    return stored;
  }
  return null;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}