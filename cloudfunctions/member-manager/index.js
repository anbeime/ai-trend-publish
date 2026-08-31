/**
 * 会员管理云函数
 * 处理会员状态检查、权益使用、额度管理等
 */
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

// 免费用户每日额度
const FREE_DAILY_QUOTA = 3

// 会员权益配置
const MEMBER_BENEFITS = {
  free: {
    name: '免费用户',
    dailyQuota: 3,
    features: ['基础内容生成', '每日3次免费试用'],
    templates: ['basic'],
    priority: 0
  },
  monthly: {
    name: '月卡会员',
    dailyQuota: 999,
    features: ['无限内容生成', '优先客服支持', '高级模板', 'TTS配音', '视频生成'],
    templates: ['basic', 'advanced', 'premium'],
    priority: 1
  },
  quarterly: {
    name: '季卡会员',
    dailyQuota: 999,
    features: ['无限内容生成', '专属客服', '高级模板', 'TTS配音', '视频生成', '专属素材库'],
    templates: ['basic', 'advanced', 'premium', 'exclusive'],
    priority: 2
  },
  yearly: {
    name: '年卡会员',
    dailyQuota: 999,
    features: ['无限内容生成', '专属客服', '高级模板', 'TTS配音', '视频生成', '专属素材库', 'API接口', '定制服务'],
    templates: ['basic', 'advanced', 'premium', 'exclusive', 'custom'],
    priority: 3
  }
}

/**
 * 格式化日期
 */
