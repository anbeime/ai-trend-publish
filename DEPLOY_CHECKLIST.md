# 🚨 紧急：云函数部署清单

## 问题说明

当前错误：
```
Error: errCode: -504003 | errMsg: Invoking task timed out after 15 seconds
```

**原因**：云函数仍然是默认的15秒超时，虽然已经修改了 package.json 配置为60秒，但**还没有部署到云端**。

## ⚠️ 重要提示

**修改 package.json 后必须重新部署云函数才能生效！**

package.json 中的配置只在部署时生效，已部署的云函数不会自动更新。

## ✅ 部署步骤

### 第一步：打开微信开发者工具

1. 确保微信开发者工具已打开
2. 确保当前项目是 `miniprogram-agent`

### 第二步：部署关键云函数（必须优先部署）

这些云函数涉及AI调用，最容易超时，**必须优先部署**：

- [ ] **glm-api** - AI模型调用（最关键）
- [ ] **agentAI** - 智能体AI
- [ ] **generateImage** - 图片生成
- [ ] **coze-skill** - Coze技能
- [ ] **content-optimizer** - 内容优化
- [ ] **hotspot-analyzer** - 热点分析
- [ ] **hotspot-scorer** - 热点评分
- [ ] **viral-video-parser** - 爆款视频解析

**部署方法：**
1. 在微信开发者工具左侧文件目录中
2. 找到 `cloudfunctions` 文件夹
3. 展开后找到上述云函数文件夹
4. 右键点击云函数文件夹（如 `glm-api`）
5. 选择「上传并部署：云端安装依赖」
6. 等待部署完成（约10-30秒）

### 第三步：部署其他云函数（可选）

如果时间充裕，建议部署所有云函数：

- [ ] api-config
- [ ] character-manager
- [ ] chatDream
- [ ] creationHistory
- [ ] generateDreamPrompt
- [ ] hotspot-miyucaicai
- [ ] init-collections
- [ ] link-parser
- [ ] mediacrawler-hotspot
- [ ] member-manager
- [ ] pay
- [ ] project-manager
- [ ] social-media-proxy
- [ ] template-manager
- [ ] topic-scorer
- [ ] url-to-markdown
- [ ] video-composer
- [ ] wechat-account-manager
- [ ] wechat-publish-api
- [ ] wechat-publish-sdk
- [ ] xiaohongshu-publisher

## 验证部署成功

### 方法一：云开发控制台验证

1. 点击微信开发者工具顶部的「云开发」按钮
2. 打开云开发控制台
3. 选择左侧「云函数」
4. 点击 `glm-api` 查看详情
5. 检查「配置」标签页：
   - **超时时间**：应为 **60秒**
   - **内存**：应为 **512MB**

### 方法二：测试验证

部署完成后，重新测试：

1. 刷新小程序（点击编译按钮）
2. 进入热点页面
3. 点击热点跳转到多智能体页面
4. 开始创作
5. 观察是否还有超时错误

## 快速部署命令（如果支持）

如果微信开发者工具支持命令行部署：

```bash
# 部署单个云函数
wxcloud functions:deploy glm-api

# 批量部署所有云函数
wxcloud functions:deploy --all
```

## 常见问题

### Q1: 部署失败怎么办？

**检查：**
1. 网络是否正常
2. 云开发环境是否正常
3. package.json 格式是否正确
4. 是否有语法错误

### Q2: 部署后仍然超时？

**检查：**
1. 云开发控制台中云函数的超时配置是否为60秒
2. 是否部署到了正确的云开发环境
3. 是否重新编译了小程序

### Q3: 如何查看部署日志？

1. 打开云开发控制台
2. 选择「云函数」
3. 点击具体云函数
4. 选择「日志」标签
5. 查看部署日志和调用日志

## 预期结果

部署成功后：

- ✅ 云函数超时时间：60秒
- ✅ AI调用不再超时
- ✅ 热点创作流程正常工作
- ✅ 分镜图片生成成功

## 时间估算

- 优先部署8个关键云函数：约 5-10 分钟
- 部署所有32个云函数：约 15-30 分钟

---

**请按照上述步骤立即部署云函数，部署完成后重新测试！**
