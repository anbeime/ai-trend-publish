# 微信公众号HTML格式和封面图 - 解决方案

## 📋 问题说明

### 问题1：HTML复制后显示源代码
**原因**：公众号编辑器需要纯内联CSS的HTML，不能包含`<style>`标签

**解决方案**：✅ 已实现
- `platform-formatter.js` 生成的HTML已经使用纯内联CSS
- 所有样式都直接写在标签的 `style` 属性中
- 不包含任何 `<style>` 或 `<link>` 标签

### 问题2：缺少封面图
**原因**：发布接口需要封面图URL，否则无法发布

**解决方案**：✅ 已实现
- 自动检测是否有封面图
- 如果没有，自动生成默认封面
- 优先使用混元AI生成高质量封面
- 降级使用占位图服务

---

## ✅ 已实现功能

### 1. 纯内联CSS的HTML生成

```javascript
// platform-formatter.js 生成的HTML格式示例
<h1 style="text-align: center; font-size: 26px; margin-bottom: 30px; color: #2c3e50; font-weight: bold; line-height: 1.4;">
  文章标题
</h1>

<p style="line-height: 1.8; color: #333; margin-bottom: 16px; text-align: justify; font-size: 16px;">
  正文内容
</p>

<span style="background: linear-gradient(120deg, #ffeaa7 0%, #ffeaa7 100%); background-repeat: no-repeat; background-size: 100% 40%; background-position: 0 88%; padding: 0 4px; font-weight: bold; color: #2d3436;">
  高亮关键词
</span>
```

**特点**：
- ✅ 所有样式都是内联的 `style` 属性
- ✅ 支持：字体、颜色、背景、渐变、阴影、圆角
- ✅ 兼容微信公众号编辑器
- ✅ 可以直接复制粘贴到公众号

### 2. 自动封面图生成

**流程**：

```
检查是否有封面图
    ↓
没有 → 尝试使用混元AI生成
    ↓
失败 → 使用占位图服务
    ↓
将封面图插入HTML
    ↓
发布到草稿箱
```

**生成的封面图**：
- 尺寸：900x500（公众号推荐比例）
- 风格：简约现代
- 内容：包含文章标题
- 颜色：品牌色 #667eea

### 3. 配图支持

**当前支持**：
- 自动在正文中插入搜索到的图片
- 每2-3段插入一张图片
- 图片带圆角和阴影
- 包含图片描述

**HTML示例**：
```html
<div style="margin: 25px 0; text-align: center;">
  <img src="图片URL" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" alt="配图"/>
  <p style="font-size: 13px; color: #888; margin-top: 10px; font-style: italic;">▲ 相关配图</p>
</div>
```

---

## 🎨 HTML排版特点

### 1. 结构化排版

```
[顶部热点标签]
    ↓
[导语框]
    ↓
[数据卡片]
    ↓
[正文内容]
    ↓
[网友热评]
    ↓
[底部CTA]
    ↓
[标签区]
```

### 2. 高亮关键词

自动识别并高亮：
- 🔥 **热点关键词**：ChatGPT、AI、人工智能、热点、爆款
- ⚠️ **重要关键词**：重要、关键、核心、必须、揭秘
- 💡 **建议关键词**：建议、推荐、技巧、方法、攻略
- 📊 **数据关键词**：数据、统计、研究、报告、分析
- ⚡ **警告关键词**：注意、警告、避免、风险
- 💭 **概念关键词**：原理、概念、理论、本质

### 3. 视觉元素

- ✅ 渐变背景色块
- ✅ 圆角卡片
- ✅ 阴影效果
- ✅ 装饰性图标
- ✅ 引用框样式
- ✅ 数据可视化卡片

---

## 🧪 测试方法

### 方法1：直接复制HTML

1. 在小程序中生成文章
2. 点击"复制HTML"按钮
3. 打开微信公众号后台
4. 新建图文 → 切换到"HTML"模式
5. 粘贴HTML代码
6. 切换回"可视化"模式查看效果

**预期结果**：排版完整，样式正常显示

### 方法2：通过API发布

