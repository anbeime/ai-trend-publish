# draft-api.py 部署说明

## 重要说明

### ❌ 小程序不能直接运行Python文件

微信小程序本身不支持直接运行Python文件。小程序的技术栈是：
- 前端：WXML、WXSS、JavaScript/TypeScript
- 后端：云函数（Node.js、PHP、Java、Python等）

### ✅ Python的正确使用方式

`draft-api.py` 是一个独立的Flask Web服务，需要作为**独立服务运行**，小程序或其他客户端通过**HTTP API**调用。

## 三种部署方式

### 方式1：本地运行（开发调试）⭐推荐

**适用场景：** 开发测试、功能验证

#### Windows用户
```bash
# 1. 双击运行启动脚本
deploy_draft_api.bat

# 或手动启动
python draft-api.py
```

#### Mac/Linux用户
```bash
# 1. 安装依赖
pip3 install -r requirements.txt

# 2. 配置环境变量
cp .env.example .env
vim .env  # 填入真实密钥

# 3. 启动服务
python3 draft-api.py
```

#### 测试服务
```bash
# 健康检查
curl http://localhost:8001/health

# 完整流程测试
curl -X POST http://localhost:8001/auto-publish
```

#### 小程序调用
```javascript
// 在小程序中调用本地服务（需要允许局域网访问）
wx.request({
  url: 'http://YOUR_COMPUTER_IP:8001/auto-publish',
  method: 'POST',
  success: (res) => {
    console.log(res.data)
  }
})

// 注意：需要确保手机和电脑在同一局域网
```

---

### 方式2：云服务器部署（生产环境）⭐推荐

**适用场景：** 正式上线、多用户访问

#### 准备工作
1. 购买云服务器（腾讯云、阿里云等）
2. 选择操作系统：Ubuntu 20.04 / CentOS 7+
3. 开放端口：8001（入站规则）

#### 部署步骤（Linux）
```bash
# 1. 上传文件到服务器
scp draft-api.py root@your-server-ip:/opt/draft-api/
scp requirements.txt root@your-server-ip:/opt/draft-api/
scp .env.example root@your-server-ip:/opt/draft-api/

# 2. SSH登录服务器
ssh root@your-server-ip

# 3. 进入目录
cd /opt/draft-api

# 4. 安装Python依赖
pip3 install -r requirements.txt

# 5. 配置环境变量
cp .env.example .env
vim .env  # 填入真实密钥

# 6. 测试运行
python3 draft-api.py

# Ctrl+C 停止测试

# 7. 创建systemd服务
sudo tee /etc/systemd/system/draft-api.service > /dev/null <<EOF
[Unit]
Description=Draft API Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/draft-api
ExecStart=/usr/bin/python3 /opt/draft-api/draft-api.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 8. 启动服务
sudo systemctl daemon-reload
sudo systemctl enable draft-api
sudo systemctl start draft-api
sudo systemctl status draft-api
```

#### 服务管理
```bash
# 查看状态
sudo systemctl status draft-api

# 查看日志
sudo journalctl -u draft-api -f

# 停止服务
sudo systemctl stop draft-api

# 启动服务
sudo systemctl start draft-api

# 重启服务
sudo systemctl restart draft-api
```

#### 小程序调用
```javascript
// 使用公网IP
wx.request({
  url: 'http://YOUR_SERVER_PUBLIC_IP:8001/auto-publish',
  method: 'POST',
  success: (res) => {
    console.log(res.data)
  }
})
```

#### 注意事项
- ⚠️ 使用HTTP存在安全隐患，建议配置HTTPS
- ⚠️ 腾讯云需要在安全组中开放8001端口
- ⚠️ 建议配置防火墙限制访问IP

---

### 方式3：Docker容器化部署（高级）

**适用场景：** 快速部署、环境隔离

#### 创建Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY draft-api.py .
COPY .env .

# 暴露端口
EXPOSE 8001

# 启动服务
CMD ["python", "draft-api.py"]
```

#### 构建和运行
```bash
# 1. 构建镜像
docker build -t draft-api:latest .

# 2. 运行容器
docker run -d \
  --name draft-api \
  -p 8001:8001 \
  -v $(pwd)/.env:/app/.env \
  --restart unless-stopped \
  draft-api:latest

# 3. 查看日志
docker logs -f draft-api

# 4. 停止容器
docker stop draft-api

# 5. 删除容器
docker rm draft-api
```

#### Docker Compose（推荐）
```yaml
version: '3.8'

services:
  draft-api:
    build: .
    container_name: draft-api
    ports:
      - "8001:8001"
    volumes:
      - ./.env:/app/.env
    restart: unless-stopped
    environment:
      - TZ=Asia/Shanghai
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

