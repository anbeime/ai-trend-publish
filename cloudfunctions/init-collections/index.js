/**
 * 初始化数据库集合
 * 创建项目需要的所有集合
 */
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()

// 需要创建的集合列表
const COLLECTIONS = [
  'wechat_accounts',  // 公众号账号配置
  'system_cache',     // 系统缓存
  'user_credits',     // 用户积分
  'memberships',      // 会员信息
  'orders',           // 订单记录
  'projects',         // 项目管理
  'templates',        // 模板管理
  'video_tasks',      // 视频任务
  'creation_history', // 创作历史
  'usage_logs'        // 使用日志
]

exports.main = async (event, context) => {
  const results = []
  
  for (const collectionName of COLLECTIONS) {
    try {
      // 尝试向集合添加一条测试数据来创建集合
      const result = await db.collection(collectionName).add({
        data: {
          _init: true,
          createTime: db.serverDate()
        }
      })
      
      // 立即删除测试数据
      await db.collection(collectionName).doc(result._id).remove()
      
      results.push({
        collection: collectionName,
        status: 'created',
        success: true
      })
      
      console.log(`✅ 集合 ${collectionName} 创建成功`)
    } catch (error) {
      // 如果集合已存在，会报错，但不影响
      if (error.message.includes('already exists') || error.errCode === -1) {
        results.push({
          collection: collectionName,
          status: 'exists',
          success: true
        })
        console.log(`ℹ️ 集合 ${collectionName} 已存在`)
      } else {
        results.push({
          collection: collectionName,
          status: 'error',
          success: false,
          error: error.message
        })
        console.error(`❌ 集合 ${collectionName} 创建失败:`, error.message)
      }
    }
  }
  
  return {
    success: true,
    message: '数据库集合初始化完成',
    results
  }
}
