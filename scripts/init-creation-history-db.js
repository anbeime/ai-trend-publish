/**
 * 创作历史数据库初始化脚本
 * 用于手动初始化 creation_history 数据库集合
 * 
 * 使用方法：
 * 1. 在微信开发者工具中打开云开发控制台
 * 2. 进入数据库 -> 创建集合 -> 输入 "creation_history"
 * 3. 设置权限规则：
 *    {
 *      "read": "doc._openid == auth.openid",
 *      "write": "doc._openid == auth.openid"
 *    }
 * 
 * 或者通过云函数初始化：
 * 1. 部署 init-collections 云函数
 * 2. 在云开发控制台调用该云函数
 */

console.log("=== 创作历史数据库初始化指南 ===\n");

console.log("方法一：手动创建（推荐）");
console.log("1. 打开微信开发者工具");
console.log("2. 点击左侧「云开发」按钮");
console.log("3. 进入「数据库」标签页");
console.log("4. 点击「+」创建集合");
console.log("5. 输入集合名称：creation_history");
console.log("6. 点击「确定」创建集合");
console.log("7. 点击集合名称进入集合管理");
console.log("8. 点击「权限设置」");
console.log("9. 选择「自定义权限」");
console.log("10. 输入以下权限规则：");
console.log(`
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
`);
console.log("11. 点击「确定」保存权限设置\n");

console.log("方法二：通过云函数初始化");
console.log("1. 确保 cloudfunctions/init-collections 云函数已部署");
console.log("2. 在云开发控制台 -> 云函数中");
console.log("3. 找到 init-collections 云函数");
console.log("4. 点击「测试」按钮");
console.log("5. 点击「运行测试」");
console.log("6. 查看返回结果，确认 creation_history 集合创建成功\n");

console.log("方法三：通过小程序页面初始化");
console.log("1. 在小程序页面中调用以下代码：");
console.log(`
wx.cloud.callFunction({
  name: 'init-collections',
  success: res => {
    console.log('数据库初始化成功:', res);
    wx.showToast({ title: '数据库初始化成功' });
  },
  fail: err => {
    console.error('数据库初始化失败:', err);
    wx.showToast({ title: '初始化失败', icon: 'none' });
  }
});
`);

console.log("\n=== 验证数据库是否正常工作 ===");
console.log("1. 在创作页面完成一次创作");
console.log("2. 查看控制台日志，确认保存成功");
console.log("3. 进入创作历史页面");
console.log("4. 确认历史记录正常显示");
console.log("5. 刷新页面，确认数据持久化");

console.log("\n=== 常见问题排查 ===");
console.log("1. 问题：历史记录不显示");
console.log("   解决：检查数据库集合是否存在，权限是否正确");
console.log("2. 问题：保存失败");
console.log("   解决：检查云函数是否部署，网络是否正常");
console.log("3. 问题：只能看到本地记录");
console.log("   解决：检查云开发环境配置，确认云函数调用成功");

console.log("\n=== 数据库字段说明 ===");
console.log("_openid: 用户唯一标识（自动添加）");
console.log("userId: 用户ID（兼容字段）");
console.log("projectId: 项目ID");
console.log("agentId: 智能体ID");
console.log("agentName: 智能体名称");
console.log("character: 角色名称");
console.log("prompt: 提示词");
console.log("content: 创作内容");
console.log("mediaType: 媒体类型（image/video/text）");
console.log("mediaUrl: 媒体URL");
console.log("duration: 时长（视频用）");
console.log("status: 状态（completed/draft/error）");
console.log("createdAt: 创建时间");
console.log("updatedAt: 更新时间");

console.log("\n=== 索引配置建议 ===");
console.log("建议为以下字段创建索引以提高查询性能：");
console.log("1. _openid + createdAt（用户历史查询）");
console.log("2. projectId（项目历史查询）");
console.log("3. agentId（智能体历史查询）");
console.log("4. status（按状态筛选）");

console.log("\n=== 数据迁移说明 ===");
console.log("如果已有本地历史记录，可以迁移到云端：");
console.log(`
// 迁移本地历史到云端
async function migrateLocalHistory() {
  const localHistory = wx.getStorageSync('creation_history') || [];
  const creationHistoryManager = new CreationHistoryManager(this);
  
  for (const item of localHistory) {
    if (!item.fromCloud) { // 只迁移非云端记录
      await creationHistoryManager.saveCreationHistory({
        projectId: item.projectId || '',
        agentId: item.agentId || 'local',
        agentName: item.type || '本地创作',
        character: '',
        prompt: item.hotspot?.title || '本地创作',
        content: item.content,
        mediaType: 'text',
        mediaUrl: '',
        duration: 0,
        status: item.status || 'completed'
      });
    }
  }
}
`);
