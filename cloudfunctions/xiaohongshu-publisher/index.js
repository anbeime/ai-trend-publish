// 小红书图文笔记发布云函数
// 功能: 发布图文笔记到小红书

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const axios = require('axios');

/**
 * 获取小红书凭证
 * 使用云开发环境变量存储Cookie
 */
function getXiaohongshuCredentials() {
  try {
    const cookie = process.env.XIAOHONGSHU_COOKIE;
    
    if (!cookie) {
      throw new Error('未配置小红书凭证。请在云开发控制台配置环境变量: XIAOHONGSHU_COOKIE');
    }
    
    // 从Cookie中提取关键参数
    let deviceId = null;
    let a1 = null;
    
    for (const item of cookie.split(';')) {
      const trimmed = item.trim();
      if (trimmed.startsWith('device_id=')) {
        deviceId = trimmed.split('=')[1];
      } else if (trimmed.startsWith('a1=')) {
        a1 = trimmed.split('=')[1];
      }
    }
    
    return {
      cookie: cookie,
      deviceId: deviceId,
      a1: a1
    };
  } catch (error) {
    console.error('[getXiaohongshuCredentials]错误:', error);
    throw error;
  }
}

/**
 * 上传图片到小红书
 * @param {string} imageUrl - 图片URL或base64
 * @param {object} credentials - 小红书凭证
 */
async function uploadImage(imageUrl, credentials) {
  try {
    // 小红书图片上传API
    const url = 'https://edith.xiaohongshu.com/api/sns/web/v1/upload/image';
    
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
    form.append('file', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    });
    
    // 上传图片
    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        'Cookie': credentials.cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    // 检查响应
    if (response.data.success || response.data.code === 0) {
      const imageId = response.data.data?.image_id;
      if (!imageId) {
        throw new Error('上传失败：未获取到image_id');
      }
      
      return {
        success: true,
        image_id: imageId,
        url: response.data.data?.url || ''
      };
    } else {
      throw new Error(`小红书API错误: ${response.data.msg || '未知错误'}`);
    }
    
  } catch (error) {
    console.error('[uploadImage]错误:', error);
    throw error;
  }
}

/**
 * 发布图文笔记到小红书
 * @param {object} noteData - 笔记数据
 * @param {object} credentials - 小红书凭证
 */
async function publishNote(noteData, credentials) {
  try {
    // 小红书笔记发布API
    const url = 'https://edith.xiaohongshu.com/api/sns/web/v1/note/publish';
    
    // 构建请求数据
    const data = {
      type: 'normal',  // normal-普通笔记, video-视频笔记
      title: noteData.title,
      desc: noteData.content,
      at_uid_list: [],
      image_list: noteData.imageIds || [],
      tag_list: noteData.tags || [],
      poi_id: '',
      post_time: 0,  // 0-立即发布
    };
    
    // 发送请求
    const response = await axios.post(url, data, {
      headers: {
        'Cookie': credentials.cookie,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    // 检查响应
    if (response.data.success || response.data.code === 0) {
      const noteId = response.data.data?.note_id;
      if (!noteId) {
        throw new Error('发布失败：未获取到note_id');
      }
      
      return {
        success: true,
        note_id: noteId,
        message: '笔记发布成功',
        url: `https://www.xiaohongshu.com/explore/${noteId}`
      };
    } else {
      throw new Error(`小红书API错误: ${response.data.msg || '未知错误'}`);
    }
    
  } catch (error) {
    console.error('[publishNote]错误:', error);
    throw error;
  }
}

/**
 * 完整工作流: 上传图片 -> 发布笔记
 * @param {object} data - 完整数据
 * @param {object} credentials - 小红书凭证
 */
async function completeWorkflow(data, credentials) {
  try {
    console.log('[completeWorkflow]步骤1: 上传图片');
    const imageIds = [];
    
    if (data.images && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        const imageUrl = data.images[i];
        console.log(`[completeWorkflow]上传第${i + 1}张图片`);
        
        const uploadResult = await uploadImage(imageUrl, credentials);
        imageIds.push(uploadResult.image_id);
        
        console.log(`[completeWorkflow]第${i + 1}张图片上传成功, image_id:`, uploadResult.image_id);
      }
    }
    
    console.log('[completeWorkflow]步骤2: 发布笔记');
    const publishResult = await publishNote({
      title: data.title,
      content: data.content,
      imageIds: imageIds,
      tags: data.tags
    }, credentials);
    
    console.log('[completeWorkflow]笔记发布成功, note_id:', publishResult.note_id);
    
    return {
      success: true,
      imageIds: imageIds,
      noteId: publishResult.note_id,
      noteUrl: publishResult.url,
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
  
  console.log('[xiaohongshu-publisher]收到请求, action:', action);
  
  try {
    // 获取凭证
    const credentials = getXiaohongshuCredentials();
    
    // 根据action执行不同操作
    switch (action) {
      case 'uploadImage':
        // 上传图片
        return await uploadImage(data.image, credentials);
        
      case 'publishNote':
        // 发布笔记
        return await publishNote(data, credentials);
        
      case 'workflow':
        // 完整工作流
        return await completeWorkflow(data, credentials);
        
      default:
        throw new Error('未知的action: ' + action);
    }
    
  } catch (error) {
    console.error('[xiaohongshu-publisher]错误:', error);
    
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
