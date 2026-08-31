/**
 * 游戏化引擎模块（精简版 - 健康场景专用）
 * 管理积分、等级、成就、任务、连击等游戏化功能
 * 与内容创作系统打通：创作健康类内容可获活力值
 */

const SCENES_CONFIG = require('../config/scenes-config.js');

/**
 * 游戏化引擎
 */
class GamificationEngine {
  constructor() {
    this.scenesConfig = SCENES_CONFIG;
  }

  /**
   * 初始化用户游戏化数据
   * @param {string} sceneKey - 场景key (health)
   * @returns {Object} 初始化数据
   */
  initUserData(sceneKey) {
    const scene = this.scenesConfig.getScene(sceneKey);
    if (!scene) return null;

    return {
      scene: sceneKey,
      totalPoints: 0,
      level: 1,
      streak: 0,
      lastActiveDate: null,
      achievements: [],
      dailyTasksCompleted: [],
      stats: {
        totalActions: 0,
        totalDays: 0,
        bestStreak: 0,
        totalCreations: 0,
        totalPublishes: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 添加积分
   * @param {Object} userData - 用户游戏化数据
   * @param {string} sceneKey - 场景key
   * @param {number} points - 积分数
   * @param {string} reason - 加分原因
   * @param {Object} metadata - 额外元数据
   * @returns {Object} 更新后的数据和升级信息
   */
  addPoints(userData, sceneKey, points, reason, metadata = {}) {
    const scene = this.scenesConfig.getScene(sceneKey);
    if (!scene) return { userData, leveledUp: false };

    const oldLevel = this.scenesConfig.getLevel(sceneKey, userData.totalPoints);
    userData.totalPoints += points;
    userData.stats.totalActions += 1;
    userData.updatedAt = new Date().toISOString();

    const newLevel = this.scenesConfig.getLevel(sceneKey, userData.totalPoints);
    const leveledUp = newLevel.current.level > oldLevel.current.level;

    if (leveledUp) {
      userData.level = newLevel.current.level;
    }

    // 检查连击
    const today = new Date().toISOString().split('T')[0];
    if (userData.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (userData.lastActiveDate === yesterday) {
        userData.streak += 1;
      } else {
        userData.streak = 1;
      }
      userData.lastActiveDate = today;
      userData.stats.totalDays += 1;
      if (userData.streak > userData.stats.bestStreak) {
        userData.stats.bestStreak = userData.streak;
      }
    }

    // 连击奖励
    let bonusPoints = 0;
    if (userData.streak >= 7) {
      bonusPoints = Math.floor(points * 0.5); // 7天以上连击加50%
    } else if (userData.streak >= 3) {
      bonusPoints = Math.floor(points * 0.2); // 3天以上连击加20%
    }
    userData.totalPoints += bonusPoints;

    return {
      userData,
      leveledUp,
      newLevel: newLevel,
      bonusPoints,
      streak: userData.streak,
      pointsAdded: points + bonusPoints,
    };
  }

  /**
   * 检查并授予成就
   * @param {Object} userData - 用户游戏化数据
   * @param {string} sceneKey - 场景key
   * @param {Object} triggerData - 触发数据
   * @returns {Array} 新获得的成就列表
   */
  checkAchievements(userData, sceneKey, triggerData = {}) {
    const scene = this.scenesConfig.getScene(sceneKey);
    if (!scene) return [];

    const achievements = scene.gamification.achievements;
    const newAchievements = [];

    for (const achievement of achievements) {
      if (userData.achievements.includes(achievement.id)) continue;

      let unlocked = false;

      switch (achievement.id) {
        case 'health-streak-7':
          unlocked = userData.streak >= 7;
          break;
        case 'health-streak-30':
          unlocked = userData.streak >= 30;
          break;
        case 'health-creator':
          unlocked = (userData.stats.totalCreations || 0) >= 10;
          break;
        case 'health-publisher':
          unlocked = (userData.stats.totalPublishes || 0) >= 5;
          break;
        case 'health-mind-keeper':
          unlocked = (triggerData.totalMindfulness || 0) >= 30;
          break;
        default:
          break;
      }

      if (unlocked) {
        userData.achievements.push(achievement.id);
        userData.totalPoints += achievement.points;
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  /**
   * 完成日常任务
   * @param {Object} userData - 用户游戏化数据
   * @param {string} sceneKey - 场景key
   * @param {string} taskId - 任务ID
   * @returns {Object} 任务完成结果
   */
  completeDailyTask(userData, sceneKey, taskId) {
    const scene = this.scenesConfig.getScene(sceneKey);
    if (!scene) return null;

    const task = scene.gamification.dailyTasks.find(t => t.id === taskId);
    if (!task) return null;

    const today = new Date().toISOString().split('T')[0];
    const taskRecord = `${taskId}_${today}`;

    if (userData.dailyTasksCompleted.includes(taskRecord)) {
      return { alreadyCompleted: true };
    }

    userData.dailyTasksCompleted.push(taskRecord);
    const result = this.addPoints(userData, sceneKey, task.points, `完成: ${task.name}`);

    return {
      task,
      points: task.points,
      bonusPoints: result.bonusPoints,
      streak: result.streak,
      leveledUp: result.leveledUp,
    };
  }

  /**
   * 创作内容奖励（与内容创作系统打通）
   * @param {Object} userData - 用户游戏化数据
   * @param {string} contentType - 内容类型
   * @returns {Object} 奖励结果
   */
  rewardContentCreation(userData, contentType = 'health') {
    const scene = this.scenesConfig.getScene('health');
    if (!scene) return null;

    const points = scene.gamification.contentCreationPoints;
    userData.stats.totalCreations = (userData.stats.totalCreations || 0) + 1;
    
    const result = this.addPoints(userData, 'health', points, '创作健康类内容');
    
    // 检查成就
    const newAchievements = this.checkAchievements(userData, 'health', {});

    return {
      points: result.pointsAdded,
      streak: result.streak,
      leveledUp: result.leveledUp,
      newAchievements,
    };
  }

  /**
   * 发布内容奖励
   * @param {Object} userData - 用户游戏化数据
   * @returns {Object} 奖励结果
   */
  rewardContentPublish(userData) {
    const scene = this.scenesConfig.getScene('health');
    if (!scene) return null;

    const points = scene.gamification.publishRewardPoints;
    userData.stats.totalPublishes = (userData.stats.totalPublishes || 0) + 1;
    
    const result = this.addPoints(userData, 'health', points, '发布健康类文章');
    const newAchievements = this.checkAchievements(userData, 'health', {});

    return {
      points: result.pointsAdded,
      streak: result.streak,
      leveledUp: result.leveledUp,
      newAchievements,
    };
  }

  /**
   * 获取运动段位
   * @param {number} totalSteps - 累计步数
   * @param {number} totalMinutes - 累计运动分钟
   * @returns {Object} 段位信息
   */
  getSportRank(totalSteps, totalMinutes) {
    const ranks = this.scenesConfig.health.sportRanks;
    let current = ranks[0];
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (totalSteps >= ranks[i].minSteps && totalMinutes >= ranks[i].minMinutes) {
        current = ranks[i];
        break;
      }
    }
    const next = ranks.find(r => r.minSteps > totalSteps || r.minMinutes > totalMinutes);
    return { current, next };
  }

  /**
   * 获取用户仪表盘数据
   * @param {Object} userData - 用户游戏化数据
   * @param {string} sceneKey - 场景key
   * @returns {Object} 仪表盘数据
   */
  getDashboard(userData, sceneKey) {
    const scene = this.scenesConfig.getScene(sceneKey);
    if (!scene) return null;

    const levelInfo = this.scenesConfig.getLevel(sceneKey, userData.totalPoints);
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = scene.gamification.dailyTasks.map(task => {
      const taskRecord = `${task.id}_${today}`;
      return {
        ...task,
        completed: userData.dailyTasksCompleted.includes(taskRecord),
      };
    });

    const achievements = scene.gamification.achievements.map(a => ({
      ...a,
      unlocked: userData.achievements.includes(a.id),
    }));

    return {
      sceneName: scene.name,
      pointName: scene.gamification.pointName,
      totalPoints: userData.totalPoints,
      level: levelInfo,
      streak: userData.streak,
      bestStreak: userData.stats.bestStreak,
      dailyTasks: todayTasks,
      achievements: achievements,
      totalActions: userData.stats.totalActions,
      totalDays: userData.stats.totalDays,
      totalCreations: userData.stats.totalCreations || 0,
      totalPublishes: userData.stats.totalPublishes || 0,
      sportRank: this.getSportRank(
        (userData.stats.totalSteps || 0),
        (userData.stats.totalExerciseMinutes || 0)
      ),
    };
  }

  /**
   * 生成分享卡片数据
   * @param {Object} userData - 用户游戏化数据
   * @param {string} shareType - 分享类型
   * @returns {Object} 分享数据
   */
  generateShareData(userData, shareType = 'achievement') {
    const scene = this.scenesConfig.getScene('health');
    if (!scene) return null;

    const levelInfo = this.scenesConfig.getLevel('health', userData.totalPoints);

    return {
      scene: scene.name,
      level: levelInfo.current.name,
      points: userData.totalPoints,
      pointName: scene.gamification.pointName,
      streak: userData.streak,
      shareType,
      title: `我已坚持健康打卡${userData.streak}天，达到${levelInfo.current.name}！`,
      desc: `累计获得${userData.totalPoints}${scene.gamification.pointName}，连续打卡${userData.streak}天。来和我一起管理健康吧！`,
    };
  }
}

// 导出单例
const gamificationEngine = new GamificationEngine();

module.exports = gamificationEngine;
