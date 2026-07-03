/**
 * API配置服务 - 处理用户自定义第三方服务配置
 */
import { eq, and, or, desc, sql } from 'drizzle-orm';
import db from '../db/db';
import { userApiConfigs, users } from '../db/schema';

export type ApiCategory = 'tts' | 'ai_image' | 'digital_human' | 'cloud_storage' | 'llm';

export interface ProviderField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select' | 'url';
  required: boolean;
  default?: string | number;
  placeholder?: string;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  sensitive: boolean;
}

export interface Provider {
  provider: string;
  display_name: string;
  description: string;
  category: string;
  website_url?: string;
  icon?: string;
  fields: ProviderField[];
}

export interface CategoryProviders {
  category: string;
  display_name: string;
  icon: string;
  providers: Provider[];
}

export interface ApiConfigData {
  id: string;
  userId: string | null;
  category: string;
  provider: string;
  displayName: string | null;
  configData: Record<string, unknown>;
  isActive: boolean;
  isDefault: boolean;
  isSystem: boolean;
  isValidated: boolean;
  lastValidatedAt: Date | null;
  validationError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 提供商定义
const PROVIDER_DEFINITIONS: CategoryProviders[] = [
  {
    category: 'tts',
    display_name: '语音合成',
    icon: 'volume_up',
    providers: [
      {
        provider: 'siliconflow_tts',
        display_name: 'SiliconFlow TTS',
        description: 'SiliconFlow 语音合成服务',
        category: 'tts',
        website_url: 'https://siliconflow.cn',
        fields: [
          { name: 'api_key', label: 'API Key', type: 'password', required: true, sensitive: true, placeholder: '请输入API密钥' },
          { name: 'base_url', label: 'Base URL', type: 'url', required: false, default: 'https://api.siliconflow.cn/v1', sensitive: false },
          { name: 'model', label: '模型', type: 'text', required: false, default: 'IndexTeam/IndexTTS-2', sensitive: false },
        ],
      },
      {
        provider: 'index_tts',
        display_name: 'Index TTS',
        description: 'Index 语音合成服务',
        category: 'tts',
        website_url: 'https://302.ai',
        fields: [
          { name: 'api_key', label: 'API Key', type: 'password', required: true, sensitive: true },
          { name: 'base_url', label: 'Base URL', type: 'url', required: false, default: 'https://api.302.ai', sensitive: false },
        ],
      },
    ],
  },
  {
    category: 'ai_image',
    display_name: 'AI 图像生成',
    icon: 'image',
    providers: [
      {
        provider: 'agnes_image',
        display_name: 'Agnes AI Image',
        description: 'Agnes AI 图像生成服务',
        category: 'ai_image',
        website_url: 'https://agnes-ai.com',
        fields: [
          { name: 'api_key', label: 'API Key', type: 'password', required: true, sensitive: true },
          { name: 'base_url', label: 'Base URL', type: 'url', required: false, default: 'https://apihub.agnes-ai.com/v1', sensitive: false },
          { name: 'model', label: '模型', type: 'text', required: false, default: 'agnes-image-2.1-flash', sensitive: false },
        ],
      },
      {
        provider: 'banana_pro',
        display_name: 'Banana Pro',
        description: 'Banana Pro AI 图像生成',
        category: 'ai_image',
        website_url: 'https://banana.pro',
        fields: [
          { name: 'api_key', label: 'API Key', type: 'password', required: true, sensitive: true },
          { name: 'base_url', label: 'Base URL', type: 'url', required: false, default: 'https://api.banana.pro/v1', sensitive: false },
        ],
      },
    ],
  },
  {
    category: 'digital_human',
    display_name: '数字人生成',
    icon: 'person',
    providers: [
      {
        provider: 'wavespeed',
        display_name: 'WaveSpeed',
        description: 'WaveSpeed 数字人视频生成',
        category: 'digital_human',
        website_url: 'https://302.ai',
        fields: [
          { name: 'api_key', label: 'API Key', type: 'password', required: true, sensitive: true },
          { name: 'base_url', label: 'Base URL', type: 'url', required: false, default: 'https://api.302.ai/ws/api/v3', sensitive: false },
          { name: 'resolution', label: '分辨率', type: 'select', required: false, default: '480p', sensitive: false, options: [
            { value: '480p', label: '480p' },
            { value: '720p', label: '720p' },
            { value: '1080p', label: '1080p' },
          ]},
        ],
      },
      {
        provider: 'ark_seedance',
        display_name: '火山引擎 Seedance',
        description: '火山引擎 Seedance 数字人生成',
        category: 'digital_human',
        website_url: 'https://www.volcengine.com',
        fields: [
          { name: 'api_key', label: 'API Key', type: 'password', required: true, sensitive: true },
          { name: 'base_url', label: 'Base URL', type: 'url', required: false, default: 'https://ark.cn-beijing.volces.com/api/v3', sensitive: false },
          { name: 'model', label: '模型', type: 'text', required: false, default: 'doubao-seedance-1-5-pro-251215', sensitive: false },
        ],
      },
    ],
  },
  {
    category: 'cloud_storage',
    display_name: '云存储',
    icon: 'cloud',
    providers: [
      {
        provider: 'aliyun_oss',
        display_name: '阿里云 OSS',
        description: '阿里云对象存储服务',
        category: 'cloud_storage',
        website_url: 'https://www.aliyun.com/product/oss',
        fields: [
          { name: 'access_key_id', label: 'Access Key ID', type: 'text', required: true, sensitive: true },
          { name: 'access_key_secret', label: 'Access Key Secret', type: 'password', required: true, sensitive: true },
          { name: 'bucket_name', label: 'Bucket名称', type: 'text', required: true, sensitive: false },
          { name: 'endpoint', label: 'Endpoint', type: 'url', required: true, sensitive: false },
          { name: 'region', label: '区域', type: 'text', required: false, default: 'cn-beijing', sensitive: false },
        ],
      },
      {
        provider: 'imgbb',
        display_name: 'ImgBB',
        description: 'ImgBB 图床服务',
        category: 'cloud_storage',
        website_url: 'https://imgbb.com',
        fields: [
          { name: 'api_key', label: 'API Key', type: 'password', required: true, sensitive: true },
        ],
      },
    ],
  },
  {
    category: 'llm',
    display_name: '大语言模型',
    icon: 'chat',
    providers: [
      {
        provider: 'glm',
        display_name: '智谱 GLM',
        description: '智谱AI GLM大模型',
        category: 'llm',
        website_url: 'https://open.bigmodel.cn',
        fields: [
          { name: 'api_key', label: 'API Key', type: 'password', required: true, sensitive: true },
          { name: 'model', label: '模型', type: 'text', required: false, default: 'glm-4.7', sensitive: false },
        ],
      },
      {
        provider: 'agnes_llm',
        display_name: 'Agnes LLM',
        description: 'Agnes AI 大语言模型',
        category: 'llm',
        website_url: 'https://agnes-ai.com',
        fields: [
          { name: 'api_key', label: 'API Key', type: 'password', required: true, sensitive: true },
          { name: 'base_url', label: 'Base URL', type: 'url', required: false, default: 'https://apihub.agnes-ai.com/v1', sensitive: false },
          { name: 'model', label: '模型', type: 'text', required: false, default: 'agnes-2.0-flash', sensitive: false },
        ],
      },
    ],
  },
];

/**
 * 获取所有提供商定义
 */
export function getAllProviders(): { categories: CategoryProviders[] } {
  return { categories: PROVIDER_DEFINITIONS };
}

/**
 * 获取特定类别的提供商
 */
export function getProvidersForCategory(category: string): CategoryProviders | null {
  return PROVIDER_DEFINITIONS.find(c => c.category === category) || null;
}

/**
 * 获取用户的API配置列表
 */
export async function listConfigs(
  userId: string,
  category?: string,
  includeSystem: boolean = true,
  page: number = 1,
  pageSize: number = 50
): Promise<{
  list: ApiConfigData[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> {
  const offset = (page - 1) * pageSize;
  
  const conditions = [];
  
  if (includeSystem) {
    conditions.push(
      or(
        eq(userApiConfigs.userId, userId),
        eq(userApiConfigs.isSystem, true)
      )
    );
  } else {
    conditions.push(eq(userApiConfigs.userId, userId));
  }
  
  if (category) {
    conditions.push(eq(userApiConfigs.category, category));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const results = await db.select()
    .from(userApiConfigs)
    .where(whereClause)
    .orderBy(desc(userApiConfigs.createdAt))
    .limit(pageSize)
    .offset(offset);

  // 获取总数
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(userApiConfigs)
    .where(whereClause);
  
  const total = countResult[0]?.count || 0;

  return {
    list: results.map(mapConfig),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * 按类别分组获取配置
 */
export async function getConfigsByCategory(userId: string): Promise<Array<{
  category: string;
  display_name: string;
  icon: string;
  configs: Array<{
    id: string;
    category: string;
    provider: string;
    display_name: string | null;
    is_active: boolean;
    is_default: boolean;
    is_system: boolean;
    is_validated: boolean;
  }>;
  has_default: boolean;
  default_provider: string | null;
}>> {
  const results = await db.select()
    .from(userApiConfigs)
    .where(
      or(
        eq(userApiConfigs.userId, userId),
        eq(userApiConfigs.isSystem, true)
      )
    );

  // 按类别分组
  const grouped: Record<string, any[]> = {};
  for (const config of results) {
    if (!grouped[config.category]) {
      grouped[config.category] = [];
    }
    grouped[config.category].push(config);
  }

  // 构建响应
  return PROVIDER_DEFINITIONS.map(categoryDef => {
    const configs = (grouped[categoryDef.category] || []).map(c => ({
      id: c.id,
      category: c.category,
      provider: c.provider,
      display_name: c.displayName,
      is_active: c.isActive,
      is_default: c.isDefault,
      is_system: c.isSystem,
      is_validated: c.isValidated,
    }));

    const defaultConfig = configs.find(c => c.is_default);
    
    return {
      category: categoryDef.category,
      display_name: categoryDef.display_name,
      icon: categoryDef.icon,
      configs,
      has_default: !!defaultConfig,
      default_provider: defaultConfig?.provider || null,
    };
  });
}

/**
 * 获取单个配置
 */
export async function getConfig(
  configId: string,
  userId: string,
  includeDecrypted: boolean = false
): Promise<ApiConfigData | null> {
  const [config] = await db.select()
    .from(userApiConfigs)
    .where(
      and(
        eq(userApiConfigs.id, configId),
        or(
          eq(userApiConfigs.userId, userId),
          eq(userApiConfigs.isSystem, true)
        )
      )
    )
    .limit(1);

  if (!config) {
    return null;
  }

  const result = mapConfig(config);
  
  // 如果需要解密，对敏感字段进行掩码处理
  if (includeDecrypted) {
    result.configData = maskSensitiveFields(result.configData, config.category, config.provider);
  } else {
    // 不显示配置数据
    result.configData = {};
  }

  return result;
}

/**
 * 创建配置
 */
export async function createConfig(
  userId: string,
  category: string,
  provider: string,
  configData: Record<string, unknown>,
  displayName?: string,
  setAsDefault: boolean = false
): Promise<ApiConfigData> {
  // 验证提供商是否存在
  const categoryDef = PROVIDER_DEFINITIONS.find(c => c.category === category);
  if (!categoryDef) {
    throw new Error(`不支持的配置类别: ${category}`);
  }

  const providerDef = categoryDef.providers.find(p => p.provider === provider);
  if (!providerDef) {
    throw new Error(`不支持的提供商: ${provider}`);
  }

  // 验证必填字段
  for (const field of providerDef.fields) {
    if (field.required && !configData[field.name]) {
      throw new Error(`缺少必填字段: ${field.label}`);
    }
  }

  // 如果设置为默认，先清除该类别下的其他默认配置
  if (setAsDefault) {
    await db.update(userApiConfigs)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(userApiConfigs.userId, userId),
          eq(userApiConfigs.category, category)
        )
      );
  }

  const [newConfig] = await db.insert(userApiConfigs)
    .values({
      userId,
      category,
      provider,
      displayName: displayName || providerDef.display_name,
      configData,
      isActive: true,
      isDefault: setAsDefault,
      isSystem: false,
      isValidated: false,
    })
    .returning();

  return mapConfig(newConfig);
}

/**
 * 更新配置
 */
export async function updateConfig(
  configId: string,
  userId: string,
  displayName?: string,
  configData?: Record<string, unknown>,
  isActive?: boolean
): Promise<ApiConfigData> {
  // 检查配置所有权
  const [existing] = await db.select()
    .from(userApiConfigs)
    .where(
      and(
        eq(userApiConfigs.id, configId),
        eq(userApiConfigs.userId, userId),
        eq(userApiConfigs.isSystem, false)
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error('配置不存在或无权修改');
  }

  const [updated] = await db.update(userApiConfigs)
    .set({
      displayName,
      configData: configData || existing.configData,
      isActive: isActive ?? existing.isActive,
      updatedAt: new Date(),
    })
    .where(eq(userApiConfigs.id, configId))
    .returning();

  return mapConfig(updated);
}

/**
 * 删除配置
 */
export async function deleteConfig(configId: string, userId: string): Promise<void> {
  const [existing] = await db.select()
    .from(userApiConfigs)
    .where(
      and(
        eq(userApiConfigs.id, configId),
        eq(userApiConfigs.userId, userId),
        eq(userApiConfigs.isSystem, false)
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error('配置不存在或无权删除');
  }

  await db.delete(userApiConfigs).where(eq(userApiConfigs.id, configId));
}

/**
 * 设置默认配置
 */
export async function setDefaultConfig(configId: string, userId: string): Promise<ApiConfigData> {
  const [config] = await db.select()
    .from(userApiConfigs)
    .where(
      and(
        eq(userApiConfigs.id, configId),
        or(
          eq(userApiConfigs.userId, userId),
          eq(userApiConfigs.isSystem, true)
        )
      )
    )
    .limit(1);

  if (!config) {
    throw new Error('配置不存在');
  }

  // 清除该类别下的其他默认配置
  await db.update(userApiConfigs)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(
      and(
        eq(userApiConfigs.userId, userId),
        eq(userApiConfigs.category, config.category)
      )
    );

  // 设置当前配置为默认
  const [updated] = await db.update(userApiConfigs)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(eq(userApiConfigs.id, configId))
    .returning();

  return mapConfig(updated);
}

/**
 * 获取用户或系统的有效配置（用于运行时）
 */
export async function getUserOrSystemConfig(
  userId: string,
  category: string,
  provider?: string
): Promise<Record<string, unknown> | null> {
  // 首先查找用户的默认配置
  const conditions = [
    eq(userApiConfigs.category, category),
    eq(userApiConfigs.isDefault, true),
    eq(userApiConfigs.isActive, true),
  ];

  if (provider) {
    conditions.push(eq(userApiConfigs.provider, provider));
  }

  // 查找用户配置
  const [userConfig] = await db.select()
    .from(userApiConfigs)
    .where(
      and(
        eq(userApiConfigs.userId, userId),
        ...conditions
      )
    )
    .limit(1);

  if (userConfig) {
    return userConfig.configData as Record<string, unknown>;
  }

  // 查找系统配置
  const [systemConfig] = await db.select()
    .from(userApiConfigs)
    .where(
      and(
        eq(userApiConfigs.isSystem, true),
        ...conditions
      )
    )
    .limit(1);

  if (systemConfig) {
    return systemConfig.configData as Record<string, unknown>;
  }

  return null;
}

/**
 * 对敏感字段进行掩码处理
 */
function maskSensitiveFields(
  data: Record<string, unknown>,
  category: string,
  provider: string
): Record<string, unknown> {
  const categoryDef = PROVIDER_DEFINITIONS.find(c => c.category === category);
  if (!categoryDef) return data;

  const providerDef = categoryDef.providers.find(p => p.provider === provider);
  if (!providerDef) return data;

  const maskedData: Record<string, unknown> = {};
  
  for (const field of providerDef.fields) {
    const value = data[field.name];
    
    if (field.sensitive && value && typeof value === 'string') {
      // 对敏感字段进行掩码：显示前4位和后4位
      if (value.length > 8) {
        maskedData[field.name] = value.slice(0, 4) + '****' + value.slice(-4);
      } else {
        maskedData[field.name] = '****';
      }
    } else {
      maskedData[field.name] = value;
    }
  }

  return maskedData;
}

/**
 * 映射数据库记录
 */
function mapConfig(record: any): ApiConfigData {
  return {
    id: record.id,
    userId: record.userId,
    category: record.category,
    provider: record.provider,
    displayName: record.displayName,
    configData: record.configData,
    isActive: record.isActive,
    isDefault: record.isDefault,
    isSystem: record.isSystem,
    isValidated: record.isValidated,
    lastValidatedAt: record.lastValidatedAt,
    validationError: record.validationError,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export default {
  getAllProviders,
  getProvidersForCategory,
  listConfigs,
  getConfigsByCategory,
  getConfig,
  createConfig,
  updateConfig,
  deleteConfig,
  setDefaultConfig,
  getUserOrSystemConfig,
};