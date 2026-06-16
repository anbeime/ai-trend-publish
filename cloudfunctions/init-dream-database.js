// 梦境页面初始化脚本
// 在云开发控制台 -> 云函数 -> 新建 -> 复制此代码

// 1. 创建数据库集合
// 在云开发控制台 -> 数据库，依次创建以下集合：

// dream_records - 梦境和灵感记录
// {
//   type: String,        // 'idea' | 'dream' | 'idea_image' | 'dream_image'
//   content: String,     // 内容
//   tags: String,        // 标签（逗号分隔）
//   mood: String,        // 氛围
//   imageUrl: String,     // 生成的图片URL
//   createTime: Date,
//   updateTime: Date
// }

// chat_history - 对话历史
// {
//   userMessage: String,  // 用户消息
//   aiReply: String,      // AI回复
//   createTime: Date
// }

// 2. 部署云函数
// 在开发者工具中：
// 右键 cloudfunctions/generateImage -> 上传并部署（云端安装依赖）
// 超时时间设置为：120秒

// 右键 cloudfunctions/chatDream -> 上传并部署（云端安装依赖）
// 超时时间设置为：30秒

// 3. 设置数据库权限
// 在云开发控制台 -> 数据库 -> 权限设置
// 设置为：所有用户可读写（测试环境）

console.log('初始化指南已生成')
