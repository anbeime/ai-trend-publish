# 🎨 微信小程序样式实现指南

## 🔹 核心样式变量（添加到app.wxss）

```css
/* ========== 颜色变量 ========== */
/* 主色：紫粉渐变 */
--color-primary-start: #9333EA;
--color-primary-end: #EC4899;
--color-primary-gradient: linear-gradient(135deg, #9333EA 0%, #EC4899 100%);

/* 背景色 */
--color-background: #F8F9FA;
--color-background-light: #FFFFFF;
--color-background-gray: #F5F7FA;

/* 文字色 */
--color-text-dark: #333333;
--color-text-medium: #666666;
--color-text-light: #999999;
--color-text-white: #FFFFFF;

/* 辅助色 */
--color-orange: #F97316;
--color-pink-light: #FCE7F3;
--color-purple-light: #F3E8FF;

/* ========== 尺寸变量 ========== */
/* 圆角 */
--border-radius-lg: 32rpx;
--border-radius-md: 24rpx;
--border-radius-sm: 16rpx;

/* 内边距 */
--padding-md: 24rpx;
--padding-sm: 16rpx;
--padding-xs: 12rpx;

/* 字体大小 */
--font-size-lg: 32rpx;
--font-size-md: 28rpx;
--font-size-sm: 24rpx;

/* 阴影 */
--shadow-light: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
--shadow-primary: 0 4rpx 12rpx rgba(147, 51, 234, 0.3);
```

## 🔹 通用样式类（添加到app.wxss）

```css
/* 按钮绝对居中 */
.btn-center {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

/* 紫粉渐变按钮 */
.btn-primary {
  background: linear-gradient(135deg, #9333EA 0%, #EC4899 100%) !important;
  color: #FFFFFF !important;
  border-radius: var(--border-radius-md) !important;
  padding: var(--padding-xs) var(--padding-md) !important;
  font-size: var(--font-size-md) !important;
  box-shadow: var(--shadow-primary) !important;
}

/* 白色卡片 */
.card {
  background: #FFFFFF !important;
  border-radius: var(--border-radius-sm) !important;
  padding: var(--padding-sm) !important;
  box-shadow: var(--shadow-light) !important;
  margin-bottom: 20rpx !important;
}

/* 胶囊标签 */
.capsule-tag {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 8rpx 20rpx !important;
  border-radius: 40rpx !important;
  font-size: var(--font-size-sm) !important;
}

.capsule-tag.active {
  background: linear-gradient(135deg, #9333EA 0%, #EC4899 100%) !important;
  color: #FFFFFF !important;
}

.capsule-tag.inactive {
  background: #F3F4F6 !important;
  color: #666666 !important;
}

/* 圆形序号 */
.circle-number {
  width: 48rpx !important;
  height: 48rpx !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: var(--font-size-sm) !important;
  font-weight: bold !important;
}

.circle-number.orange {
  background: #F97316 !important;
  color: #FFFFFF !important;
}

.circle-number.gray {
  background: #E5E7EB !important;
  color: #666666 !important;
}

/* 进度条 */
.progress-bar {
  height: 8rpx !important;
  border-radius: 4rpx !important;
  background: #E5E7EB !important;
  overflow: hidden !important;
}

.progress-bar-fill {
  height: 100% !important;
  border-radius: 4rpx !important;
}

.progress-bar-fill.orange {
  background: #F97316 !important;
}

.progress-bar-fill.purple {
  background: #9333EA !important;
}
```

## 🔹 页面适配实现

### 1. 首页（index.wxss）更新
```css
/* 顶部栏 */
.header-section {
  background: linear-gradient(135deg, #9333EA 0%, #EC4899 100%) !important;
  padding: 40rpx 32rpx 32rpx !important;
  border-radius: 0 0 40rpx 40rpx !important;
}

/* 功能导航网格 */
.quick-functions {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 12rpx !important;
}

.function-btn {
  background: #FFFFFF !important;
  border-radius: var(--border-radius-sm) !important;
  padding: 20rpx 12rpx !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 8rpx !important;
}

/* 热点卡片 */
.hotspot-card {
  background: #FFFFFF !important;
  border-radius: var(--border-radius-sm) !important;
  padding: var(--padding-sm) !important;
  display: flex !important;
  align-items: center !important;
  gap: 20rpx !important;
}

.hotspot-rank {
  width: 48rpx !important;
  height: 48rpx !important;
  border-radius: 50% !important;
  background: linear-gradient(135deg, #9333EA 0%, #EC4899 100%) !important;
  color: #FFFFFF !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
```

