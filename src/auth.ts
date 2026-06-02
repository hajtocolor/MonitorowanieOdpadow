import { UserRole } from './types';

const STORAGE_KEY = 'wastetrack_user_role';
const CREDENTIALS: Record<UserRole, string> = {
  admin: 'admin123',
  worker: 'worker123',
};

export function getStoredRole(): UserRole | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'admin' || stored === 'worker') {
    return stored;
  }
  return null;
}

export function setStoredRole(role: UserRole) {
  localStorage.setItem(STORAGE_KEY, role);
}

export function clearStoredRole() {
  localStorage.removeItem(STORAGE_KEY);
}

export function validateCredentials(role: UserRole, password: string) {
  return CREDENTIALS[role] === password;
}

export function getRoleHeader(): Record<string, string> {
  const role = getStoredRole();
  return role ? { 'X-User-Role': role } : {};
}
