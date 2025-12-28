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
  
  try {
    // 构建微信 API URL
    const wechatPath = url.pathname.replace('/api/wechat', '');
    const wechatUrl = `https://api.weixin.qq.com${wechatPath}${url.search}`;
    
    // 克隆请求，修改目标 URL
    const modifiedRequest = new Request(wechatUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });

    // 发送请求到微信 API
    const wechatResponse = await fetch(modifiedRequest);
    
    // 读取响应内容
    const responseText = await wechatResponse.text();
    
    // 尝试解析 JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // 包装为统一格式
    const wrappedResponse = {
      success: wechatResponse.ok && (!responseData.errcode || responseData.errcode === 0),
      data: responseData,
      message: wechatResponse.ok ? 'Success' : 'Request failed',
      timestamp: new Date().toISOString()
    };

    // 如果有错误码，添加错误信息
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