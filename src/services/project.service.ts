/**
 * 项目服务 - 处理数字人视频生成项目管理
 */
import { eq, and, desc, sql } from 'drizzle-orm';
import db from '../db/db';
import { projects, projectSteps, assets } from '../db/schema';

export type ProjectStatus = 'pending' | 'generating_audio' | 'generating_video' | 'completed' | 'failed';

export interface ProjectData {
  id: string;
  userId: string;
  title?: string;
  avatarId?: string;
  voiceId?: string;
  scriptId?: string;
  scriptContent?: string;
  emotion?: string;
  emotionMode?: string;
  emotionVector?: number[];
  emotionText?: string;
  emotionAlpha?: number;
  emotionAudioAssetId?: string;
  performancePrompt?: string;
  resolution?: string;
  useVoiceAudioDirectly?: boolean;
  videoGenerationMode?: string;
  storyboardAssetIds?: string[];
  referenceImageAssetIds?: string[];
  storyboardMode?: string;
  promptMode?: string;
  promptOnlyVideo?: boolean;
  language?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  status: ProjectStatus;
  progress: number;
  currentStep?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  assets?: {
    avatar?: any;
    voice?: any;
    script?: any;
  };
}

export interface CreateProjectInput {
  title?: string;
  avatarId: string;
  voiceId: string;
  scriptId?: string;
  scriptContent?: string;
  emotion?: string;
  emotionMode?: 'preset' | 'vector' | 'audio_ref' | 'text_ref';
  emotionVector?: number[];
  emotionText?: string;
  emotionAlpha?: number;
  emotionAudioAssetId?: string;
  performancePrompt?: string;
  resolution?: string;
  useVoiceAudioDirectly?: boolean;
  videoGenerationMode?: 'tts_required' | 'audio_sync';
  storyboardAssetIds?: string[];
  referenceImageAssetIds?: string[];
  storyboardMode?: 'none' | 'first_frame' | 'multi_image' | 'keyframes';
  promptMode?: 'script' | 'direct';
  promptOnlyVideo?: boolean;
  language?: 'zh' | 'en';
}

export interface ProjectStatusData {
  id: string;
  status: ProjectStatus;
  progress: number;
  currentStep: string;
  steps: Array<{
    name: string;
    status: string;
  }>;
  estimatedRemainingSeconds: number;
  error?: string;
}

/**
 * 获取项目列表
 */
export async function getProjects(
  userId: string,
  status?: ProjectStatus,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  list: ProjectData[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> {
  const offset = (page - 1) * pageSize;
  
  const conditions = [eq(projects.userId, userId)];
  
  if (status) {
    conditions.push(eq(projects.status, status));
  }

  const results = await db.select()
    .from(projects)
    .where(and(...conditions))
    .orderBy(desc(projects.createdAt))
    .limit(pageSize)
    .offset(offset);

  // 获取总数
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(and(...conditions));
  
  const total = countResult[0]?.count || 0;

  // 获取关联资产信息
  const projectsWithAssets = await Promise.all(
    results.map(async (project) => {
      const assetsData: any = {};
      
      if (project.avatarId) {
        const [avatar] = await db.select().from(assets).where(eq(assets.id, project.avatarId)).limit(1);
        if (avatar) assetsData.avatar = avatar;
      }
      
      if (project.voiceId) {
        const [voice] = await db.select().from(assets).where(eq(assets.id, project.voiceId)).limit(1);
        if (voice) assetsData.voice = voice;
      }
      
      if (project.scriptId) {
        const [script] = await db.select().from(assets).where(eq(assets.id, project.scriptId)).limit(1);
        if (script) assetsData.script = script;
      }

      return {
        ...mapProject(project),
        assets: assetsData,
      };
    })
  );

  return {
    list: projectsWithAssets,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * 获取单个项目
 */
export async function getProjectById(projectId: string, userId: string): Promise<ProjectData | null> {
  const [project] = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    return null;
  }

  // 获取关联资产
  const assetsData: any = {};
  
  if (project.avatarId) {
    const [avatar] = await db.select().from(assets).where(eq(assets.id, project.avatarId)).limit(1);
    if (avatar) assetsData.avatar = avatar;
  }
  
  if (project.voiceId) {
    const [voice] = await db.select().from(assets).where(eq(assets.id, project.voiceId)).limit(1);
    if (voice) assetsData.voice = voice;
  }
  
  if (project.scriptId) {
    const [script] = await db.select().from(assets).where(eq(assets.id, project.scriptId)).limit(1);
    if (script) assetsData.script = script;
  }

  return {
    ...mapProject(project),
    assets: assetsData,
  };
}

/**
 * 获取项目状态
 */
export async function getProjectStatus(projectId: string, userId: string): Promise<ProjectStatusData | null> {
  const [project] = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    return null;
  }

  // 获取项目步骤
  const steps = await db.select()
    .from(projectSteps)
    .where(eq(projectSteps.projectId, projectId))
    .orderBy(projectSteps.createdAt);

  return {
    id: project.id,
    status: project.status,
    progress: project.progress,
    currentStep: project.currentStep || '',
    steps: steps.map(step => ({
      name: step.stepName,
      status: step.status,
    })),
    estimatedRemainingSeconds: calculateRemainingTime(project.status, project.progress),
    error: project.error,
  };
}

/**
 * 创建项目
 */
export async function createProject(userId: string, input: CreateProjectInput): Promise<ProjectData> {
  // 验证资产是否存在且用户有权使用
  await validateAssets(userId, input);

  const [newProject] = await db.insert(projects)
    .values({
      userId,
      title: input.title,
      avatarId: input.avatarId,
      voiceId: input.voiceId,
      scriptId: input.scriptId,
      scriptContent: input.scriptContent,
      emotion: input.emotion,
      emotionMode: input.emotionMode,
      emotionVector: input.emotionVector,
      emotionText: input.emotionText,
      emotionAlpha: input.emotionAlpha,
      emotionAudioAssetId: input.emotionAudioAssetId,
      performancePrompt: input.performancePrompt,
      resolution: input.resolution || '480p',
      useVoiceAudioDirectly: input.useVoiceAudioDirectly,
      videoGenerationMode: input.videoGenerationMode || 'tts_required',
      storyboardAssetIds: input.storyboardAssetIds,
      referenceImageAssetIds: input.referenceImageAssetIds,
      storyboardMode: input.storyboardMode || 'none',
      promptMode: input.promptMode || 'script',
      promptOnlyVideo: input.promptOnlyVideo,
      language: input.language || 'zh',
      status: 'pending',
      progress: 0,
    })
    .returning();

  // 创建初始步骤
  const defaultSteps = ['prepare_assets', 'generate_audio', 'generate_video', 'finalize'];
  await db.insert(projectSteps)
    .values(
      defaultSteps.map(stepName => ({
        projectId: newProject.id,
        stepName,
        status: 'pending',
        progress: 0,
      }))
    );

  return mapProject(newProject);
}

/**
 * 删除项目
 */
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  const [existing] = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!existing) {
    throw new Error('项目不存在或无权删除');
  }

  // 删除项目步骤
  await db.delete(projectSteps).where(eq(projectSteps.projectId, projectId));
  
  // 删除项目
  await db.delete(projects).where(eq(projects.id, projectId));
}

