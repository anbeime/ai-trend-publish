/**
 * 微信API极简转发服务
 * 功能：将请求转发到微信官方API，保留原始IP和Headers
 * 运行：node simple-proxy-server.js
 * 依赖：仅需要Node.js内置模块，无需安装第三方包
 */

const http = require('http');
const https = require('https');
const url = require('url');

// 配置参数
const PORT = process.env.PORT || 80;
const WECHAT_API_HOST = 'api.weixin.qq.com';
const LOG_REQUESTS = process.env.LOG_REQUESTS === 'true';

// 请求统计
let requestCount = 0;
let successCount = 0;
let errorCount = 0;

/**
 * 创建到微信API的请求
 */
function createWechatRequest(reqOptions, reqData, res) {
    const wechatReq = https.request(reqOptions, (wechatRes) => {
        // 设置响应头
        Object.keys(wechatRes.headers).forEach(key => {
            // 跳过一些可能冲突的headers
            if (!['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
                res.setHeader(key, wechatRes.headers[key]);
            }
        });
        
        res.writeHead(wechatRes.statusCode);
        
        // 转发响应数据
        wechatRes.pipe(res);
        
        successCount++;
        
        if (LOG_REQUESTS) {
            console.log(`✅ ${reqOptions.method} ${reqOptions.path} -> ${wechatRes.statusCode}`);
        }
    });
    
    // 处理错误
    wechatReq.on('error', (err) => {
        console.error(`❌ Proxy error: ${err.message}`);
        errorCount++;
        
        if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Proxy Error',
                message: 'Failed to connect to WeChat API',
                details: err.message
            }));
        }
    });
    
    // 发送请求数据
    if (reqData) {
        wechatReq.write(reqData);
    }
    wechatReq.end();
}

/**
 * 处理HTTP请求
 */
const server = http.createServer((req, res) => {
    requestCount++;
    
    // 记录请求信息
    if (LOG_REQUESTS) {
        const timestamp = new Date().toISOString();
        console.log(`\n[${timestamp}] ${req.method} ${req.url}`);
        console.log(`Headers:`, JSON.stringify(req.headers, null, 2));
    }
    
    // 处理健康检查
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'OK',
            uptime: process.uptime(),
            stats: {
                total_requests: requestCount,
                success_count: successCount,
                error_count: errorCount
            }
        }));
        return;
    }
    
    // 解析URL
    const parsedUrl = url.parse(req.url);
    
    // 构造微信API请求选项
    const wechatOptions = {
        hostname: WECHAT_API_HOST,
        port: 443,
        path: parsedUrl.path,
        method: req.method,
        headers: {
            // 保留原始headers，但替换Host
            ...req.headers,
            host: WECHAT_API_HOST,
            
            // 确保必要的headers
            'User-Agent': req.headers['user-agent'] || 'WeChatProxy/1.0',
            'Accept': req.headers.accept || '*/*'
        }
    };
    
    // 处理请求体（POST/PUT等）
    let reqData = null;
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > 0 && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        reqData = Buffer.alloc(contentLength);
        let offset = 0;
        
        req.on('data', (chunk) => {
            chunk.copy(reqData, offset);
            offset += chunk.length;
        });
        
        req.on('end', () => {
            createWechatRequest(wechatOptions, reqData, res);
        });
        
        req.on('error', (err) => {
            console.error('Request error:', err);
            errorCount++;
            res.writeHead(400);
            res.end('Bad Request');
        });
    } else {
        // GET/HEAD等无body请求
        createWechatRequest(wechatOptions, null, res);
    }
});

/**
 * 优雅关闭处理
 */
process.on('SIGTERM', () => {
    console.log('\n🛑 收到SIGTERM信号，正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🛑 收到SIGINT信号，正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`🚀 微信API代理服务已启动`);
    console.log(`📡 监听端口: ${PORT}`);
    console.log(`🎯 目标API: https://${WECHAT_API_HOST}`);
    console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
    console.log(`📊 日志记录: ${LOG_REQUESTS ? '开启' : '关闭'} (设置环境变量 LOG_REQUESTS=true 开启)`);
    
    console.log('\n📝 使用说明:');
    console.log('1. 确保你的服务器IP已在微信公众平台白名单中');
    console.log('2. 在Coze中配置服务器地址为你的域名');
    console.log('3. 调用微信API时会自动转发到官方接口');
    console.log('\n⏰ 服务运行中，按 Ctrl+C 停止服务');
});

// 错误处理
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被占用，请更换端口或关闭占用进程`);
    } else {
        console.error('❌ 服务器错误:', err);
    }
    process.exit(1);
});