1. 配置公众号（AppID + AppSecret + IP白名单）
2. 生成文章
3. 点击"立即发布" → 选择微信公众号
4. 确认发布
5. 查看公众号草稿箱

**预期结果**：
- ✅ 文章出现在草稿箱
- ✅ 有封面图
- ✅ 排版样式完整
- ✅ 图片正常显示

---

## 🔧 自定义样式

如果需要自定义HTML样式，修改 `utils/platform-formatter.js`：

### 修改标题样式

```javascript
// 找到这一行（约第281行）
<h1 style="text-align: center; font-size: 26px; margin-bottom: 30px; color: #2c3e50; font-weight: bold; line-height: 1.4;">

// 修改为你想要的样式
<h1 style="text-align: left; font-size: 28px; margin-bottom: 20px; color: #000; font-weight: 900; line-height: 1.3;">
```

### 修改正文样式

```javascript
// 找到这一行（约第241行）
<p style="line-height: 1.8; color: #333; margin-bottom: 16px; text-align: justify; font-size: 16px;">

// 修改为你想要的样式
<p style="line-height: 2; color: #1a1a1a; margin-bottom: 20px; text-align: left; font-size: 17px;">
```

### 修改高亮颜色

```javascript
// 找到 applyInlineHighlight 方法（约第294行）
{ regex: /(ChatGPT|Claude|GPT-4|AI|人工智能)/g, color: '#ffeaa7' }

// 修改颜色
{ regex: /(ChatGPT|Claude|GPT-4|AI|人工智能)/g, color: '#ff6b6b' }
```

---

## 📊 对比：复制 vs API发布

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 复制HTML | 灵活、可手动调整 | 需要手动操作 | 少量发布、需要修改 |
| API发布 | 自动化、批量支持 | 需要配置 | 频繁发布、批量操作 |

---

## 🚀 未来优化

### 计划功能

1. **更多封面图模板**
   - 科技风格
   - 商务风格
   - 文艺风格
   - 可选择模板

2. **智能配图**
   - 根据内容自动搜索相关图片
   - AI生成配图
   - 图库集成

3. **排版模板库**
   - 多种排版风格
   - 一键切换模板
   - 自定义模板

4. **图片上传**
   - 自动上传图片到微信服务器
   - 获取 media_id
   - 永久素材管理

---

## ❓ 常见问题

### Q1: 复制到公众号后样式丢失？

**原因**：可能复制了完整的HTML文档

**解决**：
1. 只复制 `<body>` 标签内的内容
2. 不要包含 `<!DOCTYPE>` 和 `<html>` 标签
3. 公众号编辑器只需要 body 内容

### Q2: 图片无法显示？

**原因**：图片URL可能无法访问

**解决**：
1. 确保图片URL是公开可访问的
2. 使用HTTPS协议
3. 建议使用微信图床或CDN

### Q3: 发布时提示缺少封面图？

**原因**：API发布必须提供封面图URL

**解决**：
- ✅ 系统会自动生成默认封面
- 或在发布前手动添加封面图
- 或启用混元AI自动生成

---

## 📝 技术细节

### 内联CSS的限制

微信公众号编辑器支持的CSS属性：

✅ **支持**：
- 文本样式：font-size, font-weight, line-height, color, text-align
- 盒模型：margin, padding, border, border-radius
- 背景：background, background-color, background-image（渐变）
- 布局：display, width, max-width, text-align
- 其他：box-shadow, opacity

❌ **不支持**：
- 外部样式表 `<link>`
- 内部样式表 `<style>`
- CSS选择器（class, id）
- 伪元素 ::before, ::after
- 动画 animation
- 定位 position

### HTML模板结构

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="内联样式">
    <h1>标题</h1>
    <div>内容</div>
</body>
</html>
```

---

## ✅ 完成

现在你可以：

1. ✅ 生成纯内联CSS的HTML
2. ✅ 直接复制到公众号使用
3. ✅ 通过API自动发布
4. ✅ 自动生成封面图
5. ✅ 包含配图和排版

如有其他问题，请查看代码或联系技术支持！
