// cloudfunctions/character-manager/index.js
// 角色管理云函数 - 管理角色设定、三视图、角色一致性

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 保存角色
async function saveCharacter(openid, characterData) {
  try {
    const character = {
      _openid: openid,
      ...characterData,
      createTime: new Date(),
      updateTime: new Date(),
      status: 'active'
    }
    
    const result = await db.collection('characters').add({
      data: character
    })
    
    console.log('角色保存成功:', result._id)
    return {
      success: true,
      characterId: result._id,
      message: '角色保存成功'
    }
  } catch (error) {
    console.error('保存角色失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 获取角色详情
async function getCharacter(openid, characterId) {
  try {
    const result = await db.collection('characters').doc(characterId).get()
    
    if (!result.data) {
      return {
        success: false,
        error: '角色不存在'
      }
    }
    
    // 检查权限
    if (result.data._openid !== openid) {
      return {
        success: false,
        error: '无权访问此角色'
      }
    }
    
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error('获取角色失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 列出角色
async function listCharacters(openid, options = {}) {
  try {
    const { status, page = 1, pageSize = 20 } = options
    
    let query = db.collection('characters').where({
      _openid: openid
    })
    
    // 筛选状态
    if (status && status !== 'all') {
      query = query.where({
        status: status
      })
    }
    
    // 分页
    const totalResult = await query.count()
    const dataResult = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    return {
      success: true,
      data: dataResult.data,
      total: totalResult.total,
      page,
      pageSize
    }
  } catch (error) {
    console.error('列出角色失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 更新角色
async function updateCharacter(openid, characterId, updateData) {
  try {
    // 检查角色是否存在和权限
    const character = await db.collection('characters').doc(characterId).get()
    
    if (!character.data) {
      return {
        success: false,
        error: '角色不存在'
      }
    }
    
    if (character.data._openid !== openid) {
      return {
        success: false,
        error: '无权修改此角色'
      }
    }
    
    const data = {
      ...updateData,
      updateTime: new Date()
    }
    
    await db.collection('characters').doc(characterId).update({
      data: data
    })
    
    console.log('角色更新成功:', characterId)
    return {
      success: true,
      message: '角色更新成功'
    }
  } catch (error) {
    console.error('更新角色失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 删除角色
async function deleteCharacter(openid, characterId) {
  try {
    // 检查角色是否存在和权限
    const character = await db.collection('characters').doc(characterId).get()
    
    if (!character.data) {
      return {
        success: false,
        error: '角色不存在'
      }
    }
    
    if (character.data._openid !== openid) {
      return {
        success: false,
        error: '无权删除此角色'
      }
    }
    
    // 软删除：标记为已删除
    await db.collection('characters').doc(characterId).update({
      data: {
        status: 'deleted',
        deletedAt: new Date()
      }
    })
    
    console.log('角色删除成功:', characterId)
    return {
      success: true,
      message: '角色已删除'
    }
  } catch (error) {
    console.error('删除角色失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 保存角色三视图
async function saveCharacterTurnaround(openid, characterId, turnaroundData) {
  try {
    const data = {
      combinedViewUrl: turnaroundData.combinedViewUrl,
      frontImageUrl: turnaroundData.frontImageUrl,
      sideImageUrl: turnaroundData.sideImageUrl,
      backImageUrl: turnaroundData.backImageUrl,
      status: 'completed',
      turnaroundTime: new Date(),
      updateTime: new Date()
    }
    
    await db.collection('characters').doc(characterId).update({
      data: data
    })
    
    console.log('角色三视图保存成功:', characterId)
    return {
      success: true,
      message: '三视图保存成功'
    }
  } catch (error) {
    console.error('保存三视图失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 批量获取角色（用于视频生成时保持一致性）
async function getCharactersByIds(openid, characterIds) {
  try {
    const result = await db.collection('characters')
      .where({
        _openid: openid,
        _id: _.in(characterIds)
      })
      .get()
    
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error('批量获取角色失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 主函数
exports.main = async (event, context) => {
  const { action, characterId, characterData, updateData, turnaroundData, characterIds, options } = event
  const { OPENID } = cloud.getWXContext()
  
  console.log('角色管理请求:', { action, characterId, OPENID })
  
  switch (action) {
    case 'save':
      return await saveCharacter(OPENID, characterData)
    
    case 'get':
      return await getCharacter(OPENID, characterId)
    
    case 'list':
      return await listCharacters(OPENID, options)
    
    case 'update':
      return await updateCharacter(OPENID, characterId, updateData)
    
    case 'delete':
      return await deleteCharacter(OPENID, characterId)
    
    case 'saveTurnaround':
      return await saveCharacterTurnaround(OPENID, characterId, turnaroundData)
    
    case 'getByIds':
      return await getCharactersByIds(OPENID, characterIds)
    
    default:
      return {
        success: false,
        error: '未知操作'
      }
  }
}
