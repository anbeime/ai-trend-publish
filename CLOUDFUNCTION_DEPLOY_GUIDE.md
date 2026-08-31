# 云函数部署指南

## 问题说明

当前云函数调用超时 15 秒，错误信息：
```
Error: errCode: -504003 | errMsg: Invoking task timed out after 15 seconds
```

这是因为虽然已经在 package.json 中配置了 60 秒超时，但**云函数还没有重新部署到云端**。

## 部署方法

### 方法一：逐个部署（推荐）

在微信开发者工具中：

1. 找到 `cloudfunctions` 目录
2. 右键点击以下云函数文件夹
3. 选择「上传并部署：云端安装依赖」
4. 等待部署完成

### 必须部署的云函数列表

优先级高的云函数（涉及 AI 调用）：

- [ ] `glm-api` - AI 模型调用
- [ ] `agentAI` - 智能体 AI
- [ ] `generateImage` - 图片生成
- [ ] `video-composer` - 视频合成
- [ ] `coze-skill` - Coze 技能
- [ ] `content-optimizer` - 内容优化
- [ ] `hotspot-analyzer` - 热点分析
- [ ] `hotspot-scorer` - 热点评分
- [ ] `viral-video-parser` - 爆款视频解析

其他云函数：

- [ ] `api-config`
- [ ] `character-manager`
- [ ] `chatDream`
- [ ] `generateDreamPrompt`
- [ ] `project-manager`
- [ ] `template-manager`
- [ ] `mediacrawler-hotspot`
- [ ] `init-collections`
- [ ] `link-parser`
- [ ] `social-media-proxy`
- [ ] `member-manager`
- [ ] `wechat-account-manager`
- [ ] `hotspot-miyucaicai`
- [ ] `url-to-markdown`
- [ ] `creationHistory`

### 方法二：批量部署命令

如果微信开发者工具支持批量部署：

1. 在微信开发者工具的「云开发控制台」中
2. 选择「云函数」
3. 批量选择所有云函数
4. 点击「上传并部署」

## 验证部署成功

部署完成后，验证超时配置是否生效：

1. 打开云开发控制台
2. 选择「云函数」
3. 点击具体云函数查看详情
4. 检查「超时时间」是否为 60 秒
5. 检查「内存」配置是否符合预期

## 配置规范

| 云函数类型 | 内存 | 超时 | 示例 |
|-----------|------|------|------|
| AI 相关 | 512MB | 60s | glm-api, agentAI, generateImage |
| 视频处理 | 1024MB | 60s | video-composer |
| 数据管理 | 256MB | 60s | project-manager, template-manager |
| 网络请求 | 512MB | 60s | mediacrawler-hotspot, social-media-proxy |

## 部署后测试

部署完成后，重新测试：

1. 打开小程序
2. 进入热点页面
3. 点击热点跳转到多智能体页面
4. 开始创作
5. 观察是否还有超时错误

## 常见问题

### Q1: 部署后仍然超时？

检查：
1. 云函数是否部署成功
2. 云开发控制台中云函数的超时配置是否为 60 秒
3. 云函数日志中是否有错误

### Q2: 部署失败？

检查：
1. package.json 格式是否正确
2. 依赖包是否能正常安装
3. 云开发环境是否正常

### Q3: 如何查看云函数日志？

1. 打开云开发控制台
2. 选择「云函数」
3. 点击具体云函数
4. 选择「日志」标签
5. 查看调用日志和错误信息

## 重要提示

**修改 package.json 后必须重新部署云函数才能生效！**

package.json 中的配置：
```json
{
  "cloudfunction-config": {
    "memorySize": 512,
    "timeout": 60
  }
}
```

这个配置只在部署时生效，已部署的云函数不会自动更新。
