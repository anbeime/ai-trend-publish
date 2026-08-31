// cloudfunctions/template-manager/index.js
// 模板管理云函数 - 管理模板库、热门模板、收藏

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 创建模板
async function createTemplate(openid, templateData) {
  try {
    const template = {
      _openid: openid,
      ...templateData,
      likeCount: 0,
      useCount: 0,
      status: 'active',
      createTime: new Date(),
      updateTime: new Date()
    }
    
    const result = await db.collection('templates').add({
      data: template
    })
    
    console.log('模板创建成功:', result._id)
    return {
      success: true,
      templateId: result._id,
      message: '模板创建成功'
    }
  } catch (error) {
    console.error('创建模板失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 获取模板详情
async function getTemplate(templateId) {
  try {
    const result = await db.collection('templates').doc(templateId).get()
    
    if (!result.data) {
      return {
        success: false,
        error: '模板不存在'
      }
    }
    
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error('获取模板失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 列出模板
async function listTemplates(options = {}) {
  try {
    const { 
      category, 
      sortBy = 'createTime', 
      sortOrder = 'desc',
      page = 1, 
      pageSize = 20,
      openId
    } = options
    
    let query = db.collection('templates')
    
    // 如果指定了用户ID，只列出用户的模板
    if (openId) {
      query = query.where({
        _openid: openId
      })
    }
    
    // 筛选分类
    if (category && category !== 'all') {
      query = query.where({
        category: category
      })
    }
    
    // 筛选状态（排除已删除的）
    query = query.where({
      status: _.neq('deleted')
    })
    
    // 计数
    const totalResult = await query.count()
    
    // 排序
    let orderField = sortBy
    let orderDirection = sortOrder === 'asc' ? 'asc' : 'desc'
    
    const dataResult = await query
      .orderBy(orderField, orderDirection)
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
    console.error('列出模板失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 获取热门模板（按点赞数排序）
async function getPopularTemplates(limit = 10) {
  try {
    const result = await db.collection('templates')
      .where({
        status: 'active'
      })
      .orderBy('likeCount', 'desc')
      .limit(limit)
      .get()
    
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error('获取热门模板失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 更新模板
async function updateTemplate(openid, templateId, updateData) {
  try {
    // 检查模板是否存在和权限
    const template = await db.collection('templates').doc(templateId).get()
    
    if (!template.data) {
      return {
        success: false,
        error: '模板不存在'
      }
    }
    
    if (template.data._openid !== openid) {
      return {
        success: false,
        error: '无权修改此模板'
      }
    }
    
    const data = {
      ...updateData,
      updateTime: new Date()
    }
    
    await db.collection('templates').doc(templateId).update({
      data: data
    })
    
    console.log('模板更新成功:', templateId)
    return {
      success: true,
      message: '模板更新成功'
    }
  } catch (error) {
    console.error('更新模板失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 删除模板
async function deleteTemplate(openid, templateId) {
  try {
    // 检查模板是否存在和权限
    const template = await db.collection('templates').doc(templateId).get()
    
    if (!template.data) {
      return {
        success: false,
        error: '模板不存在'
      }
    }
    
    if (template.data._openid !== openid) {
      return {
        success: false,
        error: '无权删除此模板'
      }
    }
    
    // 软删除：标记为已删除
    await db.collection('templates').doc(templateId).update({
      data: {
        status: 'deleted',
        deletedAt: new Date()
      }
    })
    
    console.log('模板删除成功:', templateId)
    return {
      success: true,
      message: '模板已删除'
    }
  } catch (error) {
    console.error('删除模板失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 点赞模板
async function likeTemplate(openid, templateId, like = true) {
  try {
    const template = await db.collection('templates').doc(templateId).get()
    
    if (!template.data) {
      return {
        success: false,
        error: '模板不存在'
      }
    }
    
    // 更新点赞数
    const increment = like ? 1 : -1
    await db.collection('templates').doc(templateId).update({
      data: {
        likeCount: _.inc(increment)
      }
    })
    
    console.log('模板点赞成功:', templateId, like ? '+1' : '-1')
    return {
      success: true,
      message: like ? '点赞成功' : '取消点赞成功'
    }
  } catch (error) {
    console.error('点赞模板失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 使用模板（增加使用次数）
async function useTemplate(templateId) {
  try {
    await db.collection('templates').doc(templateId).update({
      data: {
        useCount: _.inc(1)
      }
    })
    
    return {
      success: true,
      message: '模板使用记录已更新'
    }
  } catch (error) {
    console.error('使用模板失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 搜索模板
async function searchTemplates(keyword, options = {}) {
  try {
    const { page = 1, pageSize = 20 } = options
    
    const result = await db.collection('templates')
      .where({
        status: 'active',
        name: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    return {
      success: true,
      data: result.data,
      total: result.data.length
    }
  } catch (error) {
    console.error('搜索模板失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 主函数
exports.main = async (event, context) => {
  const { 
    action, 
    templateId, 
    templateData, 
    updateData, 
    options,
    limit,
    keyword
  } = event
  const { OPENID } = cloud.getWXContext()
  
  console.log('模板管理请求:', { action, templateId, OPENID })
  
  switch (action) {
    case 'create':
      return await createTemplate(OPENID, templateData)
    
    case 'get':
      return await getTemplate(templateId)
    
    case 'list':
      return await listTemplates({ ...options, openId: OPENID })
    
    case 'popular':
      return await getPopularTemplates(limit)
    
    case 'update':
      return await updateTemplate(OPENID, templateId, updateData)
    
    case 'delete':
      return await deleteTemplate(OPENID, templateId)
    
    case 'like':
      return await likeTemplate(OPENID, templateId, event.like !== false)
    
    case 'use':
      return await useTemplate(templateId)
    
    case 'search':
      return await searchTemplates(keyword, options)
    
    default:
      return {
        success: false,
        error: '未知操作'
      }
  }
}
