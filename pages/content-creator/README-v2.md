# 多平台排版优化技能 v2.0 - 使用说明

## 功能概述

本小程序页面集成了完整的多平台排版优化技能，参考专业公众号文章生成流程设计：

### 核心功能

1. **多平台排版优化**
   - **微信公众号**：纯内联CSS HTML、智能高亮、数据卡片、网友热评
   - **小红书**：Emoji增强、结构化标记
   - **知乎**：Markdown格式、引用块
   - **抖音**：口语化、短句节奏
   - **B站**：活泼互动、系列化内容

2. **内容优化工具**
   - 爆款标题生成（4种风格模板）
   - 标题评分系统（0-100分）
   - 内容结构分析
   - SEO优化建议

3. **图片工具**
   - **图片搜索**：基于关键词搜索配图
   - **AI生成**：根据提示词生成专属配图
   - **智能建议**：自动分析内容推荐配图关键词
   - **封面生成**：一键生成平台适配的封面图

4. **公众号文章JSON生成** ⭐新增
   - 符合推送规范的JSON格式
   - 纯内联CSS样式（兼容微信/Obsidian）
   - 包含封面图、4-5张配图、热点标签
   - 关键字段高亮显示
   - 一键复制JSON
   - POST推送到服务器

## 文件结构

```
pages/content-creator/
├── content-creator.js          # 主页面逻辑
├── content-creator.wxml        # 主页面结构
├── content-creator.wxss        # 主页面样式
├── format-optimizer.wxml       # 排版优化组件
├── image-panel.wxml            # 图片工具面板
├── example-article.json        # 示例JSON格式 ⭐新增
└── README-v2.md                # 本说明文档

utils/
├── platform-formatter.js       # 多平台排版工具（已更新内联CSS）
├── content-optimizer.js        # 内容优化工具
└── image-service.js            # 图片服务工具
```

## 使用方法

### 基础使用
1. 选择热点话题
2. 配置创作参数（风格、长度、平台）
3. 点击生成内容
4. 使用排版优化工具进行优化

### 排版优化工具栏

生成内容后，在结果页面顶部会出现排版优化工具栏：

- **⚙️ 排版选项**：配置HTML排版、智能高亮、Emoji等
- **✨ 标题优化**：生成多个优化后的标题供选择
- **🖼️ 配图工具**：搜索或AI生成图片
- **📊 质量分析**：分析内容质量并给出建议
- **🌐 多平台预览**：预览内容在各平台的展示效果
- **📄 生成JSON**：生成符合推送规范的公众号文章JSON ⭐

### 生成公众号文章JSON

1. 生成内容后，点击工具栏的 **📄 生成JSON**
2. 系统会自动生成包含以下内容的JSON：
   - `title`: 文章标题
   - `content`: 纯内联CSS的HTML内容
   - `cover_url`: 封面图URL
3. 在弹窗中可以：
   - 预览HTML效果
   - 点击 **📋 复制JSON** 复制到剪贴板
   - 点击 **🚀 推送发布** POST到服务器

### JSON格式规范

生成的JSON符合以下规范：

```json
{
  "title": "文章标题（30字以内）",
  "content": "HTML内容（纯内联CSS，无<style>标签）",
  "cover_url": "封面图URL"
}
```

HTML内容包含：
- 🔥 TOP1 热点标签头部
- 导语框（带高亮关键词）
- 数据卡片（3个核心数据）
- 4-5个图片模块（带说明文字）
- 热点标签云
- 网友观点引用框
- 结尾CTA

### 关键词高亮样式

使用纯内联CSS实现的高亮效果：

```html
<span style="background: linear-gradient(120deg, #ffeaa7 0%, #ffeaa7 100%); 
  background-repeat: no-repeat; 
  background-size: 100% 40%; 
  background-position: 0 88%; 
  padding: 0 4px; 
  font-weight: bold; 
  color: #2d3436;">
  高亮文字
</span>
```

### 推送文章到服务器

1. 生成JSON后，点击 **🚀 推送发布**
2. 系统会POST到：`http://39.108.254.228:8002/publish-draft`
3. 超时时间：120秒
4. 失败自动重试3次

## 配置说明

### 图片搜索配置（可选）

如需使用更高质量的图片搜索，可在 `image-service.js` 中配置：

```javascript
this.searchConfig = {
  unsplash: {
    apiKey: 'YOUR_UNSPLASH_API_KEY'
  },
  pexels: {
    apiKey: 'YOUR_PEXELS_API_KEY'
  }
};
```

### 推送服务器配置

在 `content-creator.js` 中修改推送URL：

```javascript
const url = 'http://39.108.254.228:8002/publish-draft';
```

## 质量检查清单

发布前确认：

- [ ] 热点是今日真实数据
- [ ] 封面图与话题直接相关
- [ ] 文章包含4-5张配图
- [ ] HTML使用纯内联style（无<style>标签）
- [ ] JSON格式正确（无引号冲突）
- [ ] 关键词高亮使用指定样式
- [ ] 内容长度 > 500字符

## 示例JSON

参考 `example-article.json` 文件，包含完整的公众号文章JSON格式。

## 更新日志

### v2.0 更新内容
- ✅ 纯内联CSS样式（兼容微信/Obsidian）
- ✅ 关键词高亮效果优化
- ✅ 数据卡片、网友热评等模块
- ✅ JSON生成与验证
- ✅ POST推送功能（120秒超时，3次重试）
- ✅ 图片搜索优化

## 注意事项

1. **纯内联CSS**：所有样式都使用 `style=""` 属性，无 `<style>` 标签
2. **JSON引号**：标题中避免使用英文引号，使用中文引号或避免引号
3. **图片URL**：使用 https 协议的真实图片URL
4. **推送失败**：验证JSON格式后再推送，失败会自动重试

## 后续扩展

可进一步集成的功能：
- 接入真实的AI图片生成API
- 热点自动采集与评分
- 多平台一键发布
- 文章数据分析

---

如有问题或建议，欢迎反馈！
