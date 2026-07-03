/**
 * 资产服务 - 处理头像、声音、脚本、故事板等资产管理
 */
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import db from '../db/db';
import { assets, users } from '../db/schema';

export type AssetType = 'avatar' | 'voice' | 'script' | 'storyboard';
export type AssetStatus = 'active' | 'processing' | 'failed';

export interface AssetData {
  id: string;
  type: AssetType;
  title: string;
  description?: string;
  content?: string;
  fileUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  isSystem: boolean;
  status: AssetStatus;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetInput {
  type: AssetType;
  title: string;
  description?: string;
  content?: string;
  fileUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  isSystem?: boolean;
  tags?: string[];
}

export interface AssetFilter {
  type?: AssetType;
  isSystem?: boolean;
  status?: AssetStatus;
  keyword?: string;
}

export interface AssetListResult {
  list: AssetData[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 获取资产列表
 */
export async function getAssets(
  userId: string,
  filter?: AssetFilter,
  page: number = 1,
  pageSize: number = 50
): Promise<AssetListResult> {
  const offset = (page - 1) * pageSize;
  
  // 构建查询条件
  const conditions = [];
  
  // 用户可以看到自己的资产和系统资产
  conditions.push(
    or(
      eq(assets.userId, userId),
      eq(assets.isSystem, true)
    )
  );
  
  if (filter?.type) {
    conditions.push(eq(assets.type, filter.type));
  }
  
  if (filter?.status) {
    conditions.push(eq(assets.status, filter.status));
  }
  
  if (filter?.isSystem !== undefined) {
    conditions.push(eq(assets.isSystem, filter.isSystem));
  }
  
  if (filter?.keyword) {
    conditions.push(like(assets.title, `%${filter.keyword}%`));
  }

  // 执行查询
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const results = await db.select()
    .from(assets)
    .where(whereClause)
    .orderBy(desc(assets.createdAt))
    .limit(pageSize)
    .offset(offset);

  // 获取总数
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(assets)
    .where(whereClause);
  
  const total = countResult[0]?.count || 0;

  return {
    list: results.map(mapAsset),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * 获取单个资产
 */
export async function getAssetById(assetId: string, userId: string): Promise<AssetData | null> {
  const [asset] = await db.select()
    .from(assets)
    .where(
      and(
        eq(assets.id, assetId),
        or(
          eq(assets.userId, userId),
          eq(assets.isSystem, true)
        )
      )
    )
    .limit(1);

  if (!asset) {
    return null;
  }

  return mapAsset(asset);
}

/**
 * 创建资产
 */
export async function createAsset(userId: string, input: CreateAssetInput): Promise<AssetData> {
  const [newAsset] = await db.insert(assets)
    .values({
      userId,
      type: input.type,
      title: input.title,
      description: input.description,
      content: input.content,
      fileUrl: input.fileUrl,
      previewUrl: input.previewUrl,
      thumbnailUrl: input.thumbnailUrl,
      metadata: input.metadata,
      isSystem: input.isSystem || false,
      status: 'active',
      tags: input.tags,
    })
    .returning();

  return mapAsset(newAsset);
}

/**
 * 更新资产
 */
export async function updateAsset(
  assetId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    metadata?: Record<string, any>;
    status?: AssetStatus;
  }
): Promise<AssetData> {
  // 检查资产所有权
  const [existing] = await db.select()
    .from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.userId, userId)))
    .limit(1);

  if (!existing) {
    throw new Error('资产不存在或无权修改');
  }

  const [updated] = await db.update(assets)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(assets.id, assetId))
    .returning();

  return mapAsset(updated);
}

/**
 * 删除资产
 */
export async function deleteAsset(assetId: string, userId: string): Promise<void> {
  // 检查资产所有权（系统资产不能删除）
  const [existing] = await db.select()
    .from(assets)
    .where(
      and(
        eq(assets.id, assetId),
        eq(assets.userId, userId),
        eq(assets.isSystem, false)
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error('资产不存在或无权删除');
  }

  await db.delete(assets).where(eq(assets.id, assetId));
}

/**
 * 获取系统预设资产
 */
export async function getSystemAssets(type?: AssetType): Promise<AssetData[]> {
  const conditions = [eq(assets.isSystem, true)];
  
  if (type) {
    conditions.push(eq(assets.type, type));
  }

  const results = await db.select()
    .from(assets)
    .where(and(...conditions))
    .orderBy(desc(assets.createdAt));

  return results.map(mapAsset);
}

/**
 * 映射数据库记录到API响应格式
 */
function mapAsset(record: any): AssetData {
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    description: record.description,
    content: record.content,
    fileUrl: record.fileUrl,
    previewUrl: record.previewUrl,
    thumbnailUrl: record.thumbnailUrl,
    metadata: record.metadata,
    isSystem: record.isSystem,
    status: record.status,
    tags: record.tags,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export default {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getSystemAssets,
};