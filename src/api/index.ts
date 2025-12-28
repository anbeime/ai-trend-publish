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

// 微信配置存储（在实际部署中应该使用环境变量或数据库）
let wechatConfig = {
  appid: '',
  secret: ''
};

// 健康检查
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TrendPublish API',
    version: '1.0.0'
  });
});

// 获取微信配置
app.get('/api/wechat/config', (c) => {
  return c.json({
    appid: wechatConfig.appid ? '***' + wechatConfig.appid.slice(-4) : '',
    configured: !!wechatConfig.appid && !!wechatConfig.secret
  });
});

// 保存微信配置
app.post('/api/wechat/config', async (c) => {
  try {
    const { appid, secret } = await c.req.json();
    
    if (!appid || !secret) {
      return c.json({ 
        success: false, 
        error: 'AppID和AppSecret不能为空' 
      }, 400);
    }

    wechatConfig.appid = appid;
    wechatConfig.secret = secret;

    return c.json({
      success: true,
      message: '微信配置保存成功',
      appid: '***' + appid.slice(-4)
    });
  } catch (error) {
    return c.json({
      success: false,
      error: '配置保存失败: ' + error.message
    }, 500);
  }
});

// 获取微信访问令牌
app.post('/api/wechat/token', async (c) => {
  try {
    if (!wechatConfig.appid || !wechatConfig.secret) {
      return c.json({
        success: false,
        error: '微信配置未设置'
      }, 400);
    }

    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wechatConfig.appid}&secret=${wechatConfig.secret}`;
    
    const response = await fetch(tokenUrl);
    const data = await response.json();

    if (data.access_token) {
      return c.json({
        success: true,
        access_token: data.access_token,
        expires_in: data.expires_in
      });
    } else {
      return c.json({
        success: false,
        error: data.errmsg || '获取访问令牌失败',
        errcode: data.errcode
      }, 400);
    }
  } catch (error) {
    return c.json({
      success: false,
      error: '网络请求失败: ' + error.message
    }, 500);
  }
});

// 发布文章到微信草稿
app.post('/api/wechat/publish', async (c) => {
  try {
    const { title, content, summary, thumb_media_id } = await c.req.json();

    if (!title || !content) {
      return c.json({
        success: false,
        error: '标题和内容不能为空'
      }, 400);
    }

    // 先获取访问令牌
    const tokenResponse = await c.req.env?.fetch?.(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wechatConfig.appid}&secret=${wechatConfig.secret}`);
    const tokenData = await tokenResponse?.json();

    if (!tokenData?.access_token) {
      return c.json({
        success: false,
        error: '无法获取微信访问令牌'
      }, 400);
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftData)
    });

    const draftResult = await draftResponse.json();

    if (draftResult.errcode === 0) {
      return c.json({
        success: true,
        message: '草稿创建成功',
        media_id: draftResult.media_id
      });
    } else {
      return c.json({
        success: false,
        error: draftResult.errmsg || '草稿创建失败',
        errcode: draftResult.errcode
      }, 400);
    }
  } catch (error) {
    return c.json({
      success: false,
      error: '发布失败: ' + error.message
    }, 500);
  }
});

