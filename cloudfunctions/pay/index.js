/**
 * 微信支付云函数
 * 支持会员订阅购买、积分充值等功能
 */
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

// 支付配置（需要替换为你的实际配置）
const payConfig = {
  appid: 'wx................',           // 小程序 AppID
  mchid: '16xxxxx',                     // 商户号
  partnerKey: 'xxxxxxxxxxxxxxxxxxxxxxxx', // API v2 密钥（32位）
  notifyUrl: 'https://xxx'              // 支付回调地址（云函数URL）
}

// 会员套餐配置
const MEMBERSHIP_PLANS = {
  monthly: {
    id: 'monthly',
    name: '月卡会员',
    price: 9.9,
    duration: 30, // 天
    features: ['无限内容生成', '优先客服支持', '高级模板'],
    dailyQuota: 999, // 每日额度
  },
  quarterly: {
    id: 'quarterly',
    name: '季卡会员',
    price: 26.9,
    duration: 90,
    features: ['无限内容生成', '优先客服支持', '高级模板', '专属素材库'],
    dailyQuota: 999,
  },
  yearly: {
    id: 'yearly',
    name: '年卡会员',
    price: 99,
    duration: 365,
    features: ['无限内容生成', '专属客服', '高级模板', '专属素材库', 'API接口'],
    dailyQuota: 999,
  }
}

// 积分充值配置
const CREDIT_PACKAGES = {
  pack10: { credits: 100, price: 9.9 },
  pack30: { credits: 350, price: 26.9 },
  pack50: { credits: 600, price: 39.9 },
  pack100: { credits: 1500, price: 69.9 },
}

/**
 * 生成订单号
 */
