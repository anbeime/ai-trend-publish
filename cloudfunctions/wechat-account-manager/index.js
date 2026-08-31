/**
 * 微信公众号账号管理云函数
 * 处理公众号配置的增删改查，数据持久化存储到云数据库
 */
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()
const _ = db.command

/**
 * 获取用户的所有公众号配置
 */
async function getAccounts(openid) {
  console.log('getAccounts called with openid:', openid)
  
  if (!openid) {
    console.error('getAccounts: openid is undefined')
    return { success: false, message: '用户未登录或openid获取失败' }
  }
  
  try {
    const result = await db.collection('wechat_accounts').where({
      _openid: openid
    }).orderBy('createTime', 'desc').get()

    console.log('getAccounts result:', result.data.length, 'accounts')
    
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error('获取公众号配置失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 添加或更新公众号配置
 */
async function saveAccount(openid, account) {
  console.log('saveAccount called with openid:', openid, 'account:', JSON.stringify(account))
  
  if (!openid) {
    console.error('saveAccount: openid is undefined')
    return { success: false, message: '用户未登录或openid获取失败' }
  }
  
  try {
    const { app_id, name, app_secret, avatar } = account

    if (!app_id || !name || !app_secret) {
      return { success: false, message: '缺少必要参数' }
    }

    // 检查是否已存在
    const existing = await db.collection('wechat_accounts').where({
      _openid: openid,
      app_id: app_id
    }).get()

    const now = db.serverDate()
    const accountData = {
      app_id,
      name,
      app_secret,
      avatar: avatar || '',
      updateTime: now
    }

    if (existing.data.length > 0) {
      // 更新
      await db.collection('wechat_accounts').where({
        _openid: openid,
        app_id: app_id
      }).update({
        data: accountData
      })

      console.log('saveAccount: updated existing account')
      
      return {
        success: true,
        message: '更新成功',
        data: { ...accountData, _id: existing.data[0]._id }
      }
    } else {
      // 新增
      const result = await db.collection('wechat_accounts').add({
        data: {
          ...accountData,
          _openid: openid,
          createTime: now,
          isSelected: false
        }
      })

      console.log('saveAccount: created new account with _id:', result._id)
      
      return {
        success: true,
        message: '添加成功',
        data: { ...accountData, _id: result._id }
      }
    }
  } catch (error) {
    console.error('保存公众号配置失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 删除公众号配置
 */
async function deleteAccount(openid, app_id) {
  console.log('deleteAccount called with openid:', openid, 'app_id:', app_id)
  
  if (!openid) {
    return { success: false, message: '用户未登录或openid获取失败' }
  }
  
  try {
    const result = await db.collection('wechat_accounts').where({
      _openid: openid,
      app_id: app_id
    }).remove()

    if (result.stats.removed > 0) {
      return { success: true, message: '删除成功' }
    } else {
      return { success: false, message: '未找到该配置' }
    }
  } catch (error) {
    console.error('删除公众号配置失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 设置当前选中的公众号
 */
async function setSelectedAccount(openid, app_id) {
  console.log('setSelectedAccount called with openid:', openid, 'app_id:', app_id)
  
  if (!openid) {
    return { success: false, message: '用户未登录或openid获取失败' }
  }
  
  try {
    // 先取消所有选中
    await db.collection('wechat_accounts').where({
      _openid: openid
    }).update({
      data: { isSelected: false }
    })

    // 再选中指定的
    if (app_id) {
      await db.collection('wechat_accounts').where({
        _openid: openid,
        app_id: app_id
      }).update({
        data: { isSelected: true }
      })
    }

    console.log('setSelectedAccount: success')
    return { success: true, message: '设置成功' }
  } catch (error) {
    console.error('设置选中公众号失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 获取当前选中的公众号
 */
async function getSelectedAccount(openid) {
  console.log('getSelectedAccount called with openid:', openid)
  
  if (!openid) {
    return { success: false, message: '用户未登录或openid获取失败' }
  }
  
  try {
    const result = await db.collection('wechat_accounts').where({
      _openid: openid,
      isSelected: true
    }).get()

    if (result.data.length > 0) {
      console.log('getSelectedAccount: found selected account')
      return { success: true, data: result.data[0] }
    } else {
      // 如果没有选中的，返回第一个
      const allAccounts = await db.collection('wechat_accounts').where({
        _openid: openid
      }).orderBy('createTime', 'desc').limit(1).get()

      if (allAccounts.data.length > 0) {
        // 自动选中第一个
        await setSelectedAccount(openid, allAccounts.data[0].app_id)
        console.log('getSelectedAccount: auto selected first account')
        return { success: true, data: allAccounts.data[0] }
      }

      console.log('getSelectedAccount: no accounts found')
      return { success: false, message: '没有配置公众号' }
    }
  } catch (error) {
    console.error('获取选中公众号失败:', error)
    return { success: false, message: error.message }
  }
}

// 主函数
exports.main = async (event, context) => {
  const { action, account, app_id, clientOpenId } = event
  
  // 获取 openid - 多种方式尝试
  const wxContext = cloud.getWXContext()
  
  // 优先级：客户端传来的 clientOpenId > wxContext.openid > wxContext.FROM_OPENID
  let openid = clientOpenId || wxContext.openid || wxContext.FROM_OPENID
  
  // 如果还是没有，生成一个默认值
  if (!openid) {
    console.warn('警告：无法获取 openid，使用默认值')
    openid = 'default_user_' + Date.now()
  }
  
  console.log('=== 公众号管理云函数 ===')
  console.log('action:', action)
  console.log('openid:', openid)
  console.log('clientOpenId:', clientOpenId)
  console.log('wxContext.openid:', wxContext.openid)

  switch (action) {
    case 'getAccounts':
      return await getAccounts(openid)

    case 'saveAccount':
      return await saveAccount(openid, account)

    case 'deleteAccount':
      return await deleteAccount(openid, app_id)

    case 'setSelected':
      return await setSelectedAccount(openid, app_id)

    case 'getSelected':
      return await getSelectedAccount(openid)

    default:
      return { success: false, message: '未知操作' }
  }
}
