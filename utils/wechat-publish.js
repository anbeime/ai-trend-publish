// 工具函数：小程序端直接调用微信草稿API
// 无需配置云调用，直接在小程序端调用

/**
 * 发布草稿到微信公众号（小程序端调用）
 * 
 * 注意：这种方式需要在小程序端调用，适用于：
 * - 公众号类型不支持云调用
 * - 无法配置 wxCloudApiToken
 * 
 * 前提条件：
 * - 小程序需要关联微信公众号
 * - 需要在微信公众平台配置服务器域名白名单
 */

/**
 * 使用云函数方式（推荐，需要配置 wxCloudApiToken）
 */
export async function publishViaCloudFunction(title, content) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'wechat-publish-sdk',
      data: { title, content }
    })
    
    return {
      success: true,
      mode: 'cloud-function',
      ...result.result
    }
  } catch (error) {
    console.error('云函数调用失败:', error)
    
    // 如果是缺少 wxCloudApiToken 错误
    if (error.errMsg?.includes('wxCloudApiToken') || 
        error.errMsg?.includes('missing wxCloudApiToken')) {
      return {
        success: false,
        error: '需要在云开发控制台配置 wxCloudApiToken',
        hint: '请参考 WECHAT_PUBLISH_FINAL_GUIDE.md 配置指南',
        mode: 'failed'
      }
    }
    
    return {
      success: false,
      error: error.errMsg || error.message,
      mode: 'failed'
    }
  }
}

/**
 * 使用小程序端云调用（无需配置 Token，但有限制）
 * 
 * 限制：
 * - 需要小程序和公众号关联
 * - 仅支持部分接口
 * - 可能需要特殊权限
 */
export async function publishViaMiniProgramCloud(title, content) {
  try {
    // 小程序端云调用方式
    const result = await wx.cloud.openapi({
      apiName: 'draft.add',
      data: {
        articles: [{
          title: title,
          content: content,
          digest: title?.substring(0, 50) || '',
          thumb_media_id: '',
          show_cover_pic: 0,
          need_open_comment: 0,
          only_fans_can_comment: 0
        }]
      }
    })
    
    return {
      success: true,
      mode: 'mini-program-cloud',
      media_id: result.media_id
    }
  } catch (error) {
    console.error('小程序云调用失败:', error)
    
    // 常见错误处理
    if (error.errCode === 40001) {
      return {
        success: false,
        error: 'invalid credential - 访问令牌无效',
        hint: '请检查小程序是否已正确关联公众号'
      }
    }
    
    if (error.errCode === 40164) {
      return {
        success: false,
        error: '小程序和公众号未关联',
        hint: '请在微信公众平台关联小程序和公众号'
      }
    }
    
    if (error.errMsg?.includes('not allowed')) {
      return {
        success: false,
        error: '该接口不支持小程序端云调用',
        hint: '请使用云函数方式，需要配置 wxCloudApiToken'
      }
    }
    
    return {
      success: false,
      error: error.errMsg || error.message,
      errCode: error.errCode,
      mode: 'failed'
    }
  }
}

/**
 * 自动选择最佳发布方式
 * 
 * 优先尝试云函数方式，失败后尝试小程序端云调用
 */
export async function publishToWeChat(title, content) {
  console.log('尝试发布到微信...', { title, contentLength: content?.length })
  
  // 方式1：云函数（推荐）
  console.log('方式1：尝试云函数调用...')
  const cloudResult = await publishViaCloudFunction(title, content)
  
  if (cloudResult.success) {
    console.log(' 云函数调用成功')
    return cloudResult
  }
  
  // 如果不是配置问题，直接返回失败
  if (!cloudResult.hint) {
    console.error(' 云函数调用失败:', cloudResult.error)
    return cloudResult
  }
  
  console.log('⚠️ 云函数未配置，尝试方式2...')
  
  // 方式2：小程序端云调用
  console.log('方式2：尝试小程序端云调用...')
  const miniProgramResult = await publishViaMiniProgramCloud(title, content)
  
  return miniProgramResult
}

/**
 * 检查小程序和公众号是否已关联
 */
export async function checkMiniProgramAssociation() {
  try {
    // 尝试调用一个简单的接口来检查关联状态
    await wx.cloud.openapi({
      apiName: 'api.getAccessToken',
      data: {}
    })
    
    return {
      associated: true,
      message: '小程序和公众号已关联'
    }
  } catch (error) {
    if (error.errCode === 40164) {
      return {
        associated: false,
        message: '小程序和公众号未关联',
        hint: '请在微信公众平台 → 小程序 → 关联管理中添加关联'
      }
    }
    
    return {
      associated: false,
      message: '检查失败',
      error: error.errMsg
    }
  }
}
