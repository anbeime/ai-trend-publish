// cloudfunctions/gamification-engine/index.js
// 健康场景游戏化后端服务 - 处理云端积分、排行榜、成就同步

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// === 健康场景等级配置 ===
const LEVEL_CONFIG = {
  pointName: '活力值',
  levels: [
    { level: 1, name: '健康新手', minPoints: 0 },
    { level: 2, name: '运动爱好者', minPoints: 100 },
    { level: 3, name: '健身达人', minPoints: 500 },
    { level: 4, name: '运动健将', minPoints: 1500 },
    { level: 5, name: '马拉松跑者', minPoints: 3000 },
    { level: 6, name: '健康冠军', minPoints: 6000 },
  ],
};

// === 主入口 ===
exports.main = async (event, context) => {
  const { action, params = {} } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    switch (action) {
      case 'sync':
        return await syncUserData(openid, params);
      case 'get_dashboard':
        return await getDashboard(openid);
      case 'get_leaderboard':
        return await getLeaderboard(params);
      case 'add_points':
        return await addPoints(openid, params);
      case 'check_achievements':
        return await checkAchievements(openid, params);
      case 'complete_task':
        return await completeTask(openid, params.taskId);
      case 'reward_creation':
        return await rewardCreation(openid);
      case 'reward_publish':
        return await rewardPublish(openid);
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (error) {
    console.error('Gamification engine error:', error);
    return { success: false, error: error.message };
  }
};

// === 同步用户数据 ===
async function syncUserData(openid, params) {
  const existing = await db.collection('gamification_health')
    .where({ openid })
    .get();

  if (existing.data.length === 0) {
    const newData = {
      openid,
      totalPoints: params.totalPoints || 0,
      streak: params.streak || 0,
      lastActiveDate: params.lastActiveDate,
      achievements: params.achievements || [],
      dailyTasksCompleted: params.dailyTasksCompleted || [],
      stats: params.stats || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('gamification_health').add({ data: newData });
    return { success: true, data: newData };
  } else {
    const recordId = existing.data[0]._id;
    const updateData = {
      totalPoints: params.totalPoints || existing.data[0].totalPoints,
      streak: params.streak || existing.data[0].streak,
      lastActiveDate: params.lastActiveDate || existing.data[0].lastActiveDate,
      achievements: params.achievements || existing.data[0].achievements,
      dailyTasksCompleted: params.dailyTasksCompleted || existing.data[0].dailyTasksCompleted,
      stats: params.stats || existing.data[0].stats,
      updatedAt: new Date(),
    };

    await db.collection('gamification_health').doc(recordId).update({ data: updateData });
    return { success: true, data: { ...existing.data[0], ...updateData } };
  }
}

// === 获取仪表盘 ===
async function getDashboard(openid) {
  const result = await db.collection('gamification_health')
    .where({ openid })
    .get();

  if (result.data.length === 0) {
    return { success: true, data: null };
  }

  const userData = result.data[0];
  const levelInfo = getLevelInfo(userData.totalPoints);

  return {
    success: true,
    data: {
      ...userData,
      level: levelInfo,
      pointName: LEVEL_CONFIG.pointName,
    },
  };
}

// === 获取排行榜 ===
async function getLeaderboard(params) {
  const { type = 'global', limit = 50 } = params;
  const result = await db.collection('gamification_health')
    .orderBy('totalPoints', 'desc')
    .limit(limit)
    .get();

  return { success: true, data: result.data };
}

// === 添加积分 ===
async function addPoints(openid, params) {
  const { points, reason } = params;
  if (!points) return { success: false, error: '参数不完整' };

  const existing = await db.collection('gamification_health')
    .where({ openid })
    .get();

  if (existing.data.length === 0) {
    return { success: false, error: '用户数据不存在，请先同步' };
  }

  const record = existing.data[0];
  const oldLevel = getLevelInfo(record.totalPoints);
  const newTotal = record.totalPoints + points;
  const newLevel = getLevelInfo(newTotal);
  const leveledUp = newLevel.current.level > oldLevel.current.level;

  await db.collection('gamification_health').doc(record._id).update({
    data: {
      totalPoints: newTotal,
      updatedAt: new Date(),
    },
  });

  try {
    await db.collection('point_logs').add({
      data: {
        openid,
        points,
        reason: reason || '',
        totalBefore: record.totalPoints,
        totalAfter: newTotal,
        leveledUp,
        createdAt: new Date(),
      },
    });
  } catch (e) {
    console.warn('日志记录失败:', e);
  }

  return {
    success: true,
    data: {
      pointsAdded: points,
      totalPoints: newTotal,
      leveledUp,
      newLevel: newLevel,
    },
  };
}

// === 创作内容奖励 ===
async function rewardCreation(openid) {
  const points = 30;
  const existing = await db.collection('gamification_health')
    .where({ openid })
    .get();

  if (existing.data.length === 0) {
    return { success: false, error: '用户数据不存在' };
  }

  const record = existing.data[0];
  const stats = record.stats || {};
  stats.totalCreations = (stats.totalCreations || 0) + 1;

  const result = await addPoints(openid, { points, reason: '创作健康类内容' });

  await db.collection('gamification_health').doc(record._id).update({
    data: { stats },
  });

  return { success: true, data: { ...result.data, totalCreations: stats.totalCreations } };
}

// === 发布内容奖励 ===
async function rewardPublish(openid) {
  const points = 20;
  const existing = await db.collection('gamification_health')
    .where({ openid })
    .get();

  if (existing.data.length === 0) {
    return { success: false, error: '用户数据不存在' };
  }

  const record = existing.data[0];
  const stats = record.stats || {};
  stats.totalPublishes = (stats.totalPublishes || 0) + 1;

  const result = await addPoints(openid, { points, reason: '发布健康类文章' });

  await db.collection('gamification_health').doc(record._id).update({
    data: { stats },
  });

  return { success: true, data: { ...result.data, totalPublishes: stats.totalPublishes } };
}

// === 检查成就 ===
async function checkAchievements(openid, params) {
  const result = await db.collection('gamification_health')
    .where({ openid })
    .get();

  if (result.data.length === 0) {
    return { success: true, data: { newAchievements: [] } };
  }

  return {
    success: true,
    data: {
      achievements: result.data[0].achievements || [],
      newAchievements: [],
    },
  };
}

// === 完成任务 ===
async function completeTask(openid, taskId) {
  const today = new Date().toISOString().split('T')[0];
  const taskRecord = `${taskId}_${today}`;

  const result = await db.collection('gamification_health')
    .where({ openid })
    .get();

  if (result.data.length === 0) {
    return { success: false, error: '用户数据不存在' };
  }

  const record = result.data[0];
  const completedTasks = record.dailyTasksCompleted || [];

  if (completedTasks.includes(taskRecord)) {
    return { success: true, data: { alreadyCompleted: true } };
  }

  completedTasks.push(taskRecord);

  await db.collection('gamification_health').doc(record._id).update({
    data: {
      dailyTasksCompleted: completedTasks,
      updatedAt: new Date(),
    },
  });

  return {
    success: true,
    data: {
      taskId,
      completed: true,
    },
  };
}

// === 辅助函数 ===
function getLevelInfo(points) {
  const levels = LEVEL_CONFIG.levels;
  let current = levels[0];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i].minPoints) {
      current = levels[i];
      break;
    }
  }
  const next = levels.find(l => l.minPoints > points);
  return {
    current,
    next,
    progress: next
      ? Math.round(((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100)
      : 100,
    pointsToNext: next ? next.minPoints - points : 0,
  };
}
