/**
 * 用户服务 - 处理用户信息管理
 */
import { eq } from 'drizzle-orm';
import db from '../db/db';
import { users } from '../db/schema';
import { hash, compare } from 'bcrypt';

const SALT_ROUNDS = 10;

export interface UpdateProfileData {
  username?: string;
  email?: string;
  avatarUrl?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  tier: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 获取用户详细信息
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
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
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * 更新用户信息
 */
export async function updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile> {
  // 检查用户名是否被其他用户使用
  if (data.username) {
    const [existing] = await db.select().from(users)
      .where(eq(users.username, data.username))
      .limit(1);
    
    if (existing && existing.id !== userId) {
      throw new Error('用户名已被使用');
    }
  }

  // 检查邮箱是否被其他用户使用
  if (data.email) {
    const [existing] = await db.select().from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    
    if (existing && existing.id !== userId) {
      throw new Error('邮箱已被使用');
    }
  }

  const [updatedUser] = await db.update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return {
    id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email,
    avatarUrl: updatedUser.avatarUrl,
    tier: updatedUser.tier,
    isActive: updatedUser.isActive,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
}

/**
 * 更改密码
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  // 获取用户当前密码
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user) {
    throw new Error('用户不存在');
  }

  // 验证当前密码
  if (user.passwordHash) {
    const isValid = await compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('当前密码错误');
    }
  }

  // 加密新密码
  const newPasswordHash = await hash(newPassword, SALT_ROUNDS);

  // 更新密码
  await db.update(users)
    .set({
      passwordHash: newPasswordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * 获取用户使用情况统计
 */
export async function getUserUsageStats(userId: string): Promise<{
  projectsCount: number;
  assetsCount: number;
  storageUsed: number;
}> {
  // 这里可以扩展更多统计信息
  // 目前返回基础统计
  return {
    projectsCount: 0,
    assetsCount: 0,
    storageUsed: 0,
  };
}

export default {
  getUserProfile,
  updateProfile,
  changePassword,
  getUserUsageStats,
};