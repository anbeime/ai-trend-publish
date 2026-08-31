# 多用户发布系统 - 完整部署指南

## 📋 系统架构

### 服务端口分配

| 端口 | 服务          | 状态      | 用途                             |
| ---- | ------------- | --------- | -------------------------------- |
| 8002 | draft-api.py  | ✅ 已部署 | 微信公众号发布（现有服务，勿动） |
| 8003 | upload-api.py | 🚀 待部署 | 社交媒体上传（新服务，本次部署） |

### 数据流架构

```
┌─────────────────┐
│  微信小程序     │
│  pages/publish  │
└────────┬────────┘
         │ wx.cloud.callFunction
         ↓
┌──────────────────────────────┐
│  微信云函数                   │
│  social-media-proxy          │
│  (CloudBase环境变量配置)      │
└────────┬─────────────────────┘
         │ HTTP POST
         ↓
┌──────────────────────────────┐
│  Social Media Upload API     │
│  Port 8003                   │
│  http://39.108.254.228:8003  │
└────────┬─────────────────────┘
         │
         ↓
┌──────────────────────────────┐
│  HD_HUMAN Uploader           │
│  social-auto-upload-main     │
└────────┬─────────────────────┘
         │
         ↓
┌──────────────────────────────┐
│  社交媒体平台                │
│  - 抖音 (Douyin)            │
│  - 小红书 (Xiaohongshu)      │
│  - B站 (Bilibili)            │
│  - 快手 (Kuaishou)           │
│  - TikTok                    │
└──────────────────────────────┘
```

---

## 🚀 部署步骤

### 前置条件

1. **服务器访问权限**
   - SSH访问: `39.108.254.228`
   - Root权限

2. **环境准备**

   ```bash
   # 检查Python版本
   python3 --version  # 需要 >= 3.8

   # 检查systemd
   systemctl --version
   ```

3. **HD_HUMAN项目准备**
   ```bash
   # 将HD_HUMAN项目上传到服务器
   # 路径: /root/miniprogram-agent/social-auto-upload-main
   ```

### 步骤1: 上传文件到服务器

```bash
# 在本地执行（Windows Git Bash或PowerShell）
cd C:\D\compet\tengxun\miniprogram-agent

# 上传必要文件到服务器
scp upload-api.py root@39.108.254.228:/root/miniprogram-agent/
scp requirements.txt root@39.108.254.228:/root/miniprogram-agent/
scp deploy-upload-api.sh root@39.108.254.228:/root/miniprogram-agent/

# 上传HD_HUMAN项目（如果尚未上传）
scp -r social-auto-upload-main root@39.108.254.228:/root/miniprogram-agent/
```

### 步骤2: SSH登录服务器并执行部署

```bash
# SSH登录服务器
ssh root@39.108.254.228

# 进入项目目录
cd /root/miniprogram-agent

# 赋予部署脚本执行权限
chmod +x deploy-upload-api.sh

# 执行部署
./deploy-upload-api.sh
```

**部署脚本会自动完成以下操作：**

1. 检查Python环境
2. 安装依赖（requirements.txt）
3. 检查HD_HUMAN项目
4. 配置systemd服务
5. 启动服务（端口8003）
6. 执行健康检查

### 步骤3: 验证服务部署

```bash
# 检查服务状态
sudo systemctl status social-upload-api

# 查看服务日志
sudo journalctl -u social-upload-api -f

# 测试健康检查
curl http://localhost:8003/api/health

# 测试平台列表
curl http://localhost:8003/api/platforms
```

**预期输出示例：**

```json
// 健康检查响应
{
  "status": "ok",
  "service": "Social Media Upload API",
  "timestamp": "2026-02-15T10:43:18.123456"
}

// 平台列表响应
{
  "success": true,
  "platforms": [
    {"id": "douyin", "name": "抖音", "icon": "🎵", "status": "active"},
    {"id": "xiaohongshu", "name": "小红书", "icon": "📕", "status": "active"},
    {"id": "bilibili", "name": "B站", "icon": "📺", "status": "active"},
    {"id": "kuaishou", "name": "快手", "icon": "🎥", "status": "active"},
    {"id": "tiktok", "name": "TikTok", "icon": "🎬", "status": "active"}
  ]
}
```

---

## 🔧 云函数配置

### 更新云函数环境变量

1. **访问微信云开发控制台**
   - 环境ID: `invideo-6gidgilyee392cc8`
   - 云函数: `social-media-proxy`

2. **修改环境变量**
   | 变量名 | 新值 | 说明 |
   |--------|------|------|
   | `SOCIAL_UPLOAD_API_URL` | `http://39.108.254.228:8003` | 新上传API地址（端口8003） |
   | `DEBUG` | `false` | 调试模式关闭 |

3. **保存并重新部署云函数**

### 验证云函数连接

```javascript
// 在微信开发者工具控制台测试
wx.cloud.callFunction({
  name: "social-media-proxy",
  data: {
    action: "health",
  },
  success: (res) => {
    console.log("健康检查结果:", res.result);
    // 预期: { success: true, apiAvailable: true, apiBaseUrl: 'http://39.108.254.228:8003' }
  },
  fail: (err) => {
    console.error("健康检查失败:", err);
  },
});
```

---

## 📱 小程序使用

### 1. 导航到发布页面

在微信开发者工具中，访问：

```
pages/publish/publish
```

### 2. 选择发布平台

- 勾选要发布的平台（支持多选）
  - 🎵 抖音
  - 📕 小红书
  - 📺 B站
  - 🎥 快手
  - 🎬 TikTok

