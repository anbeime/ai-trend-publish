// 社交媒体代理云函数配置文件
// 说明：此文件仅在本地开发时使用，生产环境建议使用云开发环境变量

module.exports = {
  /**
   * 外部API服务地址
   *
   * 开发环境：本地服务
   *   http://localhost:8000
   *   http://192.168.x.x:8000 (局域网)
   *
   * 生产环境：公网服务（建议使用HTTPS）
   *   https://api.yourdomain.com
   *   https://your-uploader-api.com
   *
   * 注意：小程序正式环境必须使用HTTPS域名，并在微信公众平台配置服务器域名白名单
   */
  apiBaseUrl: "http://localhost:8000",

  /**
   * API超时时间（毫秒）
   *
   * 视频上传可能需要较长时间，建议设置为60-120秒
   */
  timeout: 60000, // 60秒

  /**
   * 是否启用调试模式
   *
   * true:  在控制台输出详细日志
   * false: 仅输出错误日志（生产环境）
   */
  debug: false,

  /**
   * 支持的社交媒体平台
   *
   * status: 'active' - 已支持
   *         'developing' - 开发中
   *         'planned' - 计划中
   */
  platforms: {
    douyin: {
      id: "douyin",
      name: "抖音",
      icon: "🎵",
      status: "active",
      maxSize: 500 * 1024 * 1024, // 500MB
      supportFormats: ["mp4", "mov", "avi"],
    },
    xiaohongshu: {
      id: "xiaohongshu",
      name: "小红书",
      icon: "📕",
      status: "active",
      maxSize: 200 * 1024 * 1024, // 200MB
      supportFormats: ["mp4", "mov"],
    },
    bilibili: {
      id: "bilibili",
      name: "B站",
      icon: "📺",
      status: "active",
      maxSize: 8 * 1024 * 1024 * 1024, // 8GB (会员)
      supportFormats: ["mp4", "flv", "avi", "mov", "wmv"],
    },
    kuaishou: {
      id: "kuaishou",
      name: "快手",
      icon: "🎥",
      status: "active",
      maxSize: 1024 * 1024 * 1024, // 1GB
      supportFormats: ["mp4", "mov", "avi"],
    },
    tiktok: {
      id: "tiktok",
      name: "TikTok",
      icon: "🎬",
      status: "active",
      maxSize: 2876 * 1024 * 1024, // 2.8GB
      supportFormats: ["mp4", "webm", "mov"],
    },
    baijiahao: {
      id: "baijiahao",
      name: "百家号",
      icon: "📰",
      status: "developing",
      maxSize: 0,
      supportFormats: [],
    },
    youtube: {
      id: "youtube",
      name: "YouTube",
      icon: "▶️",
      status: "planned",
      maxSize: 256 * 1024 * 1024 * 1024, // 256GB
      supportFormats: ["mp4", "mov", "wmv", "avi", "flv"],
    },
  },

  /**
   * 默认账号标识
   *
   * 如果外部API支持多账号管理，这里可以配置默认使用的账号
   */
  defaultAccount: "default",

  /**
   * 请求重试配置
   */
  retry: {
    maxAttempts: 3, // 最大重试次数
    retryDelay: 2000, // 重试延迟（毫秒）
    retryableStatusCodes: [408, 429, 500, 502, 503, 504], // 可重试的HTTP状态码
  },

  /**
   * 安全配置
   */
  security: {
    /**
     * 是否启用用户认证
     *
     * true:  检查用户登录状态（推荐生产环境启用）
     * false: 允许匿名访问（仅开发环境）
     */
    requireAuth: true,

    /**
     * 允许的域名白名单
     *
     * 防止外部API地址被篡改
     *
     * 空数组: 不限制（开发环境）
     * 非空:  仅允许白名单域名（生产环境）
     */
    allowedDomains: [
      // 'https://api.yourdomain.com',
      // 'https://your-uploader-api.com'
    ],
  },
};

/**
 * 获取平台配置
 */
function getPlatformConfig(platformId) {
  const platform = module.exports.platforms[platformId];

  if (!platform) {
    throw new Error(`不支持的平台: ${platformId}`);
  }

  return platform;
}

module.exports.getPlatformConfig = getPlatformConfig;

/**
 * 验证视频是否符合平台要求
 */
function validateVideo(platformId, videoInfo) {
  const platformConfig = getPlatformConfig(platformId);

  const errors = [];

  // 检查文件大小
  if (videoInfo.size > platformConfig.maxSize) {
    errors.push(
      `视频大小超过限制。最大: ${formatSize(platformConfig.maxSize)}, ` +
        `当前: ${formatSize(videoInfo.size)}`,
    );
  }

  // 检查文件格式
  const extension = videoInfo.name.split(".").pop().toLowerCase();
  if (!platformConfig.supportFormats.includes(extension)) {
    errors.push(
      `不支持的文件格式。支持: ${platformConfig.supportFormats.join(", ")}, ` +
        `当前: ${extension}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports.validateVideo = validateVideo;

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

module.exports.formatSize = formatSize;
