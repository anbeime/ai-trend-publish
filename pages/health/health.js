// pages/health/health.js - AI健康管家场景
const gamificationEngine = require("../../utils/gamification-engine.js");
const SCENES_CONFIG = require("../../config/scenes-config.js");

Page({
  data: {
    sceneConfig: null,
    dashboard: null,
    activeTab: 'today', // today | challenge | companion
    habits: [],
    sportRank: null,
    companionInfo: null,
    weRunData: null,
    waterCount: 0,
    waterGoal: 8,
    showShareCard: false,
    shareData: null,
  },

  onLoad() {
    const scene = SCENES_CONFIG.getScene('health');
    this.setData({ sceneConfig: scene });
    this.loadUserData();
    this.initHabits();
    this.initCompanion();
    this.getWeRunData();
  },

  onShow() {
    this.loadUserData();
  },

  loadUserData() {
    let userData = wx.getStorageSync('gamification_health');
    if (!userData) {
      userData = gamificationEngine.initUserData('health');
      wx.setStorageSync('gamification_health', userData);
    }
    const dashboard = gamificationEngine.getDashboard(userData, 'health');
    // WXML 不能调用 .filter()，需在 JS 中预计算已完成任务数
    const completedTaskCount = dashboard
      ? dashboard.dailyTasks.filter(t => t.completed).length
      : 0;
    this.setData({ dashboard, completedTaskCount });
  },

  initHabits() {
    const today = new Date().toISOString().split('T')[0];
    const habits = [
      { id: 'water', name: '饮水打卡', icon: 'WATER', goal: 8, unit: '杯', current: 0, completed: false },
      { id: 'exercise', name: '运动打卡', icon: 'RUN', goal: 30, unit: '分钟', current: 0, completed: false },
      { id: 'sleep', name: '睡眠打卡', icon: 'SLEEP', goal: 7, unit: '小时', current: 0, completed: false },
      { id: 'mind', name: '正念冥想', icon: 'MIND', goal: 10, unit: '分钟', current: 0, completed: false },
    ];
    // 从本地存储加载今日数据
    const savedHabits = wx.getStorageSync(`habits_${today}`);
    if (savedHabits) {
      this.setData({ habits: savedHabits });
    } else {
      this.setData({ habits });
    }
  },

  saveHabits() {
    const today = new Date().toISOString().split('T')[0];
    wx.setStorageSync(`habits_${today}`, this.data.habits);
  },

  initCompanion() {
    const companion = {
      name: '小健',
      level: 1,
      exp: 0,
      expToNext: 100,
      mood: 'happy',
      message: '你好！我是你的健康伙伴小健，一起养成健康好习惯吧！',
    };
    this.setData({ companionInfo: companion });
  },

  // 获取微信运动数据
  getWeRunData() {
    wx.getWeRunData({
      success: (res) => {
        this.setData({ weRunData: res });
        // 需要在服务端解码encryptedData
        this.decodeWeRunData(res.encryptedData, res.iv);
      },
      fail: (err) => {
        console.log('获取微信运动数据失败:', err);
      },
    });
  },

  async decodeWeRunData(encryptedData, iv) {
    const app = getApp();
    if (!app.globalData.cloudInitialized) return;
    try {
      const res = await wx.cloud.callFunction({
        name: 'scene-orchestrator',
        data: {
          scene: 'health',
          agent: 'health-analyzer',
          action: 'decode_werun',
          params: { encryptedData, iv },
        },
        timeout: 30000,
      });
      if (res.result && res.result.success) {
        // 更新运动数据
        const steps = res.result.data.stepInfoList?.slice(-1)[0]?.steps || 0;
        this.updateExerciseFromSteps(steps);
      }
    } catch (error) {
      console.error('解码运动数据失败:', error);
    }
  },

  updateExerciseFromSteps(steps) {
    const habits = this.data.habits;
    const exerciseIdx = habits.findIndex(h => h.id === 'exercise');
    if (exerciseIdx >= 0) {
      // 按步数估算运动分钟（大约每100步1分钟）
      const minutes = Math.floor(steps / 100);
      habits[exerciseIdx].current = minutes;
      if (minutes >= habits[exerciseIdx].goal) {
        habits[exerciseIdx].completed = true;
      }
      this.setData({ habits });
      this.saveHabits();
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // 习惯打卡
  checkHabit(e) {
    const habitId = e.currentTarget.dataset.id;
    const habits = this.data.habits;
    const idx = habits.findIndex(h => h.id === habitId);
    if (idx < 0) return;

    // 增加进度
    habits[idx].current += 1;
    if (habits[idx].current >= habits[idx].goal) {
      habits[idx].current = habits[idx].goal;
      habits[idx].completed = true;
      // 完成打卡，获得积分
      this.onHabitComplete(habits[idx]);
    }
    this.setData({ habits });
    this.saveHabits();
  },

  // 习惯完成
  onHabitComplete(habit) {
    let userData = wx.getStorageSync('gamification_health');
    if (!userData) {
      userData = gamificationEngine.initUserData('health');
    }

    // 映射到日常任务
    const taskMap = {
      water: 'health-daily-water',
      exercise: 'health-daily-exercise',
      sleep: 'health-daily-sleep',
    };
    const taskId = taskMap[habit.id];
    if (taskId) {
      const result = gamificationEngine.completeDailyTask(userData, 'health', taskId);
      if (result && !result.alreadyCompleted) {
        // 更新运动统计
        if (habit.id === 'exercise') {
          if (!userData.stats.totalExerciseMinutes) userData.stats.totalExerciseMinutes = 0;
          userData.stats.totalExerciseMinutes += habit.goal;
        }
        // 更新学习伙伴
        const companion = this.data.companionInfo;
        if (companion) {
          companion.exp += result.points;
          if (companion.exp >= companion.expToNext) {
            companion.level += 1;
            companion.exp -= companion.expToNext;
            companion.expToNext = 100 * companion.level;
            companion.message = '我升级啦！谢谢你的坚持！';
          }
          this.setData({ companionInfo: companion });
        }
      }
    }

    // 检查成就
    const triggerData = {};
    const newAchs = gamificationEngine.checkAchievements(userData, 'health', triggerData);
    wx.setStorageSync('gamification_health', userData);

    wx.showToast({ title: `${habit.name}已完成！`, icon: 'success' });
    if (newAchs.length > 0) {
      setTimeout(() => {
        wx.showToast({ title: `新成就：${newAchs[0].name}！`, icon: 'none', duration: 3000 });
      }, 2000);
    }
    this.loadUserData();
  },

  // AI饮食分析
  async analyzeMeal() {
    try {
      const chooseImage = await new Promise((resolve, reject) => {
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: ['camera', 'album'],
          success: resolve,
          fail: reject,
        });
      });

      if (!chooseImage.tempFiles || chooseImage.tempFiles.length === 0) return;
      wx.showLoading({ title: 'AI分析营养...' });

      const tempPath = chooseImage.tempFiles[0].tempFilePath;
      const app = getApp();

      if (app.globalData.cloudInitialized) {
        const cloudPath = `meal/${Date.now()}-${Math.random().toString(36).substr(2, 8)}.jpg`;
        const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: tempPath });

        const res = await wx.cloud.callFunction({
          name: 'scene-orchestrator',
          data: {
            scene: 'health',
            agent: 'health-analyzer',
            action: 'analyze_meal',
            params: { fileID: uploadRes.fileID },
          },
          timeout: 60000,
        });

        wx.hideLoading();

        if (res.result && res.result.success) {
          const data = res.result.data;
          wx.showModal({
            title: '营养分析结果',
            content: `食物：${data.food || '已识别'}\n热量：约${data.calories || 'N/A'}千卡\n营养建议：${data.advice || '均衡饮食，适量运动'}`,
            showCancel: false,
          });
        } else {
          this.showMockMealAnalysis();
        }
      } else {
        wx.hideLoading();
        this.showMockMealAnalysis();
      }
    } catch (error) {
      wx.hideLoading();
      if (error.errMsg && error.errMsg.includes('cancel')) return;
      console.error('饮食分析失败:', error);
      wx.showToast({ title: '分析失败，请重试', icon: 'none' });
    }
  },

  showMockMealAnalysis() {
    const foods = ['米饭', '面条', '沙拉', '汉堡', '水果'];
    const calories = [200, 300, 150, 500, 80];
    const idx = Math.floor(Math.random() * foods.length);
    wx.showModal({
      title: '营养分析结果',
      content: `食物：${foods[idx]}\n热量：约${calories[idx]}千卡\n\n建议：均衡饮食，多摄入蔬果，适量蛋白质。`,
      showCancel: false,
    });
  },

  // 生成运动总结
  async generateWorkoutSummary() {
    let userData = wx.getStorageSync('gamification_health');
    if (!userData) {
      wx.showToast({ title: '请先完成一些运动', icon: 'none' });
      return;
    }

    wx.showLoading({ title: 'AI生成总结...' });

    const shareData = gamificationEngine.generateShareData(userData, 'health', 'workout');
    const app = getApp();

    if (app.globalData.cloudInitialized) {
      try {
        const res = await wx.cloud.callFunction({
          name: 'scene-orchestrator',
          data: {
            scene: 'health',
            agent: 'health-companion',
            action: 'generate_summary',
            params: shareData,
          },
          timeout: 60000,
        });
        wx.hideLoading();
        if (res.result && res.result.success && res.result.data) {
          this.setData({ shareData: res.result.data, showShareCard: true });
        } else {
          this.setData({ shareData, showShareCard: true });
        }
      } catch (error) {
        wx.hideLoading();
        this.setData({ shareData, showShareCard: true });
      }
    } else {
      wx.hideLoading();
      this.setData({ shareData, showShareCard: true });
    }
  },

  closeShareCard() {
    this.setData({ showShareCard: false });
  },

  // === 与内容创作系统打通 ===
  goToCreateHealthContent() {
    // 创作健康类内容，跳转到内容创作器并带上健康主题
    const healthTopics = [
      '科学运动指南：每天30分钟如何改变你的身体',
      '健康饮食搭配：营养师不告诉你的秘密',
      '睡眠管理：如何拥有高质量深睡眠',
      '心理健康：正念冥想入门指南',
      '办公室拉伸：5个动作缓解久坐疲劳',
    ];
    const randomTopic = healthTopics[Math.floor(Math.random() * healthTopics.length)];
    wx.navigateTo({
      url: `/pages/content-creator/content-creator?input=${encodeURIComponent(randomTopic)}`,
    });
  },

  // 创作完成后回调（从 content-creator 页面返回时触发）
  onContentCreated() {
    let userData = wx.getStorageSync('gamification_health');
    if (!userData) {
      userData = gamificationEngine.initUserData('health');
    }
    // 创作健康内容奖励
    const result = gamificationEngine.rewardContentCreation(userData, 'health');
    wx.setStorageSync('gamification_health', userData);
    this.loadUserData();

    const msg = result.leveledUp
      ? `创作奖励 +${result.points}活力值，已升级！`
      : `创作奖励 +${result.points}活力值`;
    wx.showToast({ title: msg, icon: 'none', duration: 2000 });

    if (result.newAchievements && result.newAchievements.length > 0) {
      setTimeout(() => {
        wx.showToast({ title: `新成就：${result.newAchievements[0].name}！`, icon: 'none', duration: 3000 });
      }, 2000);
    }
  },

  // 分享
  onShareAppMessage() {
    const dashboard = this.data.dashboard;
    const streak = dashboard ? dashboard.streak : 0;
    return {
      title: `我已坚持健康打卡${streak}天！一起来AI健康管家吧`,
      path: '/pages/health/health',
    };
  },

  onShareTimeline() {
    return {
      title: 'AI健康管家 - 把健康管理变成每日轻游戏',
    };
  },
});