### 3. 填写视频信息

- **视频来源**: 选择本地视频文件
- **视频标题**: 输入视频标题
- **视频标签**: 输入标签（例如：#AI #科技 #创新）

### 4. 发布内容

点击"发布"按钮，系统会：

1. 上传视频到云存储
2. 调用云函数
3. 云函数转发到后端API（端口8003）
4. 后端API调用HD_HUMAN上传器
5. 上传器自动化发布到各平台

### 5. 查看发布结果

发布完成后，显示每个平台的上传状态：

- ✅ 成功
- ❌ 失败（附带错误信息）

---

## 🧪 测试流程

### 1. 健康检查测试

```bash
# 本地测试
curl http://39.108.254.228:8003/api/health

# 小程序测试
wx.cloud.callFunction({
  name: 'social-media-proxy',
  data: { action: 'health' }
});
```

### 2. 平台列表测试

```bash
curl http://39.108.254.228:8003/api/platforms
```

### 3. 单平台发布测试

在小程序中：

1. 选择一个平台（例如：抖音）
2. 选择测试视频
3. 填写标题和标签
4. 点击发布

### 4. 批量发布测试

在小程序中：

1. 选择多个平台
2. 选择测试视频
3. 填写标题和标签
4. 点击批量发布

---

## 🔍 故障排查

### 问题1: 端口冲突

**症状**: 服务启动失败，提示端口已被占用

**解决方案**:

```bash
# 检查端口占用
sudo netstat -tlnp | grep 8003

# 如果端口被占用，杀死占用进程
sudo kill -9 <PID>

# 或者修改upload-api.py中的端口配置
export API_PORT=8005  # 使用其他端口
```

### 问题2: HD_HUMAN项目未找到

**症状**: 日志显示"HD_HUMAN项目路径不存在"

**解决方案**:

```bash
# 检查项目路径
ls -la /root/miniprogram-agent/social-auto-upload-main

# 如果不存在，上传项目
scp -r social-auto-upload-main root@39.108.254.228:/root/miniprogram-agent/

# 重启服务
sudo systemctl restart social-upload-api
```

### 问题3: 云函数连接失败

**症状**: 小程序调用云函数超时或返回错误

**检查清单**:

```bash
# 1. 检查后端服务状态
sudo systemctl status social-upload-api

# 2. 检查端口监听
sudo netstat -tlnp | grep 8003

# 3. 测试外网访问
curl http://39.108.254.228:8003/api/health

# 4. 检查防火墙
sudo firewall-cmd --list-ports
# 如果需要，开放端口
sudo firewall-cmd --add-port=8003/tcp --permanent
sudo firewall-cmd --reload
```

### 问题4: 上传失败

**症状**: 后端API返回上传失败

**排查步骤**:

1. 查看后端日志

   ```bash
   sudo journalctl -u social-upload-api -n 100
   ```

2. 检查HD_HUMAN上传器配置

   ```bash
   ls -la /root/miniprogram-agent/social-auto-upload-main/uploader/
   ```

3. 检查上传器账号配置
   - Cookie是否过期
   - 账号是否登录

---

## 📊 服务监控

### 查看服务状态

```bash
# 服务状态
sudo systemctl status social-upload-api

# 实时日志
sudo journalctl -u social-upload-api -f

# 最近100条日志
sudo journalctl -u social-upload-api -n 100
```

### 服务管理

```bash
# 重启服务
sudo systemctl restart social-upload-api

# 停止服务
sudo systemctl stop social-upload-api

# 启动服务
sudo systemctl start social-upload-api

# 禁用开机自启
sudo systemctl disable social-upload-api

# 启用开机自启
sudo systemctl enable social-upload-api
```

---

## 🔐 安全建议

### 1. 配置防火墙

```bash
# 仅允许特定IP访问（如果需要）
sudo firewall-cmd --add-rich-rule='rule family="ipv4" source address="YOUR_IP" port protocol="tcp" port="8003" accept' --permanent
sudo firewall-cmd --reload
```

### 2. 配置Nginx反向代理

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 500M;

    location /api/social-upload {
        proxy_pass http://127.0.0.1:8003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # 超时设置
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

### 3. 配置HTTPS

```bash
# 使用Let's Encrypt获取免费SSL证书
sudo certbot --nginx -d api.yourdomain.com
```

---

## 📚 相关文档

- [upload-api.py 完整文档](./social-upload-api-README.md)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [HD_HUMAN上传器文档](https://github.com/HD-HUMAN/social-auto-upload-main)
- [微信小程序云函数文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)

---

## ✅ 部署检查清单

部署完成后，请确认以下所有项：

- [ ] upload-api.py 已上传到服务器
- [ ] deploy-upload-api.sh 已执行
- [ ] 服务 social-upload-api 正在运行
- [ ] 健康检查返回成功: `curl http://39.108.254.228:8003/api/health`
- [ ] 平台列表返回正确: `curl http://39.108.254.228:8003/api/platforms`
- [ ] 云函数环境变量已更新为 `http://39.108.254.228:8003`
- [ ] 小程序发布页面可以正常访问
- [ ] 小程序健康检查测试通过
- [ ] 单平台发布测试通过
- [ ] 批量发布测试通过

---

## 🎉 完成

恭喜！多用户发布系统部署完成。

现在用户可以通过小程序将视频一键发布到多个社交媒体平台。

如有问题，请查看故障排查章节或联系技术支持。
