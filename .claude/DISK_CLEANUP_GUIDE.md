# 🧹 Windows 磁盘空间深度清理指南

## 🚨 当前状况

- **总容量**: 1TB
- **剩余空间**: 200GB
- **已使用**: 800GB ⚠️
- **目标**: 释放至少 50-100GB

---

## 📋 快速清理清单

### 立即执行（可释放约 20-50GB）

| 清理项 | 预计释放 | 难度 | 执行 |
|--------|---------|------|------|
| ✅ **卸载 Ubuntu WSL** | 9.7GB | 简单 | 自动脚本 |
| ✅ **Docker 缓存** | 5-20GB | 简单 | 自动脚本 |
| ✅ **npm/yarn 缓存** | 1-5GB | 简单 | 自动脚本 |
| ✅ **Windows 临时文件** | 2-10GB | 简单 | 自动脚本 |
| ✅ **Windows Update 缓存** | 5-15GB | 简单 | 磁盘清理 |
| ⚠️ **大文件查找** | 10-100GB | 中等 | 手动 |
| ⚠️ **旧版本文件** | 5-20GB | 中等 | 手动 |

---

## 🚀 自动化清理（推荐先执行）

### 运行自动清理脚本

```bash
# 已创建的清理脚本
.claude\cleanup-disk-space.bat

# 这将自动清理：
# 1. Ubuntu WSL (9.7GB)
# 2. Docker 缓存 (可能5-20GB)
# 3. npm 缓存 (1-5GB)
# 4. Windows 临时文件 (2-10GB)
# 5. 系统更新缓存 (5-15GB)
```

**预计释放**: 22-60GB ✅

---

## 🔍 手动深度清理

### 1. Ubuntu WSL（9.7GB）

#### Ubuntu 中的内容分析

```
/home/topgo 目录：
├── HUIZHI-ChargeOS-cloud (286M)  - 项目代码
├── osworld-mcp (108M)            - MCP项目
├── .nvm                          - Node版本管理
├── .claude                       - Claude配置
├── snap (66M)                    - Snap包
└── warp-terminal (40M)           - 终端安装包

总计：约2.4GB用户数据，7.3GB系统文件
```

#### 卸载命令（如果确认不需要）

```bash
# 快速卸载
wsl --terminate Ubuntu
wsl --unregister Ubuntu

# 验证
wsl -l -v
```

**✅ 释放**: 9.7GB

#### ⚠️ 重要提示

如果 Ubuntu 中的项目还需要：
- `HUIZHI-ChargeOS-cloud` - 看起来是充电桩项目？
- `osworld-mcp` - MCP服务器项目？

**建议**: 如果不确定，先备份：
```bash
# 导出到Windows
wsl --export Ubuntu C:\ubuntu-backup.tar
# 文件大小约 3-4GB（压缩后）
```

---

### 2. Docker 清理（可能释放 5-20GB）

#### 检查 Docker 占用

```bash
# 查看 Docker 磁盘使用
docker system df

# 输出示例：
# Images          15GB
# Containers      2GB
# Volumes         3GB
# Build Cache     10GB
```

#### 清理策略

```bash
# 方法1: 清理所有未使用资源（激进）
docker system prune -a -f --volumes

# 方法2: 只清理悬空资源（保守）
docker system prune -f

# 方法3: 单独清理
docker image prune -a -f        # 清理镜像
docker container prune -f        # 清理容器
docker volume prune -f           # 清理卷
docker builder prune -a -f       # 清理构建缓存
```

**预计释放**: 5-20GB

---

### 3. Node.js 相关清理（1-10GB）

#### npm 缓存

```bash
# 查看缓存大小
npm cache verify

# 清理缓存
npm cache clean --force
```

**预计释放**: 1-3GB

#### yarn 缓存（如果安装了）

```bash
# 查看缓存位置
yarn cache dir

# 清理缓存
yarn cache clean
```

**预计释放**: 0.5-2GB

#### node_modules 查找与清理

```bash
# 查找所有 node_modules（可能很多！）
# 使用 PowerShell
Get-ChildItem -Path C:\ -Directory -Recurse -ErrorAction SilentlyContinue | Where-Object {$_.Name -eq "node_modules"} | Select-Object FullName

# 或使用工具：npx npkill
npx npkill
```

**预计释放**: 2-5GB

---

### 4. Python 相关清理（1-5GB）

```bash
# pip 缓存
pip cache purge

# 查看所有 Python 环境
where python

# 查找 __pycache__ 目录
Get-ChildItem -Path C:\D -Directory -Recurse -ErrorAction SilentlyContinue | Where-Object {$_.Name -eq "__pycache__"}
```

**预计释放**: 1-3GB

---

### 5. Windows 系统清理（10-30GB）

#### A. 磁盘清理工具

```bash
# 打开磁盘清理
cleanmgr

# 或使用存储感知
# 设置 > 系统 > 存储 > 临时文件
```

**可清理项**：
- ✅ Windows 更新清理 (5-15GB)
- ✅ 临时文件 (2-5GB)
- ✅ 回收站 (?)
- ✅ 缩略图缓存 (0.5-2GB)
- ✅ 下载文件夹 (?)
- ✅ 传递优化文件 (1-5GB)

#### B. Windows.old 文件夹

```bash
# 如果有 Windows 升级残留
# C:\Windows.old 可能占用 10-30GB

# 删除方法：
# 磁盘清理 > 清理系统文件 > 以前的 Windows 安装
```

