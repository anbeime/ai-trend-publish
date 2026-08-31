// Cloudflare Pages Functions 主入口
// 用于让 mp.miyucaicai.cn 支持 Coze 插件 API 调用

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 处理 CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      // API 路由处理
      if (url.pathname.startsWith('/api/')) {
        return handleAPI(request, env, corsHeaders);
      }

      // 静态文件服务
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error('Request error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }
  }
}

// 查询发布状态
async function handlePublishStatus(request, corsHeaders) {
  try {
    const { access_token, publish_id } = await request.json();
    
    if (!access_token || !publish_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: access_token, publish_id'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    const statusUrl = `https://api.weixin.qq.com/cgi-bin/freepublish/get?access_token=${access_token}`;
    const response = await fetch(statusUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ publish_id })
    });
    const data = await response.json();

    // 添加状态说明
    const statusMap = {
      0: '发布成功',
      1: '发布中',
      2: '原创失败',
      3: '常规失败', 
      4: '平台审核不通过',
      5: '成功后用户删除所有文章',
      6: '成功后系统封禁所有文章'
    };

    if (data.publish_status !== undefined) {
      data.publish_status_desc = statusMap[data.publish_status] || '未知状态';
    }

    return new Response(JSON.stringify({
      success: response.ok && data.errcode === 0,
      data: data,
      message: data.errcode === 0 ? 'Status retrieved successfully' : 'Failed to get publish status'
    }), {
      status: response.ok ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });
  }
}

// 获取访问令牌
async function handleGetToken(request, corsHeaders) {
  try {
    const { appid, secret } = await request.json();
    
    if (!appid || !secret) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: appid, secret'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    const response = await fetch(tokenUrl);
    const data = await response.json();

    return new Response(JSON.stringify({
      success: data.errcode === 0,
      data: data,
      message: data.errcode === 0 ? 'Token retrieved successfully' : 'Failed to get token'
    }), {
      status: data.errcode === 0 ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });
  }
}

// 创建草稿
async function handleCreateDraft(request, corsHeaders) {
  try {
    const { appid, secret, title, content, summary, thumb_media_id } = await request.json();
    
    if (!appid || !secret || !title || !content) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: appid, secret, title, content'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    // 获取访问令牌
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenData?.access_token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to get access token',
        details: tokenData
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    const access_token = tokenData.access_token;

    // 创建草稿
    const draftData = {
      articles: [{
        title: title,
        content: content,
        digest: summary || '',
        thumb_media_id: thumb_media_id || '',
        need_open_comment: 0,
        only_fans_can_comment: 0
      }]
    };

    const draftUrl = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${access_token}`;
    const draftResponse = await fetch(draftUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftData)
    });
    const draftResult = await draftResponse.json();

    return new Response(JSON.stringify({
      success: draftResult.errcode === 0,
      data: {
        media_id: draftResult.media_id,
        access_token: access_token,
        draft_result: draftResult
      },
      message: draftResult.errcode === 0 ? 'Draft created successfully' : 'Failed to create draft'
    }), {
      status: draftResult.errcode === 0 ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });
  }
}

// 上传图片
async function handleUploadImage(request, corsHeaders) {
  try {
    const formData = await request.formData();
    const appid = formData.get('appid');
    const secret = formData.get('secret');
    const media = formData.get('media');
    
    if (!appid || !secret || !media) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: appid, secret, media'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    // 获取访问令牌
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenData?.access_token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to get access token',
        details: tokenData
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    const access_token = tokenData.access_token;

    // 上传图片到微信
    const uploadUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${access_token}&type=thumb`;
    const uploadFormData = new FormData();
    uploadFormData.append('media', media);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadFormData
    });
    const uploadResult = await uploadResponse.json();

    return new Response(JSON.stringify({
      success: uploadResult.errcode === 0,
      data: {
        media_id: uploadResult.media_id,
        url: uploadResult.url,
        access_token: access_token
      },
      message: uploadResult.errcode === 0 ? 'Image uploaded successfully' : 'Failed to upload image'
    }), {
      status: uploadResult.errcode === 0 ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });
  }
}

