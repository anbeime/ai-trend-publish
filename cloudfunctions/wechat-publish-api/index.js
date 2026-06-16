// 微信公众号发布云函数
// 功能: 素材上传、草稿创建、完整工作流

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const axios = require('axios');

/**
 * 获取微信公众号access_token
 * 使用云开发环境变量存储AppID和AppSecret
 */
async function getAccessToken() {
  try {
    // 从云开发环境变量获取配置
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;
    
    if (!appId || !appSecret) {
      throw new Error('未配置微信公众号凭证。请在云开发控制台配置环境变量: WECHAT_APP_ID, WECHAT_APP_SECRET');
    }
    
    // 调用微信API获取access_token
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data.errcode) {
      throw new Error(`获取access_token失败 [${response.data.errcode}]: ${response.data.errmsg}`);
    }
    
    return response.data.access_token;
  } catch (error) {
    console.error('[getAccessToken]错误:', error);
    throw error;
  }
}

/**
 * 上传图片素材到微信公众号
 * @param {string} accessToken - 微信access_token
 * @param {string} imageUrl - 图片URL或base64
 * @param {string} mediaType - 媒体类型 (thumb-封面, image-其他)
 */
async function uploadMedia(accessToken, imageUrl, mediaType = 'thumb') {
  try {
    const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=${mediaType}`;
    
    let imageBuffer;
    
    // 判断是URL还是base64
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // 下载URL图片
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      imageBuffer = Buffer.from(response.data);
    } else if (imageUrl.startsWith('data:image')) {
      // base64图片
      const base64Data = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (imageUrl.startsWith('cloud://')) {
      // 云存储图片
      const result = await cloud.downloadFile({
        fileID: imageUrl
      });
      imageBuffer = result.fileContent;
    } else {
      throw new Error('不支持的图片格式。支持: HTTP URL, base64, 云存储fileID');
    }
    
    // 准备FormData
    const FormData = require('form-data');
    const form = new FormData();
    form.append('media', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    });
    
    // 上传图片
    const response = await axios.post(url, form, {
      headers: form.getHeaders(),
      timeout: 30000
    });
    
    // 检查响应
    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`微信API错误 [${response.data.errcode}]: ${response.data.errmsg}`);
    }
    
    const mediaId = response.data.media_id;
    if (!mediaId) {
      throw new Error('上传失败：未获取到media_id');
    }
    
    return {
      success: true,
      media_id: mediaId,
      type: mediaType,
      url: response.data.url || ''
    };
    
  } catch (error) {
    console.error('[uploadMedia]错误:', error);
    throw error;
  }
}

/**
 * 创建草稿箱文章
 * @param {string} accessToken - 微信access_token
 * @param {object} articleData - 文章数据
 */
async function createDraft(accessToken, articleData) {
  try {
    const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`;
    
    // 构建文章数据
    const article = {
      title: articleData.title,
      content: articleData.content,
      thumb_media_id: articleData.mediaId,
      show_cover_pic: articleData.showCover !== false ? 1 : 0,
      need_open_comment: 1,
      only_fans_can_comment: 0
    };
    
    // 可选参数
    if (articleData.author) {
      article.author = articleData.author;
    }
    if (articleData.digest) {
      article.digest = articleData.digest;
    }
    
    const data = {
      articles: [article]
    };
    
    // 发送请求
    const response = await axios.post(url, data, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    // 检查响应
    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`微信API错误 [${response.data.errcode}]: ${response.data.errmsg}`);
    }
    
    const mediaId = response.data.media_id;
    if (!mediaId) {
      throw new Error('创建草稿失败：未获取到media_id');
    }
    
    return {
      success: true,
      media_id: mediaId,
      message: '草稿创建成功'
    };
    
  } catch (error) {
    console.error('[createDraft]错误:', error);
    throw error;
  }
}

/**
 * 完整工作流: 上传封面 -> 创建草稿
 * @param {string} accessToken - 微信access_token
 * @param {object} data - 完整数据
 */
async function completeWorkflow(accessToken, data) {
  try {
    console.log('[completeWorkflow]步骤1: 上传封面图片');
    const uploadResult = await uploadMedia(accessToken, data.cover, 'thumb');
    console.log('[completeWorkflow]封面上传成功, media_id:', uploadResult.media_id);
    
    console.log('[completeWorkflow]步骤2: 创建草稿');
    const draftResult = await createDraft(accessToken, {
      title: data.title,
      content: data.content,
      mediaId: uploadResult.media_id,
      author: data.author,
      digest: data.digest,
      showCover: data.showCover
    });
    console.log('[completeWorkflow]草稿创建成功, media_id:', draftResult.media_id);
    
    return {
      success: true,
      coverMediaId: uploadResult.media_id,
      draftMediaId: draftResult.media_id,
      message: '完整工作流执行成功'
    };
    
  } catch (error) {
    console.error('[completeWorkflow]错误:', error);
    throw error;
  }
}

/**
 * 云函数主入口
 */
exports.main = async (event, context) => {
  const { action, data } = event;
  
  console.log('[wechat-publish-api]收到请求, action:', action);
  
  try {
    // 获取access_token
    const accessToken = await getAccessToken();
    
    // 根据action执行不同操作
    switch (action) {
      case 'uploadMaterial':
        // 上传素材
        return await uploadMedia(accessToken, data.image, data.type || 'thumb');
        
      case 'createDraft':
        // 创建草稿
        return await createDraft(accessToken, data);
        
      case 'workflow':
        // 完整工作流
        return await completeWorkflow(accessToken, data);
        
      default:
        throw new Error('未知的action: ' + action);
    }
    
  } catch (error) {
    console.error('[wechat-publish-api]错误:', error);
    
    // 返回错误信息
    return {
      success: false,
      error: error.message,
      errorCode: error.code || 'UNKNOWN_ERROR',
      errorDetails: {
        action: action,
        message: error.message,
        stack: error.stack
      }
    };
  }
};