// 上传图片到微信
app.post('/api/wechat/upload-image', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('media') as unknown as File;

    if (!file) {
      return c.json({
        success: false,
        error: '请选择要上传的图片文件'
      }, 400);
    }

    // 先获取访问令牌
    const tokenResponse = await c.req.env?.fetch?.(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wechatConfig.appid}&secret=${wechatConfig.secret}`);
    const tokenData = await tokenResponse?.json();

    if (!tokenData?.access_token) {
      return c.json({
        success: false,
        error: '无法获取微信访问令牌'
      }, 400);
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

    if (uploadResult.url) {
      return c.json({
        success: true,
        message: '图片上传成功',
        url: uploadResult.url
      });
    } else {
      return c.json({
        success: false,
        error: uploadResult.errmsg || '图片上传失败',
        errcode: uploadResult.errcode
      }, 400);
    }
  } catch (error) {
    return c.json({
      success: false,
      error: '上传失败: ' + error.message
    }, 500);
  }
});

// 获取服务器IP地址（用于微信白名单）
app.get('/api/ip', async (c) => {
  try {
    // 在Cloudflare Pages中，可以使用cf对象获取客户端信息
    const clientIP = c.req.header('cf-connecting-ip') || 
                   c.req.header('x-forwarded-for')?.split(',')[0] || 
                   '未知';
    
    // 获取Cloudflare的IP范围（这里返回的是当前请求的IP）
    return c.json({
      client_ip: clientIP,
      server_info: {
        platform: 'Cloudflare Pages',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return c.json({
      error: '获取IP失败: ' + error.message
    }, 500);
  }
});

// 测试微信API连接
app.post('/api/wechat/test', async (c) => {
  try {
    const { appid, secret } = await c.req.json();

    if (!appid || !secret) {
      return c.json({
        success: false,
        error: '缺少AppID或AppSecret'
      });
    }

    // 验证AppID格式
    if (!appid.startsWith('wx') || appid.length !== 18) {
      return c.json({
        success: false,
        error: 'AppID格式错误，应该是wx开头的18位字符',
        details: {
          received: appid,
          expected: 'wx开头的18位字符，如：wx1234567890abcdef'
        }
      });
    }

    // 验证AppSecret格式
    if (secret.length !== 32) {
      return c.json({
        success: false,
        error: 'AppSecret格式错误，应该是32位字符',
        details: {
          received_length: secret.length,
          expected_length: 32
        }
      });
    }

    // 尝试获取access_token
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    const response = await fetch(tokenUrl);
    const data = await response.json();

    if (data.access_token) {
      return c.json({
        success: true,
        message: '微信API连接成功！配置正确且IP白名单已生效。',
        access_token: data.access_token.substring(0, 10) + '...',
        expires_in: data.expires_in
      });
    } else {
      return c.json({
        success: false,
        error: data.errmsg || '获取access_token失败',
        error_code: data.errcode,
        suggestions: getErrorSuggestion(data.errcode)
      });
    }
  } catch (error) {
    return c.json({
      success: false,
      error: '网络错误: ' + error.message,
      suggestions: [
        '检查网络连接',
        '确认IP白名单已正确配置',
        '验证AppID和AppSecret是否正确'
      ]
    });
  }
});



// 测试微信API连接
app.post('/api/wechat/test', async (c) => {
  try {
    const { appid, secret } = await c.req.json();

    if (!appid || !secret) {
      return c.json({
        success: false,
        error: '缺少AppID或AppSecret'
      });
    }

    // 验证AppID格式
    if (!appid.startsWith('wx') || appid.length !== 18) {
      return c.json({
        success: false,
        error: 'AppID格式错误，应该是wx开头的18位字符',
        details: {
          received: appid,
          expected: 'wx开头的18位字符，如：wx1234567890abcdef'
        }
      });
    }

    // 验证AppSecret格式
    if (secret.length !== 32) {
      return c.json({
        success: false,
        error: 'AppSecret格式错误，应该是32位字符',
        details: {
          received_length: secret.length,
          expected_length: 32
        }
      });
    }

    // 尝试获取access_token
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    const response = await fetch(tokenUrl);
    const data = await response.json();

    if (data.access_token) {
      return c.json({
        success: true,
        message: '微信API连接成功！配置正确且IP白名单已生效。',
        access_token: data.access_token.substring(0, 10) + '...',
        expires_in: data.expires_in
      });
    } else {
      return c.json({
        success: false,
        error: data.errmsg || '获取access_token失败',
        error_code: data.errcode,
        suggestions: getErrorSuggestion(data.errcode)
      });
    }
  } catch (error) {
    return c.json({
      success: false,
      error: '网络错误: ' + error.message,
      suggestions: [
        '检查网络连接',
        '确认IP白名单已正确配置',
        '验证AppID和AppSecret是否正确'
      ]
    });
  }
});



// 获取本地IP地址（用于白名单配置）
app.get('/api/wechat/local-ip', async (c) => {
  try {
    // 获取本机IP地址
    const networkInterfaces = require('os').networkInterfaces();
    const ips = [];
    
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      for (const iface of interfaces) {
        // 排除内网地址和IPv6
        if (!iface.internal && iface.family === 'IPv4') {
          ips.push({
            interface: interfaceName,
            ip: iface.address,
            type: '本地开发IP'
          });
        }
      }
    }
    
    // 如果没有找到外网IP，添加一些常用的本地IP
    if (ips.length === 0) {
      ips.push(
        { interface: 'localhost', ip: '127.0.0.1', type: '本地回环' },
        { interface: 'lan', ip: '192.168.1.100', type: '局域网示例' }
      );
    }
    
    // 添加Cloudflare Pages的IP（线上环境）
    const cfIps = [
      { ip: '64.29.17.1', type: 'Cloudflare Pages IP' },
      { ip: '216.198.79.1', type: 'Cloudflare Pages IP' },
      { ip: '76.76.19.1', type: 'Cloudflare Pages IP' },
      { ip: '76.76.21.1', type: 'Cloudflare Pages IP' }
    ];
    
    return c.json({
      success: true,
      local_ips: ips,
      cloudflare_ips: cfIps,
      usage: {
        local: '本地开发时使用这些IP',
        cloudflare: '线上部署时使用这些IP'
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: '获取IP失败: ' + error.message,
      fallback_ips: [
        { ip: '64.29.17.1', type: 'Cloudflare Pages IP' },
        { ip: '216.198.79.1', type: 'Cloudflare Pages IP' }
      ]
    });
  }
});

export default app;