### 2. 自媒体创作页面（content-creator.wxss）更新
```css
/* 顶部栏统一 */
.header-section {
  background: linear-gradient(135deg, #9333EA 0%, #EC4899 100%) !important;
}

/* 热点卡片优化 */
.hotspot-card {
  background: #FFFFFF !important;
  border-radius: var(--border-radius-sm) !important;
  padding: var(--padding-sm) !important;
}

.hotspot-rank {
  width: 48rpx !important;
  height: 48rpx !important;
  border-radius: 50% !important;
  background: #F97316 !important;
  color: #FFFFFF !important;
}

/* 进度条样式 */
.progress-container {
  display: flex !important;
  align-items: center !important;
  gap: 12rpx !important;
}

.progress-bar {
  flex: 1 !important;
  height: 8rpx !important;
  background: #E5E7EB !important;
  border-radius: 4rpx !important;
  overflow: hidden !important;
}

.progress-fill {
  height: 100% !important;
  border-radius: 4rpx !important;
}

.progress-fill.heat {
  background: #F97316 !important;
}

.progress-fill.suitability {
  background: #9333EA !important;
}

/* 创作按钮 */
.create-btn {
  background: linear-gradient(135deg, #9333EA 0%, #EC4899 100%) !important;
  color: #FFFFFF !important;
  border-radius: var(--border-radius-md) !important;
  padding: var(--padding-sm) var(--padding-md) !important;
  width: 60% !important;
  margin: 0 auto !important;
}
```

### 3. 模板中心页面（需要创建或更新）
```css
/* 网格布局 */
.template-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 16rpx !important;
  padding: var(--padding-sm) !important;
}

/* 模板卡片 */
.template-card {
  background: #FFFFFF !important;
  border-radius: var(--border-radius-sm) !important;
  padding: var(--padding-sm) !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 12rpx !important;
}

/* 卡片内容布局 */
.template-header {
  display: flex !important;
  align-items: center !important;
  gap: 12rpx !important;
}

.template-icon {
  font-size: 40rpx !important;
  color: #9333EA !important;
}

.template-content {
  flex: 1 !important;
}

.template-title {
  font-size: var(--font-size-md) !important;
  font-weight: bold !important;
  color: var(--color-text-dark) !important;
  margin-bottom: 4rpx !important;
}

.template-desc {
  font-size: var(--font-size-sm) !important;
  color: var(--color-text-light) !important;
}

/* 标签和按钮 */
.template-tags {
  display: flex !important;
  gap: 8rpx !important;
  flex-wrap: wrap !important;
}

.template-tag {
  background: #FCE7F3 !important;
  color: #9333EA !important;
  padding: 4rpx 12rpx !important;
  border-radius: 12rpx !important;
  font-size: 20rpx !important;
}

.template-footer {
  display: flex !important;
  justify-content: flex-end !important;
}

.use-btn {
  background: linear-gradient(135deg, #9333EA 0%, #EC4899 100%) !important;
  color: #FFFFFF !important;
  border-radius: var(--border-radius-sm) !important;
  padding: 8rpx 20rpx !important;
  font-size: var(--font-size-sm) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
```

## 🔧 实施步骤

### 第一步：更新app.wxss
1. 添加颜色变量
2. 添加通用样式类（btn-center、btn-primary、card等）

### 第二步：更新各页面样式
1. **首页**：更新顶部栏、功能导航、热点卡片
2. **自媒体创作**：更新顶部栏、热点卡片、进度条、按钮
3. **模板中心**：实现网格布局和卡片样式

### 第三步：验证和测试
1. 检查所有按钮文字是否绝对居中
2. 验证颜色一致性
3. 测试响应式布局
4. 检查页面底部无多余空白

## 🎯 快速检查清单
- [ ] app.wxss添加了样式变量
- [ ] 所有顶部栏改为紫粉渐变
- [ ] 所有按钮使用.btn-center类
- [ ] 卡片使用.card类
- [ ] 模板中心使用网格布局
- [ ] 进度条样式正确
- [ ] 标签使用胶囊样式
- [ ] 页面背景为#F8F9FA

---

**最后更新**：2026年3月5日  
**版本**：1.0.0