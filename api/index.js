export default async function handler(req, res) {
  // CORS 处理
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 微信配置
  let wechatConfig = {
    appid: 'wx8410119dfbb7f756',
    secret: '3c93e33e087e57b906f5c341aa5223b9'
  };

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    if (path === '/api/health') {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'TrendPublish API',
        version: '1.0.0'
      });
      return;
    }

    if (path === '/api/wechat/config') {
      if (req.method === 'GET') {
        res.status(200).json({
          appid: wechatConfig.appid ? '***' + wechatConfig.appid.slice(-4) : '',
          configured: !!wechatConfig.appid && !!wechatConfig.secret
        });
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const { appid, secret } = JSON.parse(body);
            
            if (!appid || !secret) {
              res.status(400).json({ 
                success: false, 
                error: 'AppID和AppSecret不能为空' 
              });
              return;
            }

            wechatConfig.appid = appid;
            wechatConfig.secret = secret;

            res.status(200).json({
              success: true,
              message: '微信配置保存成功',
              appid: '***' + appid.slice(-4)
            });
          } catch (error) {
            res.status(500).json({
              success: false,
              error: '配置保存失败: ' + error.message
            });
          }
        });
        return;
      }
    }

    if (path === '/api/ip') {
      const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     '未知';
      
      res.status(200).json({
        client_ip: clientIP,
        server_info: {
          platform: 'Vercel',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // 其他路由返回主页
    res.status(404).json({ error: 'Not found' });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器错误: ' + error.message
    });
  }
}