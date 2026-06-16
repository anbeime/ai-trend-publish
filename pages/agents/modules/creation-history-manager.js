// pages/agents/modules/creation-history-manager.js
// 创作历史管理器 - 统一管理所有创作类型的记录保存

class CreationHistoryManager {
  constructor(page) {
    this.page = page;
  }

  // 保存创作历史到云端
  async saveCreationHistory(creationData) {
    try {
      console.log("开始保存创作历史到云端...", creationData);

      // 检查云开发是否初始化
      if (!wx.cloud) {
        console.error("云开发未初始化");
        return { success: false, error: "云开发未初始化" };
      }

      const result = await wx.cloud.callFunction({
        name: "creationHistory",
        data: {
          action: "save",
          data: creationData,
        },
      });

      console.log("创作历史保存结果:", result);

      if (result.result && result.result.success) {
        console.log("创作历史保存成功:", result.result.message);
        wx.showToast({ title: "创作历史保存成功", icon: "success" });
        return { success: true, data: result.result.data };
      } else {
        console.error("创作历史保存失败:", result.result);
        wx.showToast({ title: "保存失败", icon: "none" });
        return {
          success: false,
          error: result.result?.error || "保存失败",
        };
      }
    } catch (error) {
      console.error("保存创作历史异常:", error);
      wx.showToast({ title: "网络错误", icon: "none" });
      return {
        success: false,
        error: error.message || "网络错误",
      };
    }
  }

  // 获取创作历史列表
  async getCreationHistoryList(params = {}) {
    try {
      console.log("开始获取创作历史列表...", params);

      const result = await wx.cloud.callFunction({
        name: "creationHistory",
        data: {
          action: "list",
          data: params,
        },
      });

      console.log("创作历史列表获取结果:", result);

      if (result.result && result.result.success) {
        return {
          success: true,
          data: result.result.data,
          total: result.result.total,
          page: result.result.page,
          limit: result.result.limit,
        };
      } else {
        return {
          success: false,
          error: result.result?.error || "获取失败",
        };
      }
    } catch (error) {
      console.error("获取创作历史列表异常:", error);
      return {
        success: false,
        error: error.message || "网络错误",
      };
    }
  }

  // 删除创作历史
  async deleteCreationHistory(id) {
    try {
      const userId = wx.getStorageSync("openid") || "unknown";

      const result = await wx.cloud.callFunction({
        name: "creationHistory",
        data: {
          action: "delete",
          data: { id, userId },
        },
      });

      if (result.result && result.result.success) {
        wx.showToast({ title: "删除成功", icon: "success" });
        return { success: true };
      } else {
        wx.showToast({ title: "删除失败", icon: "none" });
        return { success: false, error: result.result?.error };
      }
    } catch (error) {
      console.error("删除创作历史异常:", error);
      wx.showToast({ title: "删除失败", icon: "none" });
      return { success: false, error: error.message };
    }
  }

  // 保存视频创作历史
  async saveVideoCreation({
    projectId,
    agentId,
    agentName,
    prompt,
    videoUrl,
    duration,
    status = "completed",
  }) {
    const creationData = {
      userId: wx.getStorageSync("openid") || "unknown",
      projectId: projectId || "",
      agentId,
      agentName,
      character: "",
      prompt,
      content: `使用${agentName}生成视频：${prompt}`,
      mediaType: "video",
      mediaUrl: videoUrl,
      duration,
      status,
    };

    return await this.saveCreationHistory(creationData);
  }

  // 保存图片创作历史
  async saveImageCreation({
    projectId,
    agentId,
    agentName,
    prompt,
    imageUrl,
    status = "completed",
  }) {
    const creationData = {
      userId: wx.getStorageSync("openid") || "unknown",
      projectId: projectId || "",
      agentId,
      agentName,
      character: "",
      prompt,
      content: `使用${agentName}生成图片：${prompt}`,
      mediaType: "image",
      mediaUrl: imageUrl,
      duration: 0,
      status,
    };

    return await this.saveCreationHistory(creationData);
  }

  // 保存角色创作历史
  async saveCharacterCreation({
    projectId,
    agentId,
    agentName,
    character,
    prompt,
    characterUrl,
    status = "completed",
  }) {
    const creationData = {
      userId: wx.getStorageSync("openid") || "unknown",
      projectId: projectId || "",
      agentId,
      agentName,
      character,
      prompt,
      content: `使用${agentName}生成角色"${character}"：${prompt}`,
      mediaType: "image",
      mediaUrl: characterUrl,
      duration: 0,
      status,
    };

    return await this.saveCreationHistory(creationData);
  }
}

module.exports = CreationHistoryManager;