**预计释放**: 10-30GB（如果存在）

#### C. 休眠文件

```bash
# 如果不使用休眠功能
# hiberfil.sys 占用约等于RAM大小

# 禁用休眠（需要管理员）
powercfg -h off
```

**预计释放**: 4-32GB（取决于RAM大小）

---

### 6. 开发工具清理（5-20GB）

#### Visual Studio / VS Code

```bash
# VS Code 扩展缓存
%USERPROFILE%\.vscode\extensions

# Visual Studio 安装缓存
C:\ProgramData\Package Cache
```

#### Git 仓库清理

```bash
# 查找大型 .git 目录
Get-ChildItem -Path C:\ -Directory -Recurse -ErrorAction SilentlyContinue | Where-Object {$_.Name -eq ".git"} | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB
    [PSCustomObject]@{
        Path = $_.Parent.FullName
        Size = "{0:N2} GB" -f $size
    }
} | Sort-Object {[double]($_.Size -replace ' GB','')} -Descending
```

---

### 7. 大文件分析（重要！）⭐

#### 使用工具查找大文件

**推荐工具**：

1. **WinDirStat** (免费)
   - 下载：https://windirstat.net/
   - 可视化磁盘使用情况
   - 轻松找到大文件

2. **TreeSize Free** (免费)
   - 下载：https://www.jam-software.com/treesize_free
   - 快速扫描
   - 按大小排序

3. **Windows 存储感知** (内置)
   ```
   设置 > 系统 > 存储
   点击 C: 盘查看详细信息
   ```

#### PowerShell 查找大文件

```powershell
# 查找 C: 盘大于 1GB 的文件
Get-ChildItem -Path C:\ -Recurse -ErrorAction SilentlyContinue -File |
Where-Object {$_.Length -gt 1GB} |
Sort-Object Length -Descending |
Select-Object @{Name="Size(GB)";Expression={"{0:N2}" -f ($_.Length/1GB)}}, FullName |
Format-Table -AutoSize
```

---

### 8. 常见大文件位置

#### 检查这些位置

```bash
# 1. 下载文件夹
C:\Users\13632\Downloads

# 2. 桌面
C:\Users\13632\Desktop

# 3. 文档
C:\Users\13632\Documents

# 4. 视频
C:\Users\13632\Videos

# 5. 虚拟机文件
C:\Users\13632\VirtualBox VMs
C:\Users\13632\AppData\Local\Packages\*\LocalState\*  # WSL2

# 6. 备份文件
# 搜索 .bak, .backup, .old 文件

# 7. 日志文件
# 搜索 .log 文件大于 100MB 的
```

---

## 📊 预计清理效果

### 保守估计（至少 30GB）

```
卸载 Ubuntu WSL         9.7GB
Docker 清理             5GB
npm/yarn 缓存          2GB
Windows 临时文件        5GB
Windows Update 缓存     8GB
Python 缓存            1GB
---
总计                   30.7GB
```

### 理想情况（50-100GB）

```
上述保守估计           30.7GB
node_modules 清理      5GB
大文件删除             10-30GB
Windows.old 删除       15GB（如果存在）
休眠文件禁用          8GB（可选）
Docker 激进清理        10GB
---
总计                   78.7-108.7GB
```

---

## 🎯 推荐清理顺序

### 第一步：自动清理（5分钟）

```bash
# 运行自动清理脚本
.claude\cleanup-disk-space.bat
```

**预期释放**: 20-50GB

### 第二步：系统清理（10分钟）

```bash
# 1. 磁盘清理
cleanmgr

# 2. 存储感知
# 设置 > 系统 > 存储 > 临时文件
```

**预期释放**: 10-20GB

### 第三步：大文件分析（30分钟）

```bash
# 1. 下载并运行 WinDirStat
# 2. 找出大文件和大目录
# 3. 决定哪些可以删除
```

**预期释放**: 10-50GB

---

## ⚠️ 注意事项

### 删除前务必确认

- ❌ 不要删除系统文件
- ❌ 不要删除正在使用的程序
- ✅ 备份重要数据
- ✅ 一次清理一个类别
- ✅ 清理后重启电脑

### Ubuntu WSL 确认清单

在卸载 Ubuntu 前，确认：

- [ ] `HUIZHI-ChargeOS-cloud` 项目不需要？
- [ ] `osworld-mcp` 项目不需要？
- [ ] Ubuntu 中的配置文件不需要？
- [ ] 所有开发都在 Windows 完成？

**如果不确定**：
```bash
# 先导出备份（3-4GB）
wsl --export Ubuntu C:\ubuntu-backup.tar
```

---

## 🚀 立即开始

### 选项 1：全自动清理（推荐）

```bash
# 运行清理脚本
.claude\cleanup-disk-space.bat

# 会提示您确认每个步骤
```

### 选项 2：手动卸载 Ubuntu

```bash
# 如果确定不需要 Ubuntu 中的内容
wsl --unregister Ubuntu
```

### 选项 3：保守清理

```bash
# 只清理缓存，保留 Ubuntu
npm cache clean --force
docker system prune -f
cleanmgr
```

---

## 📞 需要帮助？

**我现在可以帮您**：

1. ✅ **立即卸载 Ubuntu** - 释放 9.7GB
2. ✅ **运行清理命令** - 释放 20-50GB
3. ✅ **分析大文件** - 找出占用大头

**您想先做什么？**

建议：**先运行自动清理脚本** `.claude\cleanup-disk-space.bat`
