// trial-manager.js - 试用次数管理模块（基于微信登录 + 会员系统）
const TRIAL_STORAGE_KEY = "trial_usage";
const DAILY_FREE_LIMIT = 3; // 每日免费次数

// 是否启用云端会员服务
let cloudMemberEnabled = true;

/**
 * 试用次数管理器
 * 基于微信用户身份识别，每个用户每天3次免费试用
 * 支持会员无限使用
 */
class TrialManager {
  constructor() {
    this.cache = null;
    this.openid = null;
    this.memberCache = null; // 会员状态缓存
  }

  /**
   * 获取用户唯一标识（微信openid）
   */
  async getUserIdentifier() {
    if (this.openid) {
      return this.openid;
    }

    // 先尝试从缓存获取
    const cachedOpenid = wx.getStorageSync('user_openid');
    if (cachedOpenid) {
      this.openid = cachedOpenid;
      return cachedOpenid;
    }

    // 通过云开发获取用户openid
    try {
      const res = await wx.cloud.callFunction({
        name: 'credit-manager',
        data: { action: 'getOpenId' }
      });
      
      if (res.result && res.result.openid) {
        this.openid = res.result.openid;
        wx.setStorageSync('user_openid', res.result.openid);
        console.log("[Trial] 获取用户openid成功:", res.result.openid.substring(0, 8) + "...");
        return res.result.openid;
      }
    } catch (e) {
      console.warn("[Trial] 获取openid失败，使用本地标识:", e.message);
    }

    // 降级方案：生成本地唯一标识
    let localId = wx.getStorageSync('local_device_id');
    if (!localId) {
      localId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      wx.setStorageSync('local_device_id', localId);
    }
    this.openid = localId;
    return localId;
  }

  /**
   * 检查会员状态（云端）
   * @returns {Promise<Object>} { isMember, dailyQuota, ... }
   */
  async checkMemberStatus() {
    // 如果已缓存会员状态，直接返回
    if (this.memberCache && this.memberCache.expireTime > Date.now()) {
      return this.memberCache.data;
    }

    // 尝试从云端获取会员状态
    if (cloudMemberEnabled) {
      try {
        const res = await wx.cloud.callFunction({
          name: 'member-manager',
          data: { action: 'getStatus' }
        });

        if (res.result && res.result.success) {
          const memberData = res.result.data;
          
          // 缓存会员状态（60秒有效）
          this.memberCache = {
            data: memberData,
            expireTime: Date.now() + 60000
          };

          return memberData;
        }
      } catch (e) {
        console.warn("[Trial] 获取会员状态失败:", e.message);
        // 不禁用云端服务，只是这次失败
        // cloudMemberEnabled = false;
      }
    }

    // 返回默认免费用户状态
    return {
      isMember: false,
      dailyUsed: 0,
      dailyQuota: DAILY_FREE_LIMIT,
      remainingToday: DAILY_FREE_LIMIT,
      benefits: { name: '免费用户', dailyQuota: DAILY_FREE_LIMIT }
    };
  }

  /**
   * 获取今日日期字符串 (YYYY-MM-DD)
   */
  getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  /**
   * 获取存储键名（基于用户）
   */
  getStorageKey() {
    return TRIAL_STORAGE_KEY;
  }

  /**
   * 加载试用数据（基于用户身份）
   */
  async loadTrialData() {
    if (this.cache) {
      return this.cache;
    }

    const userId = await this.getUserIdentifier();
    const storageKey = `${TRIAL_STORAGE_KEY}_${userId}`;

    try {
      const data = wx.getStorageSync(storageKey);
      if (data) {
        this.cache = typeof data === 'string' ? JSON.parse(data) : data;
      } else {
        this.cache = {
          userId: userId,
          dailyUsage: {},
          totalUsed: 0,
          firstUseDate: null,
          lastUseDate: null,
        };
      }
      return this.cache;
    } catch (e) {
      console.error("[Trial] 加载试用数据失败:", e);
      return {
        userId: userId,
        dailyUsage: {},
        totalUsed: 0,
        firstUseDate: null,
        lastUseDate: null,
      };
    }
  }

