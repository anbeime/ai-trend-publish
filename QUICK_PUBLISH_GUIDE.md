# 快速发布功能使用指南

## 📋 功能概述

简化版发布流程，无需采集热点，直接将已生成的内容进行排版并发布到公众号草稿箱。

---

## 🎯 两种发布模式对比

### 模式1：多账号发布（需配置公众号）

**适用场景**：需要发布到不同公众号

**流程**：
1. 配置公众号（AppID + AppSecret）
2. 生成内容
3. 选择要发布的公众号
4. 点击"立即发布"

**特点**：
- ✅ 支持多个公众号
- ✅ 可随时切换账号
- ✅ 配置一次永久保存

### 模式2：快速发布（默认公众号）

**适用场景**：快速发布到默认公众号

**流程**：
1. 生成内容
2. 点击"快速发布"
3. 自动发布到默认公众号

**特点**：
- ✅ 无需选择公众号
- ✅ 一键快速发布
- ✅ 自动生成封面图

---

## 🚀 快速发布流程

### 步骤1：生成内容

在内容创作页面：

1. **选择热点**（可选）
   - 从热点列表选择一个话题
   - 或跳过热点，直接创作

2. **设置创作参数**
   - 创作类型：文章/帖子/视频脚本
   - 内容风格：专业/轻松/幽默等
   - 内容长度：短文/中文/长文
   - 目标平台：微信公众号

3. **开始生成**
   - 点击"开始生成"按钮
   - 等待AI生成内容

### 步骤2：预览内容

生成完成后，在步骤3查看：

- ✅ 标题
- ✅ 正文内容
- ✅ 推荐标签
- ✅ 封面建议

### 步骤3：快速发布

点击 **"快速发布"** 按钮，系统自动：

1. ✅ 生成HTML排版（内联CSS）
2. ✅ 添加封面图（自动生成或使用现有）
3. ✅ 插入配图（如果有）
4. ✅ 构建JSON数据
5. ✅ POST推送到草稿箱API
6. ✅ 显示发布结果

---

## 📝 HTML排版规范

### 自动生成的HTML包含：

#### 1. 头部热点标签
```html
<div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); padding: 15px 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
  <span style="color: #fff; font-size: 16px; font-weight: bold;">🔥 TOP1 今日爆款</span>
</div>
```

#### 2. 导语框
```html
<div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
  <p style="margin: 0; line-height: 1.8; color: #555; font-size: 15px;">导语内容...</p>
</div>
```

#### 3. 数据卡片
```html
<div style="display: flex; justify-content: space-between; margin-bottom: 25px; gap: 15px;">
  <div style="flex: 1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; text-align: center;">
    <div style="font-size: 28px; font-weight: bold; color: #fff; margin-bottom: 5px;">10W+</div>
    <div style="font-size: 13px; color: rgba(255,255,255,0.9);">阅读量</div>
  </div>
  <!-- 更多数据卡片 -->
</div>
```

#### 4. 正文内容
```html
<p style="line-height: 1.8; color: #333; margin-bottom: 16px; text-align: justify; font-size: 16px;">
  正文内容，包含<span style="background: linear-gradient(120deg, #ffeaa7 0%, #ffeaa7 100%); background-repeat: no-repeat; background-size: 100% 40%; background-position: 0 88%; padding: 0 4px; font-weight: bold; color: #2d3436;">高亮关键词</span>
</p>
```

#### 5. 配图模块
```html
<div style="margin: 25px 0; text-align: center;">
  <img src="图片URL" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" alt="配图"/>
  <p style="font-size: 13px; color: #888; margin-top: 10px; font-style: italic;">▲ 相关配图</p>
</div>
```

#### 6. 热点标签云
```html
<span style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 14px; border-radius: 20px; margin-right: 10px; margin-bottom: 10px; font-size: 14px; box-shadow: 0 2px 8px rgba(102,126,234,0.3);">#标签</span>
```

#### 7. 引用框
```html
<div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 20px; border-radius: 12px; margin: 30px 0; position: relative;">
  <div style="position: absolute; top: -10px; left: 20px; background: #fff; padding: 5px 15px; border-radius: 20px; font-size: 14px; color: #e17055; font-weight: bold;">💬 网友热评</div>
  <p style="margin: 15px 0 0 0; line-height: 1.8; color: #555; font-size: 15px; font-style: italic;">"网友观点..."</p>
</div>
```

#### 8. 结尾CTA
```html
<div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-top: 30px; text-align: center;">
  <p style="margin: 0 0 15px 0; font-size: 16px; color: #333; font-weight: 500;">👆 觉得有用？别忘了点赞、在看、转发三连！</p>
  <p style="margin: 0; font-size: 14px; color: #888;">关注公众号，获取更多热点资讯</p>
</div>
```

---

## 🎨 封面图自动生成