// 发布文章
async function handlePublishArticle(request, corsHeaders) {
  try {
    const { appid, secret, media_id } = await request.json();
    
    if (!appid || !secret || !media_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: appid, secret, media_id'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    // 获取访问令牌
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenData?.access_token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to get access token',
        details: tokenData
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    const access_token = tokenData.access_token;

    // 提交发布
    const publishUrl = `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${access_token}`;
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ media_id })
    });
    const publishResult = await publishResponse.json();

    const success = publishResult.errcode === 0;

    return new Response(JSON.stringify({
      success: success,
      data: {
        access_token: access_token,
        media_id: media_id,
        publish_id: publishResult.publish_id,
        msg_data_id: publishResult.msg_data_id,
        publish_result: publishResult
      },
      message: success ? 'Publish task submitted successfully' : 'Failed to publish'
    }), {
      status: success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });
  }
}

// 完整发布流程（创建草稿 + 提交发布）
async function handleCompletePublish(request, corsHeaders) {
  try {
    const { appid, secret, title, content, summary, thumb_media_id } = await request.json();
    
    if (!appid || !secret || !title || !content) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: appid, secret, title, content'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    // Step 1: 获取访问令牌
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenData?.access_token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to get access token',
        details: tokenData
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    const access_token = tokenData.access_token;

    // Step 2: 创建草稿
    const draftData = {
      articles: [{
        title: title,
        content: content,
        digest: summary || '',
        thumb_media_id: thumb_media_id || '',
        need_open_comment: 0,
        only_fans_can_comment: 0
      }]
    };

    const draftUrl = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${access_token}`;
    const draftResponse = await fetch(draftUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftData)
    });
    const draftResult = await draftResponse.json();

    if (draftResult.errcode !== 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create draft',
        details: draftResult
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    const media_id = draftResult.media_id;

    // Step 3: 提交发布
    const publishUrl = `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${access_token}`;
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ media_id })
    });
    const publishResult = await publishResponse.json();

    const success = publishResult.errcode === 0;

    return new Response(JSON.stringify({
      success: success,
      data: {
        access_token: access_token,
        media_id: media_id,
        publish_id: publishResult.publish_id,
        msg_data_id: publishResult.msg_data_id,
        draft_result: draftResult,
        publish_result: publishResult,
        steps: {
          '1.获取令牌': '✅ 成功',
          '2.创建草稿': draftResult.errcode === 0 ? '✅ 成功' : '❌ 失败',
          '3.提交发布': success ? '✅ 成功' : '❌ 失败'
        }
      },
      message: success ? '发布任务提交成功！请使用 publish_id 查询发布状态' : '发布失败',
      next_step: success ? `调用 /api/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
      timestamp: new Date().toISOString()
    }), {
      status: success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });
  }
}

async function handleAPI(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 健康检查
  if (path === '/api/health') {
    return new Response(JSON.stringify({
      success: true,
      data: {
        status: 'ok',
        service: 'TrendPublish API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      },
      message: 'Service is running normally'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });
  }

  // 获取令牌
  if (path === '/api/get-token') {
    return handleGetToken(request, corsHeaders);
  }

  // 创建草稿
  if (path === '/api/create-draft') {
    return handleCreateDraft(request, corsHeaders);
  }

  // 上传图片
  if (path === '/api/upload-image') {
    return handleUploadImage(request, corsHeaders);
  }

  // 发布文章
  if (path === '/api/publish-article') {
    return handlePublishArticle(request, corsHeaders);
  }

  // 完整发布流程
  if (path === '/api/complete-publish') {
    return handleCompletePublish(request, corsHeaders);
  }

  // 查询发布状态
  if (path === '/api/publish-status') {
    return handlePublishStatus(request, corsHeaders);
  }

  // Coze 插件专用接口
  if (path.startsWith('/coze/')) {
    return handleCozePlugin(request, corsHeaders);
  }

  return new Response(JSON.stringify({
    success: false,
    error: 'API Not Found',
    message: `The requested endpoint ${path} is not available`
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    }
  });
}

// Coze 插件处理
async function handleCozePlugin(request, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 映射 Coze 插件路径到实际的微信 API 函数
  const routeMap = {
    '/coze/get-token': handleGetToken,
    '/coze/create-draft': handleCreateDraft,
    '/coze/upload-image': handleUploadImage,
    '/coze/publish-article': handlePublishArticle,
    '/coze/complete-publish': handleCompletePublish,
    '/coze/publish-status': handlePublishStatus
  };

  const handler = routeMap[path];
  if (handler) {
    return handler(request, corsHeaders);
  }

  return new Response(JSON.stringify({
    success: false,
    error: 'Coze Plugin API Not Found',
    message: `The requested endpoint ${path} is not available`
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    }
  });
}
