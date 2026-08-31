// 云函数：保存创作历史
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  // 获取云函数上下文中的 OPENID
  const wxContext = cloud.getWXContext();
  // 优先使用前端传递的 clientOpenId，其次使用云函数上下文
  const OPENID = event.clientOpenId || wxContext.openid || wxContext.OPENID || wxContext.FROM_OPENID || "unknown";

  console.log("云函数上下文:", wxContext);
  console.log("event.clientOpenId:", event.clientOpenId);
  console.log("OPENID:", OPENID);

  try {
    const { action, data } = event;

    switch (action) {
      case "save":
        return await saveCreationHistory(data, OPENID);
      case "list":
        return await getCreationHistory(data, OPENID);
      case "delete":
        return await deleteCreationHistory(data, OPENID);
      case "update":
        return await updateCreationHistory(data, OPENID);
      case "getOpenId":
        // 返回当前用户的 openid
        return {
          success: true,
          openid: wxContext.OPENID || wxContext.openid || OPENID,
        };
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
async function saveCreationHistory(data, OPENID) {
  const {
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
    _openid: OPENID, // 使用云函数自动获取的 OPENID，与数据库权限规则匹配
    userId: OPENID, // 保留userId字段用于查询
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

  console.log("保存创作历史:", { ...historyData, userId: OPENID });

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
async function getCreationHistory(data, OPENID) {
  console.log("=== 云函数获取历史记录 ===");
  console.log("查询参数:", data);
  console.log("当前用户 OPENID:", OPENID);

  const { userId, agentId, projectId, page = 1, limit = 20, status, clientOpenId } = data;

  // 计算跳过的数量
  const skip = (page - 1) * limit;

  let result;
  try {
    // 策略：使用 _.or 同时匹配多个可能的用户标识字段
    // 因为不同时期保存的数据可能用了不同的标识符：
    // - 早期：userId = clientOpenId（可能是 user_xxx 本地生成）
    // - 后期：_openid = wxContext.OPENID（真实微信openid）或 clientOpenId
    // - 最新：同时存了 _openid 和 userId

    // 构建所有可能的用户标识
    const possibleIds = [];
    if (OPENID && OPENID !== "unknown") possibleIds.push(OPENID);
    if (clientOpenId && clientOpenId !== "unknown" && clientOpenId !== OPENID) possibleIds.push(clientOpenId);
    if (userId && userId !== "unknown" && !possibleIds.includes(userId)) possibleIds.push(userId);

    console.log("可能的用户标识列表:", possibleIds);

    // 如果有明确的用户标识，用 or 条件查询
    if (possibleIds.length > 0) {
      const orConditions = possibleIds.map(id => ({ _openid: id }));
      // 也加入 userId 的匹配
      possibleIds.forEach(id => { orConditions.push({ userId: id }); });

      const baseCondition = {};
      if (agentId) baseCondition.agentId = agentId;
      if (projectId) baseCondition.projectId = projectId;
      if (status) baseCondition.status = status;

      // 使用 command.or 组合条件
      if (Object.keys(baseCondition).length > 0) {
        // 有额外筛选条件时，需要将 or 条件和 and 条件组合
        // 微信云数据库不支持直接混合 or/and，这里采用多次查询合并的方式
        console.log("有额外筛选条件，执行复合查询...");
        const allResults = [];

        for (const id of possibleIds) {
          const cond = { _openid: id, ...baseCondition };
          try {
            const r = await db.collection("creation_history")
              .where(cond)
              .orderBy("createdAt", "desc")
              .limit(limit)
              .get();
            allResults.push(...r.data);
          } catch (e) {
            console.warn("查询 _openid 失败:", id, e);
          }

          // 也查 userId
          const cond2 = { userId: id, ...baseCondition };
          try {
            const r2 = await db.collection("creation_history")
              .where(cond2)
              .orderBy("createdAt", "desc")
              .limit(limit)
              .get();
            allResults.push(...r2.data);
          } catch (e) {
            console.warn("查询 userId 失败:", id, e);
          }
        }

        // 去重（按 _id）
        const seen = new Set();
        const uniqueData = allResults.filter(item => {
          if (item._id && !seen.has(item._id)) {
            seen.add(item._id);
            return true;
          }
          return false;
        });

        // 排序和分页
        uniqueData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        result = { data: uniqueData.slice(skip, skip + limit) };
      } else {
        // 无额外筛选条件，直接用 or 查询
        const orCond = _.or(...orConditions);
        result = await db.collection("creation_history")
          .where(orCond)
          .orderBy("createdAt", "desc")
          .skip(skip)
          .limit(limit)
          .get();
      }
    } else {
      // 没有 OPENID 时，回退到全量查询（仅限自己的数据通过安全规则限制）
      console.warn("无法获取用户标识，尝试无条件查询...");
      result = await db.collection("creation_history")
        .orderBy("createdAt", "desc")
        .skip(skip)
        .limit(limit)
        .get();
    }

    console.log("最终查询结果数量:", result.data.length);
    console.log("查询结果样例:", result.data.slice(0, 2));

    return {
      success: true,
      data: result.data,
      total: result.data.length,
      page,
      limit,
      message: "创作历史获取成功",
    };
  } catch (queryError) {
    console.error("查询失败:", queryError);
    return {
      success: true,
      data: [],
      total: 0,
      page,
      limit,
      message: "查询成功但无数据",
    };
  }
}

// 删除创作历史
async function deleteCreationHistory(data, OPENID) {
  const { id } = data;

  // 验证权限：只能删除自己的记录
  const history = await db
    .collection("creation_history")
    .where({
      _id: id,
      _openid: OPENID, // 使用云函数的 OPENID 验证，与数据库权限规则匹配
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
async function updateCreationHistory(data, OPENID) {
  const { id, updateData } = data;

  // 验证权限：只能更新自己的记录
  const history = await db
    .collection("creation_history")
    .where({
      _id: id,
      _openid: OPENID, // 使用云函数的 OPENID 验证，与数据库权限规则匹配
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
