/**
 * 会员服务模块
 * 统一处理会员状态检查、额度消耗等功能
 * 
 * 已从云函数方案改造为本地存储方案
 */

class MemberService {
  constructor() {
    this.cache = null
    this.cacheTime = 0
    this.cacheExpiry = 60000 // 缓存有效期 60 秒
  }

  /**
   * 获取用户会员状态（本地存储方案）
   * @returns {Promise<Object>} 会员状态信息
   */
  async getStatus() {
    // 检查缓存
    if (this.cache && Date.now() - this.cacheTime < this.cacheExpiry) {
      return this.cache
    }

    try {
      // 从本地存储获取会员数据
      let memberData = wx.getStorageSync('member_status')

      if (!memberData) {
        memberData = {
          isMember: false,
          memberType: 'free',
          dailyUsed: 0,
          dailyQuota: 3,
          remainingToday: 3,
          credits: 0,
          benefits: {
            name: '免费用户',
            dailyQuota: 3
          },
          lastResetDate: new Date().toISOString().split('T')[0],
        }
        wx.setStorageSync('member_status', memberData)
      }

      // 检查是否需要重置每日额度
      const today = new Date().toISOString().split('T')[0]
      if (memberData.lastResetDate !== today) {
        memberData.dailyUsed = 0
        memberData.remainingToday = memberData.dailyQuota
        memberData.lastResetDate = today
        wx.setStorageSync('member_status', memberData)
      }

      this.cache = memberData
      this.cacheTime = Date.now()
      return this.cache
    } catch (error) {
      console.error('获取会员状态失败:', error)
      return this.getDefaultStatus()
    }
  }

  /**
   * 获取默认状态
   */
  getDefaultStatus() {
    return {
      isMember: false,
      memberType: 'free',
      dailyUsed: 0,
      dailyQuota: 3,
      remainingToday: 3,
      credits: 0,
      benefits: {
        name: '免费用户',
        dailyQuota: 3
      }
    }
  }

  /**
   * 检查是否有使用额度
   * @param {string} feature - 功能类型
   * @returns {Promise<Object>} 检查结果
   */
  async checkQuota(feature = 'content') {
    try {
      const status = await this.getStatus()

      if (status.isMember) {
        return {
          success: true,
          canUse: true,
          isMember: true,
          remaining: -1, // 会员无限
          message: '会员用户，无限使用'
        }
      }

      if (status.remainingToday > 0) {
        return {
          success: true,
          canUse: true,
          isMember: false,
          remaining: status.remainingToday,
          message: `今日剩余 ${status.remainingToday} 次`
        }
      }

      // 检查积分是否可用
      if (status.credits >= 10) {
        return {
          success: true,
          canUse: true,
          isMember: false,
          remaining: 0,
          useCredits: true,
          message: '免费额度已用完，可使用积分'
        }
      }

      return {
        success: true,
        canUse: false,
        isMember: false,
        remaining: 0,
        message: '今日免费额度已用完'
      }
    } catch (error) {
      console.error('检查额度失败:', error)
      return {
        success: false,
        canUse: false,
        message: '检查额度失败，请重试'
      }
    }
  }

  /**
   * 消耗使用额度
   * @param {string} feature - 功能类型
   * @returns {Promise<Object>} 消耗结果
   */
  async consumeQuota(feature = 'content') {
    try {
      const status = await this.getStatus()

      if (status.isMember) {
        return { success: true, message: '会员用户' }
      }

      if (status.remainingToday > 0) {
        status.remainingToday -= 1
        status.dailyUsed = (status.dailyUsed || 0) + 1
        wx.setStorageSync('member_status', status)
        this.clearCache()
        return { success: true, message: '消耗每日免费额度' }
      }

      // 使用积分
      if (status.credits >= 10) {
        status.credits -= 10
        wx.setStorageSync('member_status', status)
        this.clearCache()
        return { success: true, message: '消耗10积分' }
      }

      return { success: false, message: '额度不足' }
    } catch (error) {
      console.error('消耗额度失败:', error)
      return { success: false, message: '消耗额度失败' }
    }
  }

  /**
   * 显示额度不足提示
   * @param {Object} options - 配置选项
   */
  showQuotaExhausted(options = {}) {
    const {
      message = '今日免费额度已用完',
      showSubscribe = true
    } = options

    if (showSubscribe) {
      wx.showModal({
        title: '额度不足',
        content: `${message}，开通会员可无限使用`,
        confirmText: '开通会员',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/subscription/subscription'
            })
          }
        }
      })
    } else {
      wx.showToast({
        title: message,
        icon: 'none'
      })
    }
  }

  /**
   * 检查并消耗额度（一体化方法）
   * @param {string} feature - 功能类型
   * @returns {Promise<Object>} { success, message }
   */
  async checkAndConsume(feature = 'content') {
    const checkResult = await this.checkQuota(feature)

    if (!checkResult.success || !checkResult.canUse) {
      this.showQuotaExhausted({
        message: checkResult.message || '额度不足'
      })
      return { success: false, message: checkResult.message }
    }

    if (checkResult.isMember || checkResult.remaining > 0) {
      const consumeResult = await this.consumeQuota(feature)
      return consumeResult
    }

    if (checkResult.useCredits) {
      return new Promise((resolve) => {
        wx.showModal({
          title: '使用积分',
          content: '免费额度已用完，是否消耗10积分继续？',
          confirmText: '确认使用',
          cancelText: '取消',
          success: async (res) => {
            if (res.confirm) {
              const consumeResult = await this.consumeQuota(feature)
              resolve(consumeResult)
            } else {
              resolve({ success: false, message: '用户取消' })
            }
          }
        })
      })
    }

    return { success: false, message: '额度不足' }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache = null
    this.cacheTime = 0
  }

  /**
   * 格式化会员状态显示文本
   * @param {Object} status - 会员状态
   * @returns {string} 显示文本
   */
  formatStatusText(status) {
    if (status.isMember) {
      return status.benefits?.name || '会员'
    }
    return `今日剩余 ${status.remainingToday || 0} 次`
  }

  /**
   * 判断是否为会员
   * @returns {Promise<boolean>}
   */
  async isMember() {
    const status = await this.getStatus()
    return status.isMember
  }

  /**
   * 获取剩余次数
   * @returns {Promise<number>}
   */
  async getRemainingCount() {
    const status = await this.getStatus()
    return status.remainingToday || 0
  }
}

// 导出单例
const memberService = new MemberService()
module.exports = { memberService, MemberService }