  /**
   * 保存试用数据
   */
  async saveTrialData(data) {
    const userId = await this.getUserIdentifier();
    const storageKey = `${TRIAL_STORAGE_KEY}_${userId}`;
    
    try {
      wx.setStorageSync(storageKey, data);
      this.cache = data;
    } catch (e) {
      console.error("[Trial] 保存试用数据失败:", e);
    }
  }

  /**
   * 获取今日已使用次数
   */
  async getTodayUsed() {
    // 优先使用云端数据
    const memberStatus = await this.checkMemberStatus();
    if (memberStatus.dailyUsed !== undefined) {
      return memberStatus.dailyUsed;
    }

    // 降级到本地数据
    const data = await this.loadTrialData();
    const today = this.getTodayKey();
    return data.dailyUsage[today] || 0;
  }

  /**
   * 获取今日剩余免费次数
   */
  async getTodayRemaining() {
    // 检查会员状态
    const memberStatus = await this.checkMemberStatus();
    
    // 会员无限制
    if (memberStatus.isMember) {
      return 999;
    }

    // 使用云端数据
    if (memberStatus.remainingToday !== undefined) {
      return memberStatus.remainingToday;
    }

    // 降级到本地数据
    const used = await this.getTodayUsed();
    const quota = memberStatus.dailyQuota || DAILY_FREE_LIMIT;
    return Math.max(0, quota - used);
  }

  /**
   * 检查是否还有免费次数
   */
  async hasFreeTrial() {
    const memberStatus = await this.checkMemberStatus();
    if (memberStatus.isMember) {
      return true;
    }
    const remaining = await this.getTodayRemaining();
    return remaining > 0;
  }

  /**
   * 记录一次使用（云端优先）
   * @returns {Object} { success: boolean, remaining: number, needPay: boolean }
   */
  async recordUsage() {
    const memberStatus = await this.checkMemberStatus();

    // 如果是会员，云端处理，本地不计数
    if (memberStatus.isMember) {
      try {
        const res = await wx.cloud.callFunction({
          name: 'member-manager',
          data: { action: 'consume', feature: 'content' }
        });
        
        if (res.result && res.result.success) {
          // 清除会员缓存
          this.memberCache = null;
          return {
            success: true,
            remaining: 999,
            needPay: false,
            isMember: true,
            message: "会员无限使用"
          };
        }
      } catch (e) {
        console.warn("[Trial] 云端消耗失败:", e.message);
      }
    }

    // 本地记录（免费用户或云端失败时）
    const data = await this.loadTrialData();
    const today = this.getTodayKey();

    // 初始化今日使用次数
    if (!data.dailyUsage[today]) {
      data.dailyUsage[today] = 0;
    }

    // 记录首次使用日期
    if (!data.firstUseDate) {
      data.firstUseDate = today;
    }
    data.lastUseDate = today;

    // 检查是否还有免费次数
    const todayUsed = data.dailyUsage[today];
    const dailyQuota = memberStatus.dailyQuota || DAILY_FREE_LIMIT;
    
    if (todayUsed < dailyQuota) {
      // 还有免费次数，记录使用
      data.dailyUsage[today] = todayUsed + 1;
      data.totalUsed += 1;
      await this.saveTrialData(data);

      const remaining = dailyQuota - data.dailyUsage[today];
      console.log(`[Trial] 使用成功，今日剩余免费次数: ${remaining}`);

      return {
        success: true,
        remaining: remaining,
        needPay: false,
        isMember: false,
        message: remaining > 0 ? `今日还剩 ${remaining} 次免费机会` : "今日免费次数已用完",
      };
    }

    // 免费次数已用完，需要付费
    console.log("[Trial] 免费次数已用完，需要付费");
    return {
      success: false,
      remaining: 0,
      needPay: true,
      isMember: false,
      message: "今日免费次数已用完，请开通会员",
    };
  }

