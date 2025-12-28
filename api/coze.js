import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// 中间件
app.use('*', logger());
app.use('*', cors({
  origin: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// 健康检查
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TrendPublish API',
    version: '1.0.0'
  });
});

// Coze 获取令牌接口
app.get('/token', async (c) => {
  try {
    const { appid, secret, grant_type = 'client_credential' } = c.req.query();
    
    if (!appid || !secret) {
      return c.json({
        success: false,
        error: 'Missing required parameters: appid, secret'
      }, 400);
    }

    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=${grant_type}&appid=${appid}&secret=${secret}`;
    const response = await fetch(tokenUrl);
    const data = await response.json();

    const success = response.ok && data.access_token;
    
    return c.json({
      success: success,
      data: data,
      message: data.access_token ? 'Token obtained successfully' : 'Failed to obtain token',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Coze 上传图片接口
app.post('/upload', async (c) => {
  try {
    const { access_token } = c.req.query();
    const formData = await c.req.formData();
    const media = formData.get('media');
    const type = formData.get('type') || 'thumb';

    if (!access_token || !media) {
      return c.json({
        success: false,
        error: 'Missing required parameters: access_token, media'
      }, 400);
    }

    const uploadUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${access_token}&type=${type}`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();

    const success = response.ok && data.errcode === 0;
    
    return c.json({
      success: success,
      data: data,
      message: data.errcode === 0 ? 'Image uploaded successfully' : 'Failed to upload image',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Coze 创建草稿接口
app.post('/draft', async (c) => {
  try {
    const { access_token } = c.req.query();
    const { articles } = await c.req.json();
    
    if (!access_token || !articles) {
      return c.json({
        success: false,
        error: 'Missing required parameters: access_token, articles'
      }, 400);
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

    const success = response.ok && data.errcode === 0;
    
    return c.json({
      success: success,
      data: data,
      message: data.errcode === 0 ? 'Draft created successfully' : 'Failed to create draft',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Coze 发布文章接口
app.post('/publish', async (c) => {
  try {
    const { access_token } = c.req.query();
    const { media_id } = await c.req.json();
    
    if (!access_token || !media_id) {
      return c.json({
        success: false,
        error: 'Missing required parameters: access_token, media_id'
      }, 400);
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

    const success = response.ok && data.errcode === 0;
    
    return c.json({
      success: success,
      data: data,
      message: data.errcode === 0 ? 'Article published successfully' : 'Failed to publish article',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Coze 获取服务器IP
app.get('/ip', async (c) => {
  try {
    const vercelIPs = [
      '76.76.19.0/24',
      '76.76.21.0/24', 
      '8.209.103.0/24',
      '8.209.104.0/24'
    ];
    
    return c.json({
      success: true,
      data: {
        server_type: 'Vercel',
        ip_ranges: vercelIPs,
        note: '请将这些IP添加到微信公众平台白名单',
        current_request_ip: c.req.header('x-forwarded-for')?.split(',')[0] || 'unknown'
      },
      message: 'IP信息获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

export default app;