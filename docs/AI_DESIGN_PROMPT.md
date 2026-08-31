# 🎨 AI设计提示词 - 最短可复制版本

## 🔹 核心风格定义（所有页面共用）

### 中文提示词（最简版）
```prompt
移动端小程序全页面UI设计，现代简约平面插画风格，紫粉渐变品牌体系：
1. 配色：主色紫粉渐变(#9333EA→#EC4899)用于顶部栏/选中标签/核心按钮；背景色#F8F9FA；橙色(#F97316)用于热度标识
2. 排版：标题加粗，正文灰色，所有按钮文字绝对居中（flex布局），内边距≥12px
3. 插画：扁平化矢量图标，线条简洁，无渐变阴影
4. 布局：卡片大圆角(16-20px)，白色背景，轻微阴影；模块间距20px，卡片内边距16px
5. 列表：单列信息流；模板中心一行2列网格，卡片间距16px
```

### 英文提示词（最简版）
```prompt
Mobile app UI design, flat illustration style, purple-pink gradient brand system:
1. Colors: Primary gradient(#9333EA→#EC4899) for headers/active tabs/core buttons; Background #F8F9FA; Orange(#F97316) for heat indicators
2. Typography: Bold headings, gray body text, all button text perfectly centered (flex layout), padding≥12px
3. Icons: Flat vector icons, clean lines, no gradients/shadows
4. Layout: Large rounded cards(16-20px), white background, subtle shadow; 20px module spacing, 16px card padding
5. Lists: Single-column flow; Template Center: 2-column grid, 16px card spacing
```

## 🔹 分页面适配（追加到核心规范后）

### 1. 自媒体创作/热点创作页面
```prompt
- 顶部栏：紫粉渐变，标题居中白色
- 热点卡片：白色大圆角，左侧圆形序号(橙色/灰色)，标题加粗，浅紫标签，横向进度条(橙色热度/紫色适合度)
- 核心按钮：「立即创作」紫粉渐变，白色文字，宽度适中
```

### 2. AI短视频创作页面
```prompt
- 输入区：大圆角白色卡片，搜索框细微描边，灰色提示文字
- 功能导航：4个大圆角图标卡片(铅笔/摄像机/模板盒/文件夹)，文字居中
- 标签栏：胶囊状，「全部」紫粉渐变(文字白)，其他浅灰(文字深灰)，文字严格居中
```

### 3. 模板中心页面
```prompt
- 布局：一行2列网格，卡片间距16px
- 卡片：左侧扁平化插画图标，右侧标题+描述+浅粉标签
- 按钮：「使用」紫粉渐变，白色文字，绝对居中
```

## 🔧 强制约束（必须追加）
```prompt
强制约束：所有页面复用同一套配色/插画/排版规范，禁止新增颜色/图标风格；所有按钮文字用display:flex; justify-content:center; align-items:center;实现绝对居中；页面底部无多余空白，信息层级清晰。
```

---

## 📋 一键复制完整版（中文）

```prompt
移动端小程序全页面UI设计，现代简约平面插画风格，紫粉渐变品牌体系：
1. 配色：主色紫粉渐变(#9333EA→#EC4899)用于顶部栏/选中标签/核心按钮；背景色#F8F9FA；橙色(#F97316)用于热度标识
2. 排版：标题加粗，正文灰色，所有按钮文字绝对居中（flex布局），内边距≥12px
3. 插画：扁平化矢量图标，线条简洁，无渐变阴影
4. 布局：卡片大圆角(16-20px)，白色背景，轻微阴影；模块间距20px，卡片内边距16px
5. 列表：单列信息流；模板中心一行2列网格，卡片间距16px

【分页面适配】
- 自媒体/热点创作：顶部栏紫粉渐变；热点卡片白色大圆角，左侧圆形序号，横向进度条；「立即创作」按钮紫粉渐变
- AI短视频创作：输入区白色卡片；4个功能图标卡片；胶囊状标签栏
- 模板中心：一行2列网格；卡片含插画图标+标题+浅粉标签；「使用」按钮紫粉渐变

强制约束：所有页面复用同一套配色/插画/排版规范，禁止新增颜色/图标风格；所有按钮文字用display:flex; justify-content:center; align-items:center;实现绝对居中；页面底部无多余空白，信息层级清晰。
```

---

## 🎯 实施检查清单
- [ ] 所有顶部栏改为紫粉渐变
- [ ] 所有按钮文字绝对居中（flex布局）
- [ ] 卡片圆角统一16-20px
- [ ] 页面背景统一#F8F9FA
- [ ] 标签样式统一胶囊状
- [ ] 模板中心实现一行2列网格
- [ ] 无多余空白，信息层级清晰

---

**版本**：1.0.0  
**更新日期**：2026年3月5日  
**适用场景**：AI设计工具（MidJourney、DALL·E、文心一格、即梦等）