/**
 * 更新项目状态
 */
export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  progress?: number,
  currentStep?: string,
  error?: string
): Promise<void> {
  await db.update(projects)
    .set({
      status,
      progress: progress,
      currentStep: currentStep,
      error: error,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));
}

/**
 * 更新项目步骤状态
 */
export async function updateStepStatus(
  projectId: string,
  stepName: string,
  status: string,
  progress?: number,
  error?: string
): Promise<void> {
  await db.update(projectSteps)
    .set({
      status,
      progress: progress,
      error: error,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projectSteps.projectId, projectId),
        eq(projectSteps.stepName, stepName)
      )
    );
}

/**
 * 验证资产
 */
async function validateAssets(userId: string, input: CreateProjectInput): Promise<void> {
  // 验证头像
  if (input.avatarId) {
    const [avatar] = await db.select()
      .from(assets)
      .where(
        and(
          eq(assets.id, input.avatarId),
          or(eq(assets.userId, userId), eq(assets.isSystem, true))
        )
      )
      .limit(1);
    
    if (!avatar) {
      throw new Error('头像不存在或无权使用');
    }
  }

  // 验证声音
  if (input.voiceId) {
    const [voice] = await db.select()
      .from(assets)
      .where(
        and(
          eq(assets.id, input.voiceId),
          or(eq(assets.userId, userId), eq(assets.isSystem, true))
        )
      )
      .limit(1);
    
    if (!voice) {
      throw new Error('声音不存在或无权使用');
    }
  }

  // 验证脚本
  if (input.scriptId) {
    const [script] = await db.select()
      .from(assets)
      .where(
        and(
          eq(assets.id, input.scriptId),
          or(eq(assets.userId, userId), eq(assets.isSystem, true))
        )
      )
      .limit(1);
    
    if (!script) {
      throw new Error('脚本不存在或无权使用');
    }
  }
}

/**
 * 计算预估剩余时间
 */
function calculateRemainingTime(status: ProjectStatus, progress: number): number {
  if (status === 'completed') return 0;
  if (status === 'failed') return 0;
  
  // 基于进度估算剩余时间（假设总时间约300秒）
  const estimatedTotalSeconds = 300;
  const remainingProgress = 100 - progress;
  
  return Math.ceil((remainingProgress / 100) * estimatedTotalSeconds);
}

/**
 * 映射数据库记录
 */
function mapProject(record: any): ProjectData {
  return {
    id: record.id,
    userId: record.userId,
    title: record.title,
    avatarId: record.avatarId,
    voiceId: record.voiceId,
    scriptId: record.scriptId,
    scriptContent: record.scriptContent,
    emotion: record.emotion,
    emotionMode: record.emotionMode,
    emotionVector: record.emotionVector,
    emotionText: record.emotionText,
    emotionAlpha: record.emotionAlpha,
    emotionAudioAssetId: record.emotionAudioAssetId,
    performancePrompt: record.performancePrompt,
    resolution: record.resolution,
    useVoiceAudioDirectly: record.useVoiceAudioDirectly,
    videoGenerationMode: record.videoGenerationMode,
    storyboardAssetIds: record.storyboardAssetIds,
    referenceImageAssetIds: record.referenceImageAssetIds,
    storyboardMode: record.storyboardMode,
    promptMode: record.promptMode,
    promptOnlyVideo: record.promptOnlyVideo,
    language: record.language,
    thumbnailUrl: record.thumbnailUrl,
    videoUrl: record.videoUrl,
    status: record.status,
    progress: record.progress,
    currentStep: record.currentStep,
    error: record.error,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export default {
  getProjects,
  getProjectById,
  getProjectStatus,
  createProject,
  deleteProject,
  updateProjectStatus,
  updateStepStatus,
};