### 生成策略

1. **优先使用现有图片**
   - 用户上传的封面图
   - 搜索到的图片

2. **混元AI生成**
   - 根据标题生成主题封面
   - 简约现代风格
   - 尺寸：900x500

3. **占位图服务**
   - 备选方案
   - 包含文章标题
   - 品牌配色

### 生成代码示例

```javascript
async generateDefaultCover(title) {
  // 方案1：混元AI生成
  if (this.data.hunyuanConfig.enabled) {
    const coverPrompt = `公众号文章封面图，主题：${title}，简约现代风格`;
    const result = await this.callHunyuanImageAPI(coverPrompt);
    return result.url;
  }

  // 方案2：占位图服务
  return `https://via.placeholder.com/900x500/667eea/ffffff?text=${encodeURIComponent(title)}`;
}
```

---

## 📊 JSON数据格式

### 发布到API的JSON结构

```json
{
  "title": "文章标题（30字以内）",
  "content": "完整的HTML内容（>5000字符，纯内联CSS）",
  "cover_url": "封面图URL（真实图片地址）"
}
```

### 数据验证

```javascript
// 验证规则
if (!articleJSON.title || !articleJSON.content || !articleJSON.cover_url) {
  throw new Error('文章数据不完整');
}

if (articleJSON.content.length < 500) {
  throw new Error('文章内容长度不足');
}
```

---

## 🔧 API接口说明

### 草稿箱发布接口

**URL**: `http://39.108.254.228:8002/publish-draft`

**方法**: POST

**Content-Type**: application/json

**超时**: 120秒

**请求示例**:
```javascript
wx.request({
  url: 'http://39.108.254.228:8002/publish-draft',
  method: 'POST',
  data: {
    title: "文章标题",
    content: "<html>...</html>",
    cover_url: "https://..."
  },
  header: {
    'Content-Type': 'application/json'
  },
  timeout: 120000,
  success: (res) => {
    console.log('发布成功:', res);
  }
});
```

**成功响应**:
```json
{
  "success": true,
  "media_id": "草稿media_id",
  "message": "草稿创建成功"
}
```

**失败响应**:
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

## ✅ 质量检查清单

发布前自动验证：

- ✅ 文章标题不为空
- ✅ HTML内容长度 > 500字符
- ✅ 封面图URL有效
- ✅ HTML使用纯内联CSS
- ✅ 包含热点标签头部
- ✅ 包含导语框
- ✅ 包含数据卡片
- ✅ 包含配图模块
- ✅ 包含标签云
- ✅ 包含结尾CTA

---

## 🎯 使用场景

### 场景1：热点文章发布

1. 选择今日热点
2. 生成深度文章
3. 快速发布到草稿箱
4. 公众号后台审核发布

### 场景2：原创内容发布

1. 跳过热点选择
2. 输入创作主题
3. 生成原创内容
4. 快速发布到草稿箱

### 场景3：多平台分发

1. 生成内容后
2. 先快速发布到公众号
3. 再复制内容到其他平台
4. 一键多平台分发

---

## 🚨 常见问题

### Q1: 发布失败提示"文章数据不完整"

**原因**: 内容生成失败或为空

**解决**: 重新生成内容后再发布

### Q2: 发布失败提示"文章内容长度不足"

**原因**: 生成的内容太短

**解决**: 选择"长文"模式重新生成

### Q3: 封面图无法显示

**原因**: 图片URL无效或网络问题

**解决**: 
- 检查网络连接
- 系统会自动生成备用封面

### Q4: HTML排版在公众号中显示异常

**原因**: 公众号编辑器兼容性问题

**解决**:
- ✅ 系统已使用纯内联CSS
- ✅ 兼容微信公众号编辑器
- 如有问题，复制HTML到公众号后台测试

---

## 📝 总结

### 快速发布优势

- ✅ **简化流程**：无需配置公众号
- ✅ **自动化排版**：一键生成专业排版
- ✅ **自动封面**：智能生成封面图
- ✅ **快速发布**：120秒内完成
- ✅ **质量保证**：自动验证数据完整性

### 与多账号发布对比

| 特性 | 快速发布 | 多账号发布 |
|------|---------|-----------|
| 配置要求 | 无需配置 | 需配置公众号 |
| 发布速度 | ⚡ 更快 | 🔄 需选择账号 |
| 适用场景 | 默认公众号 | 多个公众号 |
| 封面图 | 自动生成 | 支持上传 |
| 排版样式 | 自动排版 | 自动排版 |

---

## 🎉 完成

现在你可以：

1. ✅ 生成内容后一键快速发布
2. ✅ 自动生成专业排版
3. ✅ 自动生成封面图
4. ✅ 直接推送到草稿箱API
5. ✅ 在公众号后台审核发布

开始使用快速发布功能，提升内容创作效率！