function generateOrderId() {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD${timestamp}${random}`
}

/**
 * 创建支付订单
 * @param {string} openid - 用户openid
 * @param {string} type - 订单类型 membership/credits
 * @param {string} planId - 套餐ID
 */
async function createPaymentOrder(openid, type, planId) {
  try {
    let orderData = {
      _openid: openid,
      orderId: generateOrderId(),
      type: type,
      status: 'pending',
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
    }

    let amount = 0

    if (type === 'membership') {
      const plan = MEMBERSHIP_PLANS[planId]
      if (!plan) {
        return { success: false, message: '无效的会员套餐' }
      }
      amount = plan.price
      orderData.planId = planId
      orderData.planName = plan.name
      orderData.duration = plan.duration
      orderData.amount = amount
    } else if (type === 'credits') {
      const pack = CREDIT_PACKAGES[planId]
      if (!pack) {
        return { success: false, message: '无效的积分套餐' }
      }
      amount = pack.price
      orderData.planId = planId
      orderData.credits = pack.credits
      orderData.amount = amount
    }

    // 创建订单记录
    await db.collection('orders').add({ data: orderData })

    console.log('订单创建成功:', orderData.orderId)

    return {
      success: true,
      orderId: orderData.orderId,
      amount: amount,
      type: type,
      planId: planId
    }
  } catch (error) {
    console.error('创建订单失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 模拟支付成功（开发测试用）
 * 生产环境需要接入真实的微信支付API
 */
async function mockPaymentSuccess(openid, orderId) {
  try {
    // 查询订单
    const orderResult = await db.collection('orders').where({
      orderId: orderId,
      _openid: openid
    }).get()

    if (orderResult.data.length === 0) {
      return { success: false, message: '订单不存在' }
    }

    const order = orderResult.data[0]

    if (order.status !== 'pending') {
      return { success: false, message: '订单状态异常' }
    }

    // 更新订单状态
    await db.collection('orders').where({
      orderId: orderId
    }).update({
      data: {
        status: 'paid',
        payTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    // 处理订单
    let result
    if (order.type === 'membership') {
      result = await activateMembership(openid, order)
    } else if (order.type === 'credits') {
      result = await addCredits(openid, order)
    }

    return { success: true, order: order, result: result }
  } catch (error) {
    console.error('处理支付失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 激活会员
 */
async function activateMembership(openid, order) {
  try {
    const plan = MEMBERSHIP_PLANS[order.planId]
    const now = new Date()
    const expireTime = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000)

    // 检查是否已有会员记录
    const memberResult = await db.collection('memberships').where({
      _openid: openid
    }).get()

    if (memberResult.data.length === 0) {
      // 创建新会员
      await db.collection('memberships').add({
        data: {
          _openid: openid,
          type: order.planId,
          typeName: plan.name,
          status: 'active',
          startTime: now,
          expireTime: expireTime,
          dailyQuota: plan.dailyQuota,
          createTime: db.serverDate()
        }
      })
    } else {
      // 续费会员
      const existing = memberResult.data[0]
      const newExpireTime = existing.status === 'active' && existing.expireTime > now
        ? new Date(existing.expireTime.getTime() + plan.duration * 24 * 60 * 60 * 1000)
        : expireTime

      await db.collection('memberships').where({
        _openid: openid
      }).update({
        data: {
          type: order.planId,
          typeName: plan.name,
          status: 'active',
          expireTime: newExpireTime,
          dailyQuota: plan.dailyQuota,
          updateTime: db.serverDate()
        }
      })
    }

    // 更新用户积分表
    await db.collection('user_credits').where({
      _openid: openid
    }).update({
      data: {
        dailyQuota: plan.dailyQuota,
        level: 2, // 会员等级
        memberType: order.planId,
        memberExpireTime: expireTime
      }
    })

    console.log('会员激活成功:', openid, order.planId)

    return {
      success: true,
      expireTime: expireTime,
      dailyQuota: plan.dailyQuota
    }
  } catch (error) {
    console.error('激活会员失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 添加积分
 */
async function addCredits(openid, order) {
  try {
    await db.collection('user_credits').where({
      _openid: openid
    }).update({
      data: {
        credits: _.inc(order.credits)
      }
    })

    console.log('积分添加成功:', openid, order.credits)

    return { success: true, credits: order.credits }
  } catch (error) {
    console.error('添加积分失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 查询会员状态
 */
async function getMembershipStatus(openid) {
  try {
    const result = await db.collection('memberships').where({
      _openid: openid
    }).get()

    if (result.data.length === 0) {
      return {
        success: true,
        isMember: false,
        data: null
      }
    }

    const member = result.data[0]
    const now = new Date()
    const isExpired = member.expireTime < now

    if (isExpired && member.status === 'active') {
      // 更新过期状态
      await db.collection('memberships').where({
        _openid: openid
      }).update({
        data: {
          status: 'expired',
          updateTime: db.serverDate()
        }
      })
      member.status = 'expired'
    }

    return {
      success: true,
      isMember: !isExpired,
      data: member
    }
  } catch (error) {
    console.error('查询会员状态失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 获取订单列表
 */
async function getOrderList(openid, limit = 20) {
  try {
    const result = await db.collection('orders')
      .where({ _openid: openid })
      .orderBy('createTime', 'desc')
      .limit(limit)
      .get()

    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 获取会员套餐列表
 */
function getMembershipPlans() {
  return {
    success: true,
    data: Object.values(MEMBERSHIP_PLANS)
  }
}

/**
 * 获取积分套餐列表
 */
function getCreditPackages() {
  return {
    success: true,
    data: Object.values(CREDIT_PACKAGES)
  }
}

// 主函数
exports.main = async (event, context) => {
  const { action, type, planId, orderId } = event
  const { openid } = cloud.getWXContext()

  console.log('支付云函数, action:', action, 'openid:', openid)

  switch (action) {
    case 'createOrder':
      return await createPaymentOrder(openid, type, planId)

    case 'mockPay':
      // 开发测试用，模拟支付成功
      return await mockPaymentSuccess(openid, orderId)

    case 'getMembershipStatus':
      return await getMembershipStatus(openid)

    case 'getMembershipPlans':
      return getMembershipPlans()

    case 'getCreditPackages':
      return getCreditPackages()

    case 'getOrderList':
      return await getOrderList(openid, event.limit)

    default:
      return {
        success: false,
        message: '未知操作'
      }
  }
}
