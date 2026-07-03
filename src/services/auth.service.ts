/**
 * 认证服务 - 处理用户认证、JWT令牌管理
 */
import { sign, verify } from 'jsonwebtoken';
import { hash, compare } from 'bcrypt';
import { eq } from 'drizzle-orm';
import db from '../db/db';
import { users } from '../db/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

export interface UserPayload {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  tier: string;
}

export interface AuthResult {
  token: string;
  expiresIn: number;
  user: UserPayload;
}

/**
 * 用户注册
 */
export async function register(username: string, password: string, email?: string): Promise<AuthResult> {
  // 检查用户名是否已存在
  const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
  
  if (existingUser.length > 0) {
    throw new Error('用户名已存在');
  }

  // 检查邮箱是否已存在
  if (email) {
    const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail.length > 0) {
      throw new Error('邮箱已被注册');
    }
  }

  // 加密密码
  const passwordHash = await hash(password, SALT_ROUNDS);

  // 创建用户
  const [newUser] = await db.insert(users).values({
    username,
    passwordHash,
    email,
    tier: 'free',
    isActive: true,
  }).returning();

  // 生成JWT令牌
  const token = generateToken(newUser.id, newUser.username, newUser.tier);
  
  return {
    token,
    expiresIn: 7 * 24 * 60 * 60, // 7天（秒）
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      avatarUrl: newUser.avatarUrl,
      tier: newUser.tier,
    },
  };
}

/**
 * 用户登录（密码方式）
 */
export async function loginWithPassword(username: string, password: string): Promise<AuthResult> {
  // 查找用户
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  
  if (!user) {
    throw new Error('用户名或密码错误');
  }

  if (!user.isActive) {
    throw new Error('账户已被禁用');
  }

  // 验证密码
  const isValid = await compare(password, user.passwordHash || '');
  if (!isValid) {
    throw new Error('用户名或密码错误');
  }

  // 更新最后登录时间
  await db.update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  // 生成JWT令牌
  const token = generateToken(user.id, user.username, user.tier);
  
  return {
    token,
    expiresIn: 7 * 24 * 60 * 60,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      tier: user.tier,
    },
  };
}

/**
 * GitHub OAuth 登录
 */
export async function loginWithGitHub(githubId: string, githubUsername: string, githubEmail?: string, githubAvatar?: string): Promise<AuthResult> {
  // 查找是否已有GitHub关联的用户
  const [existingUser] = await db.select().from(users)
    .where(eq(users.username, githubUsername))
    .limit(1);

  if (existingUser) {
    // 更新用户信息
    await db.update(users)
      .set({
        avatarUrl: githubAvatar || existingUser.avatarUrl,
        email: githubEmail || existingUser.email,
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, existingUser.id));

    const token = generateToken(existingUser.id, existingUser.username, existingUser.tier);
    
    return {
      token,
      expiresIn: 7 * 24 * 60 * 60,
      user: {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        avatarUrl: githubAvatar || existingUser.avatarUrl,
        tier: existingUser.tier,
      },
    };
  }

  // 创建新用户
  const [newUser] = await db.insert(users).values({
    username: githubUsername,
    email: githubEmail,
    avatarUrl: githubAvatar,
    tier: 'free',
    isActive: true,
  }).returning();

  const token = generateToken(newUser.id, newUser.username, newUser.tier);
  
  return {
    token,
    expiresIn: 7 * 24 * 60 * 60,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      avatarUrl: newUser.avatarUrl,
      tier: newUser.tier,
    },
  };
}

/**
 * 生成JWT令牌
 */
function generateToken(userId: string, username: string, tier: string): string {
  const payload = {
    userId,
    username,
    tier,
    iat: Math.floor(Date.now() / 1000),
  };
  
  return sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证JWT令牌
 */
export function verifyToken(token: string): UserPayload | null {
  try {
    const decoded = verify(token, JWT_SECRET) as any;
    
    return {
      id: decoded.userId,
      username: decoded.username,
      tier: decoded.tier,
    };
  } catch (error) {
    return null;
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(userId: string): Promise<UserPayload | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    tier: user.tier,
  };
}

/**
 * 用户登出（清理相关缓存等）
 */
export async function logout(userId: string): Promise<void> {
  // 可以在这里清理用户的会话缓存等
  // 目前JWT无状态，不需要特殊处理
}

export default {
  register,
  loginWithPassword,
  loginWithGitHub,
  verifyToken,
  getCurrentUser,
  logout,
};