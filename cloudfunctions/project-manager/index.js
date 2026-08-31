// cloudfunctions/project-manager/index.js
// 项目管理云函数 - 管理视频项目的创建、更新、查询和删除

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 创建新项目
async function createProject(openid, projectData) {
  try {
    const project = {
      _openid: openid,
      ...projectData,
      status: 'working', // 默认状态：进行中
      createTime: new Date(),
      updateTime: new Date(),
      progress: 0
    }
    
    const result = await db.collection('projects').add({
      data: project
    })
    
    console.log('项目创建成功:', result._id)
    return {
      success: true,
      projectId: result._id,
      message: '项目创建成功'
    }
  } catch (error) {
    console.error('创建项目失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 获取项目详情
async function getProject(openid, projectId) {
  try {
    const result = await db.collection('projects').doc(projectId).get()
    
    if (!result.data) {
      return {
        success: false,
        error: '项目不存在'
      }
    }
    
    // 检查权限
    if (result.data._openid !== openid) {
      return {
        success: false,
        error: '无权访问此项目'
      }
    }
    
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error('获取项目失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 更新项目
async function updateProject(openid, projectId, updateData) {
  try {
    // 检查项目是否存在和权限
    const project = await db.collection('projects').doc(projectId).get()
    
    if (!project.data) {
      return {
        success: false,
        error: '项目不存在'
      }
    }
    
    if (project.data._openid !== openid) {
      return {
        success: false,
        error: '无权修改此项目'
      }
    }
    
    const data = {
      ...updateData,
      updateTime: new Date()
    }
    
    await db.collection('projects').doc(projectId).update({
      data: data
    })
    
    console.log('项目更新成功:', projectId)
    return {
      success: true,
      message: '项目更新成功'
    }
  } catch (error) {
    console.error('更新项目失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 删除项目（软删除）
async function deleteProject(openid, projectId) {
  try {
    // 检查项目是否存在和权限
    const project = await db.collection('projects').doc(projectId).get()
    
    if (!project.data) {
      return {
        success: false,
        error: '项目不存在'
      }
    }
    
    if (project.data._openid !== openid) {
      return {
        success: false,
        error: '无权删除此项目'
      }
    }
    
    // 软删除：标记为已删除
    await db.collection('projects').doc(projectId).update({
      data: {
        status: 'deleted',
        deletedAt: new Date()
      }
    })
    
    console.log('项目删除成功:', projectId)
    return {
      success: true,
      message: '项目已删除'
    }
  } catch (error) {
    console.error('删除项目失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 列出项目
async function listProjects(openid, options = {}) {
  try {
    const { status, page = 1, pageSize = 20 } = options
    
    let query = db.collection('projects').where({
      _openid: openid
    })
    
    // 筛选状态
    if (status && status !== 'all') {
      query = query.where({
        status: status
      })
    }
    
    // 排除已删除的项目
    query = query.where({
      status: _.neq('deleted')
    })
    
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
    console.error('列出项目失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 更新项目进度
async function updateProjectProgress(openid, projectId, progress) {
  try {
    await db.collection('projects').doc(projectId).update({
      data: {
        progress: progress,
        updateTime: new Date()
      }
    })
    
    return {
      success: true,
      message: '进度更新成功'
    }
  } catch (error) {
    console.error('更新进度失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 主函数
exports.main = async (event, context) => {
  const { action, projectId, projectData, updateData, options } = event
  const { OPENID } = cloud.getWXContext()
  
  console.log('项目管理请求:', { action, projectId, OPENID })
  
  switch (action) {
    case 'create':
      return await createProject(OPENID, projectData)
    
    case 'get':
      return await getProject(OPENID, projectId)
    
    case 'update':
      return await updateProject(OPENID, projectId, updateData)
    
    case 'delete':
      return await deleteProject(OPENID, projectId)
    
    case 'list':
      return await listProjects(OPENID, options)
    
    case 'updateProgress':
      return await updateProjectProgress(OPENID, projectId, updateData?.progress)
    
    default:
      return {
        success: false,
        error: '未知操作'
      }
  }
}
