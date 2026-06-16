// 统一的智能体配置
// 所有页面都应该使用这个配置，确保一致性

const AGENTS_CONFIG = {
  // 智能体列表（按工作流顺序）
  agents: [
    {
      id: 'trendHunter',
      key: 'trendHunter',
      name: '热点追踪',
      shortName: '热点',
      icon: '🔥',
      color: '#ff4d4f',
      description: '监控热门内容，推荐选题',
      detailDescription: '实时监控全网热点内容，智能分析趋势，为您推荐最适合的创作选题',
      enabled: true,
      order: 1,
      category: 'content', // content: 内容创作, production: 制作, publish: 发布
    },
    {
      id: 'scriptWriter',
      key: 'scriptWriter',
      name: '脚本创作',
      shortName: '脚本',
      icon: '',
      color: '#1890ff',
      description: '生成结构化脚本和分镜',
      detailDescription: 'AI智能生成视频脚本，包含分镜描述、台词、场景等完整信息',
      enabled: true,
      order: 2,
      category: 'content',
    },
    {
      id: 'storyboard',
      key: 'storyboard',
      name: '分镜图片制作',
      shortName: '分镜',
      icon: '🎨',
      color: '#eb2f96',
      description: '生成分镜画面，保持角色一致性',
      detailDescription: '根据脚本生成分镜图片，支持双生图对比，确保角色一致性',
      enabled: true,
      order: 3,
      category: 'production',
    },
    {
      id: 'videoComposer',
      key: 'videoComposer',
      name: '视频合成',
      shortName: '合成',
      icon: '🎞️',
      color: '#722ed1',
      description: '合成分镜为视频，添加转场和配音',
      detailDescription: '将分镜图片合成为视频，添加转场效果、背景音乐和AI配音',
      enabled: false, // 功能未完成，暂时禁用
      order: 4,
      category: 'production',
    },
    {
      id: 'qualityChecker',
      key: 'qualityChecker',
      name: '质检审核',
      shortName: '质检',
      icon: '',
      color: '#52c41a',
      description: '检查素材完整性和内容合规',
      detailDescription: '自动检查视频素材的完整性、质量和内容合规性',
      enabled: true,
      order: 5,
      category: 'production',
    },
    {
      id: 'platformAdapter',
      key: 'platformAdapter',
      name: '平台适配',
      shortName: '适配',
      icon: '📱',
      color: '#fa8c16',
      description: '多平台时长、比例、标签适配',
      detailDescription: '根据不同平台要求，自动适配视频时长、比例和标签',
      enabled: true,
      order: 6,
      category: 'publish',
    },
    {
      id: 'autoPublisher',
      key: 'autoPublisher',
      name: '自动发布',
      shortName: '发布',
      icon: '🚀',
      color: '#13c2c2',
      description: '一键发布到各平台',
      detailDescription: '支持一键发布到微信公众号、抖音、快手等多个平台',
      enabled: true,
      order: 7,
      category: 'publish',
    },
  ],

  // 首页展示的智能体（显示所有启用的）
  homeAgents: [
    'trendHunter',      // 热点追踪
    'scriptWriter',     // 脚本创作
    'storyboard',       // 分镜图片制作
    'videoComposer',    // 视频合成
    'qualityChecker',   // 质检审核
    'platformAdapter',  // 平台适配
    'autoPublisher',    // 自动发布
  ],

  // 智能体分类
  categories: {
    content: {
      name: '内容创作',
      icon: '✍️',
      description: '创意和脚本创作阶段',
    },
    production: {
      name: '制作生产',
      icon: '🎬',
      description: '视频制作和质检阶段',
    },
    publish: {
      name: '发布分发',
      icon: '📢',
      description: '平台适配和发布阶段',
    },
  },

  // 根据ID获取智能体配置
  getAgentById(id) {
    return this.agents.find(agent => agent.id === id || agent.key === id);
  },

  // 获取启用的智能体
  getEnabledAgents() {
    return this.agents.filter(agent => agent.enabled);
  },

  // 获取首页展示的智能体
  getHomeAgents() {
    return this.homeAgents.map(id => this.getAgentById(id)).filter(Boolean);
  },

  // 根据分类获取智能体
  getAgentsByCategory(category) {
    return this.agents.filter(agent => agent.category === category && agent.enabled);
  },
};

module.exports = AGENTS_CONFIG;
