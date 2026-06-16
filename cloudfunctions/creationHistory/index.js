// 云函数：保存创作历史
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const { action, data } = event;

    switch (action) {
      case "save":
        return await saveCreationHistory(data);
      case "list":
        return await getCreationHistory(data);
      case "delete":
        return await deleteCreationHistory(data);
      case "update":
        return await updateCreationHistory(data);
      default:
        return {
          success: false,
          error: "不支持的操作",
        };
    }
  } catch (error) {
    console.error("创作历史操作失败:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// 保存创作历史
async function saveCreationHistory(data) {
  const {
    userId,
    projectId,
    agentId,
    agentName,
    character,
    prompt,
    content,
    mediaType,
    mediaUrl,
    duration,
    status,
  } = data;

  const historyData = {
    userId,
    projectId: projectId || "",
    agentId,
    agentName,
    character,
    prompt,
    content,
    mediaType,
    mediaUrl,
    duration,
    status: status || "completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("creation_history").add({
    data: historyData,
  });

  return {
    success: true,
    data: result,
    message: "创作历史保存成功",
  };
}

// 获取创作历史列表
async function getCreationHistory(data) {
  console.log('=== 云函数获取历史记录 ===');
  console.log('查询参数:', data);
  
  const { userId, agentId, projectId, page = 1, limit = 20, status } = data;

  let query = db.collection("creation_history");

  // 构建查询条件
  const whereCondition = {};
  if (userId) whereCondition.userId = userId;
  if (agentId) whereCondition.agentId = agentId;
  if (projectId) whereCondition.projectId = projectId;
  if (status) whereCondition.status = status;

  console.log('查询条件:', whereCondition);

  // 计算跳过的数量
  const skip = (page - 1) * limit;

  // 执行查询
  const result = await query
    .where(whereCondition)
    .orderBy("createdAt", "desc")
    .skip(skip)
    .limit(limit)
    .get();

  console.log('查询结果数量:', result.data.length);
  console.log('查询结果:', result.data);

  return {
    success: true,
    data: result.data,
    total: result.data.length,
    page,
    limit,
    message: "创作历史获取成功",
  };
}

// 删除创作历史
async function deleteCreationHistory(data) {
  const { id, userId } = data;

  // 验证权限：只能删除自己的记录
  const history = await db
    .collection("creation_history")
    .where({
      _id: id,
      userId: userId,
    })
    .get();

  if (history.data.length === 0) {
    return {
      success: false,
      error: "无权限删除此记录",
    };
  }

  const result = await db.collection("creation_history").doc(id).remove();

  return {
    success: true,
    data: result,
    message: "创作历史删除成功",
  };
}

// 更新创作历史
async function updateCreationHistory(data) {
  const { id, userId, updateData } = data;

  // 验证权限：只能更新自己的记录
  const history = await db
    .collection("creation_history")
    .where({
      _id: id,
      userId: userId,
    })
    .get();

  if (history.data.length === 0) {
    return {
      success: false,
      error: "无权限更新此记录",
    };
  }

  const result = await db
    .collection("creation_history")
    .doc(id)
    .update({
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

  return {
    success: true,
    data: result,
    message: "创作历史更新成功",
  };
}
