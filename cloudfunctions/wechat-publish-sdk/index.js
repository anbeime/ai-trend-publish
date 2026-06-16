// 云函数：wechat-publish-sdk
// 使用小程序云调用，无需配置IP白名单

exports.main = async (event, context) => {
  console.log("\n========== 收到SDK调用 ==========");
  console.log("事件数据:", JSON.stringify(event, null, 2));

  try {
    // 从事件中提取参数
    const { title, content, data: sseData } = event;

    console.log("标题:", title);
    console.log("内容长度:", content?.length || sseData?.length || 0);

    // 如果提供了 SSE 数据，解析它
    let finalTitle = title;
    let finalContent = content;

    if (sseData) {
      console.log("检测到 SSE 数据，尝试解析...");

      try {
        // 尝试解析 SSE 格式
        const match = sseData.match(/event:\s*Message\s*\ndata:\s*(\{[^\n]+\})/);

        if (match) {
          const messageData = JSON.parse(match[1]);
          const contentStr = messageData.content || "{}";
          const contentData = JSON.parse(contentStr);

          finalTitle = contentData.title || finalTitle;
          finalContent = contentData.output || finalContent;

          console.log("SSE 解析成功");
        }
      } catch (error) {
        console.log("SSE 解析失败，使用原始数据");
      }
    }

    if (!finalTitle || !finalContent) {
      return {
        success: false,
        error: "缺少必要的参数：title 和 content",
      };
    }

    console.log("\n准备发布到微信...");
    console.log("最终标题:", finalTitle);
    console.log("最终内容长度:", finalContent?.length || 0);

    // 使用小程序云调用方式（无需 access_token）
    const cloud = require('wx-server-sdk');
    cloud.init({
      env: cloud.DYNAMIC_CURRENT_ENV
    });

    const articles = [
      {
        title: finalTitle,
        content: finalContent,
        digest: finalTitle?.substring(0, 50) || "",
        thumb_media_id: "",
        show_cover_pic: 0,
        need_open_comment: 0,
        only_fans_can_comment: 0,
      },
    ];

    console.log("调用微信草稿API...");

    // 使用云调用（官方推荐方式）
    const result = await cloud.openapi.draft.add({ articles });

    console.log("微信返回:", result);

    if (result.errcode === 0) {
      console.log(" 发布成功:", result.media_id);
      return {
        success: true,
        media_id: result.media_id,
        message: "Draft published successfully",
      };
    } else {
      console.error(" 发布失败:", result);
      return {
        success: false,
        error: result.errmsg || "草稿创建失败",
        errcode: result.errcode,
      };
    }
  } catch (error) {
    console.error("云函数执行异常:", error);

    // 检查是否是权限问题
    if (error.errCode === -1 || error.errMsg?.includes('permission')) {
      return {
        success: false,
        error: "权限不足：请在云开发控制台开启微信公众号接口权限",
        hint: "前往 https://console.cloud.tencent.com/tcb/api/config 开启权限",
      };
    }

    return {
      success: false,
      error: "云函数执行失败: " + error.message,
    };
  }
};
