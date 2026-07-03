/**
 * 后端服务器入口文件 - 使用 Hono + Node.js 运行
 */
import { serve } from '@hono/node-server';
import app from './api/index';

const port = 8000;

console.log(`Backend API server starting on http://localhost:${port}`);
console.log('Available API endpoints:');
console.log('- GET  /api/health');
console.log('- GET  /api/wechat/config');
console.log('- POST /api/wechat/config');
console.log('- POST /api/wechat/token');
console.log('- POST /api/wechat/publish');
console.log('- POST /api/wechat/upload-image');
console.log('- GET  /api/ip');
console.log('- GET  /api/wechat/local-ip');
console.log('- POST /api/wechat/extract-url');
console.log('- GET  /api/wechat/drafts');
console.log('- DELETE /api/wechat/draft/:mediaId');

serve({
  fetch: app.fetch,
  port,
}, () => {
  console.log(`Backend API server running at http://localhost:${port}`);
});