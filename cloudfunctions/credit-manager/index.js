const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

// 格式化日期
function formatDate(date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 初始化用户积分
async function initUserCredit(openid) {
  try {
    const existing = await db.collection('user_credits').where({
      _openid: openid
    }).get()
    
    if (existing.data.length === 0) {
      await db.collection('user_credits').add({
        data: {
          _openid: openid,
          credits: 100,
          coins: 50,
          dailyQuota: 3,
          dailyUsed: 0,
          lastResetDate: formatDate(new Date()),
          totalCreations: 0,
          level: 1,
          createTime: new Date()
        }
      })
      console.log('用户积分初始化成功:', openid)
    }
    return { success: true }
  } catch (error) {
    console.error('初始化积分失败:', error)
    return { success: false, error: error.message }
  }
}

// 消耗额度
async function consumeQuota(openid) {
  try {
    const today = formatDate(new Date())
    
    const user = await db.collection('user_credits').where({
      _openid: openid
    }).get()
    
    if (user.data.length === 0) {
      await initUserCredit(openid)
      return { success: true, isNewUser: true }
    }
    
    const userData = user.data[0]
    
    // 检查日期,重置日额度
    if (userData.lastResetDate !== today) {
      await db.collection('user_credits').where({
        _openid: openid
      }).update({
        data: {
          dailyUsed: 0,
          lastResetDate: today
        }
      })
    }
    
    // 重新获取用户数据
    const updatedUser = await db.collection('user_credits').where({
      _openid: openid
    }).get()
    
    const currentUserData = updatedUser.data[0]
    
    // 检查免费额度
    if (currentUserData.dailyUsed < currentUserData.dailyQuota) {
      await db.collection('user_credits').where({
        _openid: openid
      }).update({
        data: {
          dailyUsed: _.inc(1),
          totalCreations: _.inc(1)
        }
      })
      return { success: true, usedFree: true }
    }
    
    // 检查金币
    if (currentUserData.coins < 10) {
      return { success: false, message: '积分不足,需要10金币', remainingCoins: currentUserData.coins }
    }
    
    // 消耗金币
    await db.collection('user_credits').where({
      _openid: openid
    }).update({
        data: {
          coins: _.inc(-10),
          totalCreations: _.inc(1)
        }
    })
    
    return { success: true, usedCoins: true }
  } catch (error) {
    console.error('消耗额度失败:', error)
    return { success: false, error: error.message }
  }
}

// 获取用户积分
async function getUserCredits(openid) {
  try {
    const result = await db.collection('user_credits').where({
      _openid: openid
    }).get()
    
    if (result.data.length === 0) {
      return { success: true, data: null }
    }
    
    return { success: true, data: result.data[0] }
  } catch (error) {
    console.error('获取积分失败:', error)
    return { success: false, error: error.message }
  }
}

// 奖励积分
async function rewardCredits(openid, credits, coins) {
  try {
    await db.collection('user_credits').where({
      _openid: openid
    }).update({
      data: {
        credits: _.inc(credits),
        coins: _.inc(coins)
      }
    })
    return { success: true }
  } catch (error) {
    console.error('奖励积分失败:', error)
    return { success: false, error: error.message }
  }
}

// 主函数
exports.main = async (event, context) => {
  const { action, credits, coins } = event
  const { openid } = cloud.getWXContext()
  
  console.log('积分管理, action:', action, 'openid:', openid)
  
  if (action === 'consume') {
    return await consumeQuota(openid)
  }
  
  if (action === 'get') {
    return await getUserCredits(openid)
  }
  
  if (action === 'init') {
    return await initUserCredit(openid)
  }
  
  if (action === 'reward') {
    return await rewardCredits(openid, credits || 0, coins || 0)
  }
  
  return {
    success: false,
    message: '未知操作'
  }
}
