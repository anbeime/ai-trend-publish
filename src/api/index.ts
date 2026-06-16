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

// 获取错误建议的辅助函数
function getErrorSuggestion(errcode: number | undefined): string[] {
  const errorMap: { [key: number]: string[] } = {
    40001: ['AppSecret可能无效', '请检查AppSecret是否正确', '确认IP白名单已配置'],
    40002: ['AppID可能无效', '请检查AppID格式是否正确', '确认公众号类型是否支持API'],
    40013: ['AppID无效', '请检查AppID是否正确填写', '确认公众号是否已认证'],
    40125: ['AppSecret无效', '请重新获取AppSecret', '确认没有使用重置后的AppSecret'],
    41001: ['缺少access_token参数', '请重新获取access_token', '检查token是否已过期'],
    42001: ['access_token过期', '请重新获取access_token', '考虑实现token缓存机制'],
    45009: ['API调用频率限制', '请稍后重试', '优化API调用逻辑']
  };

  return errorMap[errcode as number] || [
    '检查AppID和AppSecret是否正确',
    '确认IP白名单已正确配置',
    '检查网络连接',
    '查看微信公众号后台配置'
  ];
}



// 获取本地IP地址（用于白名单配置）
app.get('/api/wechat/local-ip', async (c) => {
  try {
    // 常用的本地开发IP地址
    const localIps = [
      { interface: 'localhost', ip: '127.0.0.1', type: '本地回环' },
      { interface: 'lan', ip: '192.168.1.100', type: '局域网示例' },
      { interface: 'lan', ip: '192.168.0.100', type: '局域网示例' },
      { interface: 'lan', ip: '10.0.0.100', type: '局域网示例' }
    ];
    
    // 添加Cloudflare Pages的IP（线上环境）
    const cfIps = [
      { ip: '64.29.17.1', type: 'Cloudflare Pages IP' },
      { ip: '216.198.79.1', type: 'Cloudflare Pages IP' },
      { ip: '76.76.19.1', type: 'Cloudflare Pages IP' },
      { ip: '76.76.21.1', type: 'Cloudflare Pages IP' }
    ];
    
    return c.json({
      success: true,
      local_ips: localIps,
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

// 提取URL内容
app.post('/api/wechat/extract-url', async (c) => {
  try {
    const { url } = await c.req.json();
    
    if (!url) {
      return c.json({
        success: false,
        error: 'URL不能为空'
      }, 400);
    }

    // 这里实现简单的URL内容提取
    // 在实际部署中，你可能需要使用更复杂的抓取库
    let extractedContent = {
      title: '',
      content: '',
      summary: ''
    };

    try {
      // 模拟提取过程（实际中可以使用fetch或其他方式）
      if (url.includes('mp.weixin.qq.com')) {
        // 微信文章链接的示例处理
        extractedContent = {
          title: '微信文章标题示例',
          content: '<p>这是从微信公众号提取的文章内容。</p><p>支持基本的HTML格式。</p>',
          summary: '这是文章摘要示例'
        };
      } else {
        // 普通网页的示例处理
        extractedContent = {
          title: '网页标题示例',
          content: '<p>这是从普通网页提取的文章内容。</p>',
          summary: '这是网页内容的摘要'
        };
      }
      
      return c.json({
        success: true,
        data: extractedContent,
        message: '内容提取成功'
      });
      
    } catch (extractError) {
      return c.json({
        success: false,
        error: '内容提取失败: ' + extractError.message
      }, 500);
    }
  } catch (error) {
    return c.json({
      success: false,
      error: '请求处理失败: ' + error.message
    }, 500);
  }
});

// 获取草稿列表
app.get('/api/wechat/drafts', async (c) => {
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
      // 获取草稿列表
      const draftsUrl = `https://api.weixin.qq.com/cgi-bin/draft/get?access_token=${data.access_token}`;
      
      const draftsResponse = await fetch(draftsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offset: 0,
          count: 20
        })
      });

      const draftsResult = await draftsResponse.json();

      if (draftsResult.errcode === 0) {
        return c.json({
          success: true,
          drafts: draftsResult.item_count || 0,
          data: draftsResult.item || []
        });
      } else {
        return c.json({
          success: false,
          error: draftsResult.errmsg || '获取草稿列表失败',
          errcode: draftsResult.errcode
        }, 400);
      }
    } else {
      return c.json({
        success: false,
        error: data.errmsg || '获取访问令牌失败'
      }, 400);
    }
  } catch (error) {
    return c.json({
      success: false,
      error: '获取草稿失败: ' + error.message
    }, 500);
  }
});

// 删除草稿
app.delete('/api/wechat/draft/:mediaId', async (c) => {
  try {
    const mediaId = c.req.param('mediaId');
    
    if (!mediaId) {
      return c.json({
        success: false,
        error: '草稿ID不能为空'
      }, 400);
    }

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
      // 删除草稿
      const deleteUrl = `https://api.weixin.qq.com/cgi-bin/draft/delete?access_token=${data.access_token}`;
      
      const deleteResponse = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          media_id: mediaId
        })
      });

      const deleteResult = await deleteResponse.json();

      if (deleteResult.errcode === 0) {
        return c.json({
          success: true,
          message: '草稿删除成功'
        });
      } else {
        return c.json({
          success: false,
          error: deleteResult.errmsg || '草稿删除失败',
          errcode: deleteResult.errcode
        }, 400);
      }
    } else {
      return c.json({
        success: false,
        error: data.errmsg || '获取访问令牌失败'
      }, 400);
    }
  } catch (error) {
    return c.json({
      success: false,
      error: '删除草稿失败: ' + error.message
    }, 500);
  }
});

export default app;