function formatDate(date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 检查并初始化用户
 */
async function ensureUserExists(openid) {
  const user = await db.collection('user_credits').where({
    _openid: openid
  }).get()

  if (user.data.length === 0) {
    await db.collection('user_credits').add({
      data: {
        _openid: openid,
        credits: 100,
        coins: 50,
        dailyQuota: FREE_DAILY_QUOTA,
        dailyUsed: 0,
        lastResetDate: formatDate(new Date()),
        totalCreations: 0,
        level: 1,
        memberType: 'free',
        memberExpireTime: null,
        createTime: db.serverDate()
      }
    })
    return {
      credits: 100,
      dailyQuota: FREE_DAILY_QUOTA,
      dailyUsed: 0,
      memberType: 'free'
    }
  }

  return user.data[0]
}

/**
 * 获取用户完整状态（包含会员信息）
 */
async function getUserFullStatus(openid) {
  try {
    // 确保用户存在
    const userData = await ensureUserExists(openid)
    const today = formatDate(new Date())

    // 检查会员状态
    const memberResult = await db.collection('memberships').where({
      _openid: openid
    }).get()

    let memberInfo = null
    let isActiveMember = false

    if (memberResult.data.length > 0) {
      const member = memberResult.data[0]
      const now = new Date()

      if (member.expireTime > now && member.status === 'active') {
        isActiveMember = true
        memberInfo = member
      } else if (member.status === 'active') {
        // 会员已过期，更新状态
        await db.collection('memberships').where({
          _openid: openid
        }).update({
          data: {
            status: 'expired',
            updateTime: db.serverDate()
          }
        })
      }
    }

    // 重置每日额度
    if (userData.lastResetDate !== today) {
      // 会员使用会员额度，非会员使用免费额度
      const quota = isActiveMember ? memberInfo.dailyQuota : FREE_DAILY_QUOTA

      await db.collection('user_credits').where({
        _openid: openid
      }).update({
        data: {
          dailyUsed: 0,
          dailyQuota: quota,
          lastResetDate: today
        }
      })

      userData.dailyUsed = 0
      userData.dailyQuota = quota
      userData.lastResetDate = today
    }

    // 获取权益配置
    const memberType = isActiveMember ? memberInfo.type : 'free'
    const benefits = MEMBER_BENEFITS[memberType] || MEMBER_BENEFITS.free

    return {
      success: true,
      data: {
        // 用户基础信息
        openid: openid,
        credits: userData.credits || 0,
        dailyUsed: userData.dailyUsed || 0,
        dailyQuota: userData.dailyQuota || FREE_DAILY_QUOTA,
        totalCreations: userData.totalCreations || 0,
        level: userData.level || 1,

        // 会员信息
        isMember: isActiveMember,
        memberType: memberType,
        memberInfo: memberInfo,

        // 权益信息
        benefits: benefits,
        remainingToday: Math.max(0, (userData.dailyQuota || FREE_DAILY_QUOTA) - (userData.dailyUsed || 0))
      }
    }
  } catch (error) {
    console.error('获取用户状态失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 检查是否可以使用功能
 */
async function checkQuota(openid, feature = 'content') {
  try {
    const status = await getUserFullStatus(openid)

    if (!status.success) {
      return status
    }

    const { remainingToday, isMember } = status.data

    // 会员无限制
    if (isMember) {
      return {
        success: true,
        canUse: true,
        remaining: 999,
        isMember: true
      }
    }

    // 免费用户检查剩余额度
    if (remainingToday > 0) {
      return {
        success: true,
        canUse: true,
        remaining: remainingToday,
        isMember: false
      }
    }

    // 检查积分是否足够
    if (status.data.credits >= 10) {
      return {
        success: true,
        canUse: true,
        remaining: 0,
        useCredits: true,
        isMember: false,
        message: '免费额度已用完，将消耗10积分'
      }
    }

    return {
      success: false,
      canUse: false,
      remaining: 0,
      message: '今日免费额度已用完，请充值或开通会员'
    }
  } catch (error) {
    console.error('检查额度失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 消耗额度
 */
async function consumeQuota(openid, feature = 'content') {
  try {
    const status = await getUserFullStatus(openid)

    if (!status.success) {
      return status
    }

    const { remainingToday, isMember, credits } = status.data

    // 会员无限制
    if (isMember) {
      // 仅记录使用次数
      await db.collection('user_credits').where({
        _openid: openid
      }).update({
        data: {
          dailyUsed: _.inc(1),
          totalCreations: _.inc(1)
        }
      })

      return {
        success: true,
        usedFree: false,
        usedCredits: false,
        isMember: true,
        message: '会员无限使用'
      }
    }

    // 免费用户有剩余额度
    if (remainingToday > 0) {
      await db.collection('user_credits').where({
        _openid: openid
      }).update({
        data: {
          dailyUsed: _.inc(1),
          totalCreations: _.inc(1)
        }
      })

      return {
        success: true,
        usedFree: true,
        usedCredits: false,
        remaining: remainingToday - 1,
        message: '使用免费额度'
      }
    }

    // 使用积分
    if (credits >= 10) {
      await db.collection('user_credits').where({
        _openid: openid
      }).update({
        data: {
          credits: _.inc(-10),
          totalCreations: _.inc(1)
        }
      })

      return {
        success: true,
        usedFree: false,
        usedCredits: true,
        remainingCredits: credits - 10,
        message: '消耗10积分'
      }
    }

    return {
      success: false,
      message: '额度不足，请充值或开通会员'
    }
  } catch (error) {
    console.error('消耗额度失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 获取会员权益列表
 */
function getMemberBenefits() {
  return {
    success: true,
    data: MEMBER_BENEFITS
  }
}

/**
 * 记录用户使用日志
 */
async function logUsage(openid, action, details = {}) {
  try {
    await db.collection('usage_logs').add({
      data: {
        _openid: openid,
        action: action,
        details: details,
        createTime: db.serverDate()
      }
    })
    return { success: true }
  } catch (error) {
    console.error('记录日志失败:', error)
    return { success: false, message: error.message }
  }
}

// 主函数
exports.main = async (event, context) => {
  const { action, feature } = event
  const { openid } = cloud.getWXContext()

  console.log('会员管理, action:', action, 'openid:', openid)

  switch (action) {
    case 'getStatus':
      return await getUserFullStatus(openid)

    case 'checkQuota':
      return await checkQuota(openid, feature)

    case 'consume':
      return await consumeQuota(openid, feature)

    case 'getBenefits':
      return getMemberBenefits()

    case 'logUsage':
      return await logUsage(openid, event.logAction, event.details)

    default:
      return {
        success: false,
        message: '未知操作'
      }
  }
}