```bash
# 启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

---

## 小程序集成方式

### 1. 在小程序中添加配置

`config/api-config.js`
```javascript
module.exports = {
  draftApiUrl: 'http://YOUR_SERVER_IP:8001', // 修改为实际地址
  endpoints: {
    autoPublish: '/auto-publish',
    publishDraft: '/publish-draft',
    health: '/health'
  }
}
```

### 2. 创建API调用工具类

`utils/draftApi.js`
```javascript
const apiConfig = require('../config/api-config')

class DraftAPI {
  constructor() {
    this.baseUrl = apiConfig.draftApiUrl
  }

  // 完整流程
  async autoPublish() {
    return await this.request({
      url: apiConfig.endpoints.autoPublish,
      method: 'POST'
    })
  }

  // 发布草稿
  async publishDraft(data) {
    return await this.request({
      url: apiConfig.endpoints.publishDraft,
      method: 'POST',
      data: data
    })
  }

  // 健康检查
  async health() {
    return await this.request({
      url: apiConfig.endpoints.health,
      method: 'GET'
    })
  }

  // 通用请求方法
  async request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.baseUrl + options.url,
        method: options.method,
        data: options.data,
        header: {
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(new Error(`HTTP ${res.statusCode}`))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }
}

module.exports = new DraftAPI()
```

### 3. 在页面中使用

`pages/test/test.js`
```javascript
const draftApi = require('../../utils/draftApi')

Page({
  data: {
    loading: false,
    result: null
  },

  async onAutoPublish() {
    this.setData({ loading: true })

    try {
      const result = await draftApi.autoPublish()

      wx.showToast({
        title: '发布成功',
        icon: 'success'
      })

      this.setData({ result })
      console.log('发布结果：', result)
    } catch (err) {
      wx.showToast({
        title: '发布失败',
        icon: 'error'
      })
      console.error('发布失败：', err)
    } finally {
      this.setData({ loading: false })
    }
  }
})
```

`pages/test/test.wxml`
```xml
<view class="container">
  <button
    type="primary"
    bindtap="onAutoPublish"
    disabled="{{loading}}"
    loading="{{loading}}"
  >
    {{loading ? '发布中...' : '自动发布'}}
  </button>

  <view wx:if="{{result}}" class="result">
    <text>发布成功！</text>
    <text>热点话题：{{result.hot_topic.title}}</text>
    <text>评分：{{result.hot_topic.score}}/10</text>
  </view>
</view>
```

---

## 安全建议

### 1. 使用HTTPS
```bash
# 使用Nginx反向代理配置SSL
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. API密钥保护
```bash
# .env 文件不要提交到Git
echo ".env" >> .gitignore

# 修改文件权限
chmod 600 .env
```

### 3. 访问控制
```python
# draft-api.py 中添加IP白名单
ALLOWED_IPS = ['192.168.1.100', '10.0.0.50']

@app.before_request
def check_ip():
    if request.remote_addr not in ALLOWED_IPS:
        return jsonify({'error': 'Forbidden'}), 403
```

### 4. API限流
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["10 per minute"]
)

@app.route('/auto-publish', methods=['POST'])
@limiter.limit("5 per minute")
def auto_publish():
    # ...
```

---

## 故障排查

### 1. 服务无法启动
```bash
# 检查端口占用
netstat -ano | findstr "8001"  # Windows
netstat -tulpn | grep 8001   # Linux

# 检查Python版本
python --version  # 需要 >= 3.8
```

### 2. 小程序无法连接
```bash
# 检查服务器防火墙
sudo ufw status  # Ubuntu
sudo firewall-cmd --list-all  # CentOS

# 开放端口
sudo ufw allow 8001  # Ubuntu
sudo firewall-cmd --add-port=8001/tcp --permanent  # CentOS
sudo firewall-cmd --reload
```

### 3. 依赖安装失败
```bash
# 使用国内镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

---

## 推荐部署方案

| 场景 | 推荐方案 | 优点 |
|------|----------|------|
| 开发测试 | 本地运行 | 快速、免费 |
| 个人项目 | 云服务器 | 稳定、便宜 |
| 企业应用 | 云服务器 + HTTPS | 安全、可扩展 |
| 高并发 | Docker + Nginx | 易管理、高性能 |

---

## 总结

✅ **正确的使用方式：**
1. `draft-api.py` 作为独立服务运行（本地或云服务器）
2. 小程序通过HTTP API调用服务
3. 返回JSON数据给小程序使用

❌ **错误的理解：**
1. ❌ 小程序不能直接运行Python文件
2. ❌ 小程序不能像普通网页那样调用Python后端

**关键点：** 小程序 + Python = HTTP API + 独立服务

---

## 联系支持

如有问题，请参考：
- 📖 完整文档：`DRAFT_API_GUIDE.md`
- 🔧 故障排查：`DRAFT_API_DEPLOY.md`
- 📧 技术支持：[联系方式]
