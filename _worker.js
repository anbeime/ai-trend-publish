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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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
};

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

  // 微信 API 代理
  if (path.startsWith('/api/wechat/')) {
    return proxyToWechat(request, corsHeaders);
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

async function proxyToWechat(request, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    // 微信配置（在生产环境中应该使用环境变量）
    const WECHAT_APPID = 'wx8410119dfbb7f756';
    const WECHAT_SECRET = '3c93e33e087e57b906f5c341aa5223b9';
    
    // 处理不同的微信 API 端点
    if (path === '/api/wechat/publish') {
      return handleWechatPublish(request, corsHeaders, WECHAT_APPID, WECHAT_SECRET);
    }
    
    if (path === '/api/wechat/upload-image') {
      return handleWechatUpload(request, corsHeaders, WECHAT_APPID, WECHAT_SECRET);
    }
    
    if (path === '/api/wechat/token') {
      return handleWechatToken(request, corsHeaders, WECHAT_APPID, WECHAT_SECRET);
    }
    
    // 默认代理到微信 API
    const wechatPath = path.replace('/api/wechat', '');
    const wechatUrl = `https://api.weixin.qq.com${wechatPath}${url.search}`;
    
    const modifiedRequest = new Request(wechatUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });

    const wechatResponse = await fetch(modifiedRequest);
    const responseText = await wechatResponse.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    const wrappedResponse = {
      success: wechatResponse.ok && (!responseData.errcode || responseData.errcode === 0),
      data: responseData,
      message: wechatResponse.ok ? 'Success' : 'Request failed',
      timestamp: new Date().toISOString()
    };

    if (responseData.errcode && responseData.errcode !== 0) {
      wrappedResponse.success = false;
      wrappedResponse.error = {
        code: responseData.errcode,
        message: responseData.errmsg || 'Unknown error'
      };
    }

    return new Response(JSON.stringify(wrappedResponse), {
      status: wechatResponse.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'PROXY_ERROR',
        message: error.message
      },
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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

// 微信发布文章处理
async function handleWechatPublish(request, corsHeaders, appid, secret) {
  try {
    const { title, content, summary, thumb_media_id } = await request.json();

    if (!title || !content) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '标题和内容不能为空'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 获取访问令牌
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenData?.access_token) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'TOKEN_ERROR',
          message: '无法获取微信访问令牌',
          details: tokenData
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

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

    const draftUrl = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${tokenData.access_token}`;
    const draftResponse = await fetch(draftUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftData)
    });

    const draftResult = await draftResponse.json();

    const success = draftResult.errcode === 0;
    
    return new Response(JSON.stringify({
      success: success,
      data: {
        media_id: draftResult.media_id,
        access_token: tokenData.access_token
      },
      message: success ? '草稿创建成功' : '草稿创建失败',
      error: success ? null : {
        code: draftResult.errcode,
        message: draftResult.errmsg
      },
      timestamp: new Date().toISOString()
    }), {
      status: success ? 200 : 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '发布失败: ' + error.message
      },
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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

// 微信上传图片处理
async function handleWechatUpload(request, corsHeaders, appid, secret) {
  try {
    const formData = await request.formData();
    const file = formData.get('media');

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '请选择要上传的图片文件'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 获取访问令牌
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenData?.access_token) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'TOKEN_ERROR',
          message: '无法获取微信访问令牌'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 上传图片
    const uploadUrl = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${tokenData.access_token}`;
    
    const uploadFormData = new FormData();
    uploadFormData.append('media', file);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadFormData
    });

    const uploadResult = await uploadResponse.json();

    const success = !!uploadResult.url;
    
    return new Response(JSON.stringify({
      success: success,
      data: {
        url: uploadResult.url,
        access_token: tokenData.access_token
      },
      message: success ? '图片上传成功' : '图片上传失败',
      error: success ? null : {
        code: uploadResult.errcode,
        message: uploadResult.errmsg
      },
      timestamp: new Date().toISOString()
    }), {
      status: success ? 200 : 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '上传失败: ' + error.message
      },
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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

// 微信获取令牌处理
async function handleWechatToken(request, corsHeaders, appid, secret) {
  try {
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    const response = await fetch(tokenUrl);
    const data = await response.json();

    const success = !!data.access_token;
    
    return new Response(JSON.stringify({
      success: success,
      data: {
        access_token: data.access_token,
        expires_in: data.expires_in
      },
      message: success ? '令牌获取成功' : '令牌获取失败',
      error: success ? null : {
        code: data.errcode,
        message: data.errmsg
      },
      timestamp: new Date().toISOString()
    }), {
      status: success ? 200 : 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '网络请求失败: ' + error.message
      },
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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

async function handleCozePlugin(request, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Coze 插件专用接口
  switch (path) {
    case '/coze/token':
      return handleGetToken(request, corsHeaders);
    
    case '/coze/draft':
      return handleCreateDraft(request, corsHeaders);
    
    case '/coze/upload':
      return handleUploadImage(request, corsHeaders);
    
    case '/coze/publish':
      return handlePublishArticle(request, corsHeaders);
    
    case '/coze/publish-status':
      return handlePublishStatus(request, corsHeaders);
    
    case '/coze/publish-complete':
      return handleCompletePublish(request, corsHeaders);
    
    default:
      return new Response(JSON.stringify({
        success: false,
        error: 'Coze Plugin API Not Found',
        message: `The Coze plugin endpoint ${path} is not available`
      }), {
        status: 404,
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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

// 获取 Access Token
async function handleGetToken(request, corsHeaders) {
  try {
    const { appid, secret, grant_type = 'client_credential' } = await request.json();
    
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

    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=${grant_type}&appid=${appid}&secret=${secret}`;
    const response = await fetch(tokenUrl);
    const data = await response.json();

    return new Response(JSON.stringify({
      success: response.ok && data.access_token,
      data: data,
      message: data.access_token ? 'Token obtained successfully' : 'Failed to obtain token'
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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

// 创建草稿
async function handleCreateDraft(request, corsHeaders) {
  try {
    const { access_token, articles } = await request.json();
    
    if (!access_token || !articles) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: access_token, articles'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    const draftUrl = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${access_token}`;
    const response = await fetch(draftUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ articles })
    });
    const data = await response.json();

    return new Response(JSON.stringify({
      success: response.ok && data.errcode === 0,
      data: data,
      message: data.errcode === 0 ? 'Draft created successfully' : 'Failed to create draft'
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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

// 上传图片
async function handleUploadImage(request, corsHeaders) {
  try {
    const formData = await request.formData();
    const access_token = formData.get('access_token');
    const media = formData.get('media');
    const type = formData.get('type') || 'thumb';

    if (!access_token || !media) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: access_token, media'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    const uploadUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${access_token}&type=${type}`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();

    return new Response(JSON.stringify({
      success: response.ok && data.errcode === 0,
      data: data,
      message: data.errcode === 0 ? 'Image uploaded successfully' : 'Failed to upload image'
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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

// 发布文章
async function handlePublishArticle(request, corsHeaders) {
  try {
    const { access_token, media_id } = await request.json();
    
    if (!access_token || !media_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: access_token, media_id'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    const publishUrl = `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${access_token}`;
    const response = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ media_id })
    });
    const data = await response.json();

    return new Response(JSON.stringify({
      success: response.ok && data.errcode === 0,
      data: data,
      message: data.errcode === 0 ? 'Article published successfully' : 'Failed to publish article'
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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
      next_step: success ? `调用 /coze/publish-status 查询发布状态，publish_id: ${publishResult.publish_id}` : null,
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