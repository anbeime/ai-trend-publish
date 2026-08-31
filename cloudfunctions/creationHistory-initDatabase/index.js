// 云函数：初始化创作历史数据库
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    // 创建索引以提高查询性能
    await db.collection("creation_history").createIndex({
      createdAt: -1,
    });

    // 设置集合权限（在云控制台中手动设置更安全）
    // 这里只是示例代码，实际权限在云控制台设置

    return {
      success: true,
      message: "数据库初始化成功",
    };
  } catch (error) {
    console.error("数据库初始化失败:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