  /**
   * 显示付费提示（支持跳转订阅页面）
   * @param {string} feature - 功能名称
   */
  showPayPrompt(feature = "此功能") {
    wx.showModal({
      title: "试用次数已用完",
      content: `今日${DAILY_FREE_LIMIT}次免费试用已用完\n\n开通会员享无限使用:\n- 月卡 ¥9.9/月\n- 季卡 ¥26.9/季（推荐）\n- 年卡 ¥99/年`,
      confirmText: "开通会员",
      cancelText: "稍后再说",
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/subscription/subscription'
          });
        }
      },
    });
  }

  /**
   * 获取使用统计
   */
  async getStats() {
    const memberStatus = await this.checkMemberStatus();
    const data = await this.loadTrialData();
    
    return {
      userId: data.userId,
      isMember: memberStatus.isMember,
      memberType: memberStatus.memberType || 'free',
      todayUsed: await this.getTodayUsed(),
      todayRemaining: await this.getTodayRemaining(),
      totalUsed: data.totalUsed || 0,
      firstUseDate: data.firstUseDate,
      lastUseDate: data.lastUseDate,
      dailyLimit: memberStatus.dailyQuota || DAILY_FREE_LIMIT,
      benefits: memberStatus.benefits || { name: '免费用户' }
    };
  }

  /**
   * 重置试用数据（仅用于测试）
   */
  async resetForTest() {
    this.cache = null;
    this.memberCache = null;
    cloudMemberEnabled = true;
    const userId = await this.getUserIdentifier();
    const storageKey = `${TRIAL_STORAGE_KEY}_${userId}`;
    wx.removeStorageSync(storageKey);
    console.log("[Trial] 试用数据已重置");
  }

  /**
   * 检查并执行试用检查
   * 在调用付费功能前调用此方法
   * @param {string} feature - 功能名称
   * @returns {Promise<boolean>} 是否可以使用
   */
  async checkAndConsume(feature = "功能") {
    // 检查会员状态
    const memberStatus = await this.checkMemberStatus();
    
    // 会员直接允许使用
    if (memberStatus.isMember) {
      console.log("[Trial] 会员用户，无限使用");
      return true;
    }

    const remaining = await this.getTodayRemaining();
    
    if (remaining <= 0) {
      this.showPayPrompt(feature);
      return false;
    }

    // 提示剩余次数
    if (remaining <= 3) {
      wx.showToast({
        title: remaining === 1 ? "最后一次免费机会" : `今日还剩 ${remaining} 次免费机会`,
        icon: "none",
        duration: 1500,
      });
    }

    return true;
  }

  /**
   * 同步版本的检查方法（用于不支持async的场景）
   * 使用缓存的数据
   */
  checkAndConsumeSync(feature = "功能") {
    // 如果有会员缓存，直接通过
    if (this.memberCache && this.memberCache.data && this.memberCache.data.isMember) {
      return true;
    }

    // 从缓存获取
    const data = this.cache || wx.getStorageSync(TRIAL_STORAGE_KEY) || { dailyUsage: {} };
    const today = this.getTodayKey();
    const used = data.dailyUsage[today] || 0;
    const remaining = Math.max(0, DAILY_FREE_LIMIT - used);
    
    if (remaining <= 0) {
      this.showPayPrompt(feature);
      return false;
    }

    if (remaining <= 3) {
      wx.showToast({
        title: remaining === 1 ? "最后一次免费机会" : `今日还剩 ${remaining} 次免费机会`,
        icon: "none",
        duration: 1500,
      });
    }

    return true;
  }

  /**
   * 清除会员缓存
   */
  clearMemberCache() {
    this.memberCache = null;
  }
}

// 导出单例
const trialManager = new TrialManager();
module.exports = trialManager;
module.exports.TrialManager = TrialManager;
module.exports.DAILY_FREE_LIMIT = DAILY_FREE_LIMIT;
