/**
 * 服务层导出 - 统一导出所有服务
 */

// 认证服务
export {
  register,
  loginWithPassword,
  loginWithGitHub,
  verifyToken,
  getCurrentUser,
  logout,
  UserPayload,
  AuthResult,
} from './auth.service';

// 用户服务
export {
  getUserProfile,
  updateProfile,
  changePassword,
  getUserUsageStats,
  UpdateProfileData,
  UserProfile,
} from './user.service';

// 资产服务
export {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getSystemAssets,
  AssetType,
  AssetStatus,
  AssetData,
  CreateAssetInput,
  AssetFilter,
  AssetListResult,
} from './asset.service';

// 项目服务
export {
  getProjects,
  getProjectById,
  getProjectStatus,
  createProject,
  deleteProject,
  updateProjectStatus,
  updateStepStatus,
  ProjectStatus,
  ProjectData,
  CreateProjectInput,
  ProjectStatusData,
} from './project.service';

// API配置服务
export {
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
  ApiCategory,
  ProviderField,
  Provider,
  CategoryProviders,
  ApiConfigData,
} from './api-config.service';

// 生成服务
export {
  generateAudioPreview,
  saveAudioPreview,
  generateScript,
  generateStoryboard,
  triggerVideoGeneration,
  getVideoGenerationStatus,
  AudioPreviewResult,
  ScriptGenerationResult,
  StoryboardGenerationResult,
} from './generation.service';

// 原有服务
export { VectorService } from './vector-service';
export { WorkflowConfigService } from './workflow-config.service';