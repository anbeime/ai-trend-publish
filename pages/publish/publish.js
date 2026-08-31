// 微信公众号发布页面
// 功能：发布内容到公众号草稿箱

Page({
  data: {
    // 微信公众号配置
    wechatConfig: {
      appId: "",
      appSecret: "",
      title: "",
      author: "",
      digest: "",
      contentSourceUrl: "",
      thumbMediaId: "",
    },

    // 内容数据
    generatedContent: {
      content: "",
      coverSuggestion: "",
    },

    // 发布状态
    publishing: false,

    // 配置指引显示
    showWechatGuide: false,
  },

  onLoad(options) {
    console.log("发布页面加载", options);

    // 从参数中获取内容数据
    let generatedContent = {
      content: "",
      coverSuggestion: "",
      title: "",
      tags: [],
      coverImage: "",
      platform: "",
      hotspot: "",
    };

    if (options.content) {
      try {
        generatedContent = JSON.parse(decodeURIComponent(options.content));
        console.log("获取到内容数据:", generatedContent);
      } catch (e) {
        console.error("解析内容数据失败:", e);
      }
    }

    // 如果有标题参数，优先使用
    const title = options.title || generatedContent.title || "";

    // 从内容中提取摘要（前100字）
    const digest = generatedContent.content 
      ? generatedContent.content.replace(/<[^>]+>/g, '').substring(0, 100) + '...'
      : "";

    this.setData({
      generatedContent: generatedContent,
      // 自动填充微信公众号配置
      wechatConfig: {
        ...this.data.wechatConfig,
        title: title,
        author: "AI创作助手",
        digest: digest,
        contentSourceUrl: generatedContent.hotspot ? `热点来源: ${generatedContent.hotspot}` : "",
      },
    });

    console.log("✅ 发布页面初始化完成:", {
      title: this.data.wechatConfig.title,
      hasContent: !!generatedContent.content,
      hasCover: !!generatedContent.coverImage,
      platform: generatedContent.platform,
    });
  },

  // 复制内容
  copyContent() {
    const { generatedContent } = this.data;
    if (generatedContent.content) {
      wx.setClipboardData({
        data: generatedContent.content,
        success: () => {
          wx.showToast({
            title: "内容已复制",
            icon: "success",
          });
        },
      });
    }
  },

  // 微信公众号配置输入
  onWechatAppIdInput(e) {
    this.setData({
      wechatConfig: {
        ...this.data.wechatConfig,
        appId: e.detail.value,
      },
    });
  },

  onWechatAppSecretInput(e) {
    this.setData({
      wechatConfig: {
        ...this.data.wechatConfig,
        appSecret: e.detail.value,
      },
    });
  },

  onWechatTitleInput(e) {
    this.setData({
      wechatConfig: {
        ...this.data.wechatConfig,
        title: e.detail.value,
      },
    });
  },

  onWechatAuthorInput(e) {
    this.setData({
      wechatConfig: {
        ...this.data.wechatConfig,
        author: e.detail.value,
      },
    });
  },

  onWechatDigestInput(e) {
    this.setData({
      wechatConfig: {
        ...this.data.wechatConfig,
        digest: e.detail.value,
      },
    });
  },

  onWechatContentSourceUrlInput(e) {
    this.setData({
      wechatConfig: {
        ...this.data.wechatConfig,
        contentSourceUrl: e.detail.value,
      },
    });
  },

  onWechatThumbMediaIdInput(e) {
    this.setData({
      wechatConfig: {
        ...this.data.wechatConfig,
        thumbMediaId: e.detail.value,
      },
    });
  },

  // 发布到微信公众号草稿箱
  async publishToWechat() {
    const { wechatConfig, generatedContent } = this.data;

    // 验证配置
    if (!wechatConfig.appId || !wechatConfig.appSecret) {
      wx.showToast({
        title: "请先配置AppID和Secret",
        icon: "none",
      });
      return;
    }

    if (!wechatConfig.title) {
      wx.showToast({
        title: "请输入文章标题",
        icon: "none",
      });
      return;
    }

    if (!generatedContent.content) {
      wx.showToast({
        title: "没有内容可发布",
        icon: "none",
      });
      return;
    }

    this.setData({ publishing: true });
    wx.showLoading({ title: "正在发布..." });

    try {
      console.log("开始发布到微信公众号草稿箱...");

      // 使用云函数代理发布（解决手机端HTTP域名白名单限制）
      // 不再直接请求 http://39.108.254.228:8003，而是通过云函数转发
      const response = await wx.cloud.callFunction({
        name: 'social-media-proxy',
        data: {
          action: 'publish-wechat',
          data: {
            appId: wechatConfig.appId,
            appSecret: wechatConfig.appSecret,
            articles: [
              {
                title: wechatConfig.title,
                author: wechatConfig.author || "",
                digest: wechatConfig.digest || "",
                content: generatedContent.content,
                contentSourceUrl: wechatConfig.contentSourceUrl || "",
                thumbMediaId: wechatConfig.thumbMediaId || "",
                showCoverPic: !!wechatConfig.thumbMediaId,
                needOpenComment: 1,
                onlyFansCanComment: 0,
              },
            ],
          }
        }
      });

      console.log("云函数代理发布结果:", response.result);

      const result = response.result;
      if (result.success && result.data && result.data.success) {
        wx.hideLoading();
        wx.showToast({
          title: "发布成功",
          icon: "success",
          duration: 2000,
        });

        // 1秒后跳转到公众号管理后台
        setTimeout(() => {
          wx.showModal({
            title: "发布成功",
            content: "文章已发布到公众号草稿箱\n\n请在公众号管理后台查看和发布",
            showCancel: true,
            cancelText: "留在当前页",
            confirmText: "去公众号后台",
            success: (res) => {
              if (res.confirm) {
                wx.navigateToMiniProgram({
                  appId: "wx570bc396a51b8ff8", // 微信公众号助手小程序
                  success: () => {
                    console.log("跳转成功");
                  },
                  fail: (err) => {
                    console.log("跳转失败:", err);
                    wx.showToast({
                      title: "跳转失败，请手动打开",
                      icon: "none",
                    });
                  },
                });
              }
            },
          });
        }, 1000);
      } else {
        const errorMsg = result.data?.error || result.error || "发布失败";
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("发布失败:", error);
      wx.hideLoading();
      wx.showModal({
        title: "发布失败",
        content: error.message || "请检查网络连接或配置是否正确",
        showCancel: false,
      });
    } finally {
      this.setData({ publishing: false });
    }
  },

  // 发送到邮箱（开发中）
  sendToEmail() {
    wx.showModal({
      title: "功能开发中",
      content: "邮件发送功能正在开发中，敬请期待！",
      showCancel: false,
      confirmText: "我知道了",
      confirmColor: "#667eea",
    });
  },

  // 复制服务器IP
  copyServerIP() {
    wx.setClipboardData({
      data: "39.108.254.228",
      success: () => {
        wx.showToast({
          title: "IP已复制",
          icon: "success",
        });
      },
    });
  },

  // 打开微信公众号配置教程
  openTutorial() {
    // 复制教程链接
    wx.setClipboardData({
      data: "https://github.com/your-repo/miniprogram-agent/blob/main/pages/publish/WECHAT_PUBLISH_GUIDE.md",
      success: () => {
        wx.showModal({
          title: "教程链接已复制",
          content:
            "教程链接已复制到剪贴板\n\n请在浏览器中粘贴打开，或查看项目文档：pages/publish/WECHAT_PUBLISH_GUIDE.md",
          showCancel: false,
          confirmText: "我知道了",
        });
      },
    });
  },

  // 打开IP白名单配置教程
  openIPTutorial() {
    // 复制教程链接
    wx.setClipboardData({
      data: "https://github.com/your-repo/miniprogram-agent/blob/main/PUBLIC_ACCOUNT_IP_WHITELIST_GUIDE.md",
      success: () => {
        wx.showModal({
          title: "教程链接已复制",
          content:
            "教程链接已复制到剪贴板\n\n请在浏览器中粘贴打开，或查看项目文档：PUBLIC_ACCOUNT_IP_WHITELIST_GUIDE.md",
          showCancel: false,
          confirmText: "我知道了",
        });
      },
    });
  },

  // 显示微信公众号配置指引
  showWechatGuide() {
    this.setData({
      showWechatGuide: true,
    });
  },

  // 关闭微信公众号指引
  closeWechatGuide() {
    this.setData({
      showWechatGuide: false,
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },
});
