import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

function getSecret(): string {
  return process.env.JWT_SECRET || 'dev-secret-change-in-production';
}

interface AdminUser {
  username: string;
  password: string;
}

function getUsers(): AdminUser[] {
  try {
    const raw = process.env.ADMIN_USERS || '[]';
    return JSON.parse(raw) as AdminUser[];
  } catch {
    return [];
  }
}

export function generateToken(username: string): string {
  return jwt.sign({ username }, getSecret(), { expiresIn: '24h' });
}

export function verifyToken(token: string): { username: string } | null {
  try {
    return jwt.verify(token, getSecret()) as { username: string };
  } catch {
    return null;
  }
}

export async function validateLogin(username: string, password: string): Promise<boolean> {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user) return false;
  return bcrypt.compare(password, user.password);
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
