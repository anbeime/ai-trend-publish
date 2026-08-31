/**
 * 场景配置 - 健康场景（与内容创作系统深度结合）
 * 健康打卡激励用户持续创作，创作健康类内容可获活力值
 */

const SCENES_CONFIG = {
  // === 健康场景 ===
  health: {
    key: 'health',
    name: 'AI健康管家',
    shortName: '健康',
    icon: 'HEALTH',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    description: '习惯打卡、运动挑战、AI健康陪伴',
    detailDescription: '将健康管理设计为每日轻游戏，通过渐进式挑战和情感化陪伴提升健康行为依从性。与内容创作系统打通，创作健康类内容可获活力值奖励。',

    // 场景智能体
    agents: [
      {
        key: 'health-habit',
        name: 'AI习惯追踪',
        icon: 'HABIT',
        description: '喝水、用药、运动等习惯打卡与连击激励',
        promptRole: '习惯管理师',
      },
      {
        key: 'health-analyzer',
        name: 'AI健康分析',
        icon: 'ANALYZE',
        description: '分析运动、饮食照片，提供营养与运动建议',
        promptRole: '健康分析师',
      },
      {
        key: 'health-companion',
        name: 'AI健康陪伴',
        icon: 'COMPANION',
        description: '情感化陪伴，生成运动总结视频与鼓励',
        promptRole: '健康陪伴者',
      },
      {
        key: 'health-planner',
        name: 'AI计划生成',
        icon: 'PLAN',
        description: '基于个人数据生成渐进式运动挑战计划',
        promptRole: '健康规划师',
      },
    ],

    // 游戏化规则
    gamification: {
      pointName: '活力值',
      pointUnit: '点',
      // 每日打卡基础积分
      checkinPoints: 10,
      // 创作健康类内容额外奖励
      contentCreationPoints: 30,
      // 内容发布成功奖励
      publishRewardPoints: 20,
      levelSystem: [
        { level: 1, name: '健康新手', minPoints: 0, icon: 'NEWBIE' },
        { level: 2, name: '运动爱好者', minPoints: 100, icon: 'LOVER' },
        { level: 3, name: '健身达人', minPoints: 500, icon: 'EXPERT' },
        { level: 4, name: '运动健将', minPoints: 1500, icon: 'ATHLETE' },
        { level: 5, name: '马拉松跑者', minPoints: 3000, icon: 'RUNNER' },
        { level: 6, name: '健康冠军', minPoints: 6000, icon: 'CHAMPION' },
      ],
      achievements: [
        { id: 'health-streak-7', name: '七日连胜', condition: '连续7天打卡', points: 100, icon: 'STREAK7' },
        { id: 'health-streak-30', name: '坚持30天', condition: '连续30天打卡', points: 500, icon: 'STREAK30' },
        { id: 'health-creator', name: '健康创作者', condition: '创作10篇健康类内容', points: 300, icon: 'CREATOR' },
        { id: 'health-publisher', name: '健康传播者', condition: '发布5篇健康类文章', points: 400, icon: 'PUBLISHER' },
        { id: 'health-mind-keeper', name: '心灵守护者', condition: '完成30次正念冥想', points: 300, icon: 'MIND' },
      ],
      dailyTasks: [
        { id: 'health-daily-checkin', name: '每日健康打卡', points: 10, type: 'checkin' },
        { id: 'health-daily-water', name: '每日饮水8杯', points: 15, type: 'water' },
        { id: 'health-daily-exercise', name: '运动30分钟', points: 25, type: 'exercise' },
        { id: 'health-daily-create', name: '创作1篇健康内容', points: 30, type: 'create' },
      ],
    },

    // 运动段位体系
    sportRanks: [
      { rank: 1, name: '散步新手', minSteps: 0, minMinutes: 0 },
      { rank: 2, name: '健走达人', minSteps: 50000, minMinutes: 150 },
      { rank: 3, name: '慢跑者', minSteps: 150000, minMinutes: 450 },
      { rank: 4, name: '跑步爱好者', minSteps: 300000, minMinutes: 900 },
      { rank: 5, name: '马拉松跑者', minSteps: 600000, minMinutes: 1800 },
    ],
  },

  // === 获取场景配置 ===
  getScene(key) {
    return this[key];
  },

  // 获取场景等级
  getLevel(sceneKey, points) {
    const scene = this[sceneKey];
    if (!scene) return null;
    const levels = scene.gamification.levelSystem;
    let currentLevel = levels[0];
    for (let i = levels.length - 1; i >= 0; i--) {
      if (points >= levels[i].minPoints) {
        currentLevel = levels[i];
        break;
      }
    }
    const nextLevel = levels.find(l => l.minPoints > points);
    return {
      current: currentLevel,
      next: nextLevel,
      progress: nextLevel
        ? Math.round(((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100)
        : 100,
      pointsToNext: nextLevel ? nextLevel.minPoints - points : 0,
    };
  },
};

module.exports = SCENES_CONFIG;
