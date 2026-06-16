// 工具函数：最简单的发布方式
// 无需配置，直接使用小程序端调用

/**
 * 最简单的发布方式 - 小程序端直接调用
 * 
 * 前提：
 * - 小程序需要关联微信公众号
 * - 需要在微信公众平台配置服务器域名白名单
 */

/**
 * 直接在小程序端调用微信草稿API
 * 
 * 注意：这种方式需要：
 * 1. 小程序和公众号已关联
 * 2. 在微信公众平台配置：api.weixin.qq.com 为合法域名
 * 3. 用户在小程序中操作（不是在云函数中）
 */
export async function publishFromMiniProgram(title, content) {
  try {
    // 方式1：小程序端云调用（最简单）
    console.log('尝试小程序端云调用...')
    
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
    
    console.log(' 小程序端云调用成功:', result)
    
    return {
      success: true,
      mode: 'mini-program-cloud',
      media_id: result.media_id,
      message: 'Draft published successfully'
    }
    
  } catch (error) {
    console.error('小程序端云调用失败:', error)
    
    // 常见错误处理
    if (error.errCode === 40001) {
      return {
        success: false,
        error: 'invalid credential - 访问令牌无效',
        hint: '请检查小程序是否已正确关联公众号',
        mode: 'failed'
      }
    }
    
    if (error.errCode === 40164) {
      return {
        success: false,
        error: '小程序和公众号未关联',
        hint: '请在微信公众平台关联小程序和公众号',
        solution: 'https://mp.weixin.qq.com → 设置与开发 → 公众号设置 → 功能设置 → 关联小程序',
        mode: 'failed'
      }
    }
    
    if (error.errMsg?.includes('not allowed') || error.errMsg?.includes('不支持')) {
      return {
        success: false,
        error: '该接口不支持小程序端云调用',
        hint: 'draft.add 接口可能不支持小程序端调用',
        solution: '请参考文档确认接口支持情况',
        mode: 'failed'
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
      message: '小程序和公众号已关联',
      hint: '可以使用小程序端云调用'
    }
  } catch (error) {
    if (error.errCode === 40164) {
      return {
        associated: false,
        message: '小程序和公众号未关联',
        hint: '请在微信公众平台关联小程序和公众号',
        solution: 'https://mp.weixin.qq.com → 设置与开发 → 公众号设置 → 功能设置 → 关联小程序'
      }
    }
    
    return {
      associated: false,
      message: '检查失败',
      error: error.errMsg
    }
  }
}

/**
 * 完整的发布流程
 * 1. 检查关联状态
 * 2. 尝试发布
 * 3. 返回详细结果
 */
export async function publishWithCheck(title, content) {
  console.log('\n========== 开始发布流程 ==========')
  
  // 步骤1：检查关联状态
  console.log('步骤1：检查小程序和公众号关联状态...')
  const association = await checkMiniProgramAssociation()
  console.log('关联状态:', association)
  
  if (!association.associated) {
    return {
      success: false,
      error: '小程序和公众号未关联',
      hint: association.hint,
      solution: association.solution,
      mode: 'check-failed'
    }
  }
  
  // 步骤2：尝试发布
  console.log('步骤2：尝试发布草稿...')
  const result = await publishFromMiniProgram(title, content)
  
  console.log('发布结果:', result)
  console.log('========== 发布流程结束 ==========\n')
  
  return result
}

/**
 * 使用说明：
 * 
 * 1. 在微信公众平台关联小程序和公众号
 *    https://mp.weixin.qq.com → 设置与开发 → 公众号设置 → 功能设置 → 关联小程序
 * 
 * 2. 在小程序中调用：
 *    import { publishWithCheck } from '../../utils/wechat-simple.js'
 *    
 *    const result = await publishWithCheck(
 *      '文章标题',
 *      '# 文章内容\n\n正文内容'
 *    )
 *    
 *    if (result.success) {
 *      console.log('发布成功:', result.media_id)
 *    } else {
 *      console.log('发布失败:', result.error)
 *      console.log('提示:', result.hint)
 *    }
 */
