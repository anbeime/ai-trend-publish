// pages/templates/templates.js
Page({
  data: {
    templates: [
      {
        id: "ai-tool",
        name: "AI工具测评",
        icon: "",
        desc: "展示AI工具的核心功能和使用效果，适合科技类账号",
        tags: ["热门", "科技", "教程"],
        hotspotKeywords: [
          "AI",
          "人工智能",
          "工具",
          "科技",
          "技术",
          "智能",
          "CLAUDE",
          "OPENCODE",
          "AIGC",
          "agent",
        ],
      },
      {
        id: "side-hustle",
        name: "副业变现",
        icon: "💰",
        desc: "分享副业赚钱的方法和技巧，适合职场/理财类账号",
        tags: ["变现", "职场", "热门"],
        hotspotKeywords: [
          "副业",
          "赚钱",
          "变现",
          "兼职",
          "收入",
          "理财",
          "最赚钱",
          "爆款",
        ],
      },
      {
        id: "life-tips",
        name: "生活小技巧",
        icon: "💡",
        desc: "分享实用的生活小技巧，简单易懂，适合生活类账号",
        tags: ["生活", "技巧", "实用"],
        hotspotKeywords: ["生活", "技巧", "妙招", "实用", "家居", "日常"],
      },
      {
        id: "product-review",
        name: "产品测评",
        icon: "📦",
        desc: "详细介绍产品特点和优势，适合带货/测评类账号",
        tags: ["测评", "带货", "产品"],
        hotspotKeywords: ["产品", "测评", "评测", "好物", "推荐", "种草"],
      },
      {
        id: "food-making",
        name: "美食制作",
        icon: "🍳",
        desc: "展示美食制作过程，适合美食类账号",
        tags: ["美食", "制作", "教程"],
        hotspotKeywords: ["美食", "做饭", "烹饪", "菜谱", "料理", "食谱"],
      },
      {
        id: "travel-vlog",
        name: "旅行Vlog",
        icon: "✈️",
        desc: "记录旅行中的美好瞬间，适合旅行类账号",
        tags: ["旅行", "Vlog", "风景"],
        hotspotKeywords: ["旅行", "旅游", "风景", "景点", "出游", "度假"],
      },
      {
        id: "fitness",
        name: "健身教学",
        icon: "💪",
        desc: "分享健身动作和技巧，适合健身类账号",
        tags: ["健身", "运动", "教学"],
        hotspotKeywords: ["健身", "运动", "锻炼", "减肥", "塑形", "瑜伽"],
      },
      {
        id: "music-cover",
        name: "音乐翻唱",
        icon: "🎵",
        desc: "演唱流行歌曲，适合音乐类账号",
        tags: ["音乐", "翻唱", "娱乐"],
        hotspotKeywords: ["音乐", "歌曲", "翻唱", "唱歌", "演唱", "流行"],
      },
      {
        id: "new-energy-data",
        name: "新能源数据标注",
        icon: "🔋",
        desc: "标注和分析新能源汽车数据，适合新能源/科技类账号",
        tags: ["新能源", "科技", "数据"],
        hotspotKeywords: [
          "新能源",
          "新能源汽车",
          "充电桩",
          "光伏",
          "储能",
          "AI储能",
          "算力",
        ],
      },
      {
        id: "financial-analysis",
        name: "金融数据分析",
        icon: "📊",
        desc: "金融数据标注和量化投资分析，适合金融/投资类账号",
        tags: ["金融", "投资", "数据"],
        hotspotKeywords: [
          "金融数据标注",
          "量化",
          "赚钱",
          "投资",
          "最赚钱",
          "爆款",
          "港股基金",
        ],
      },
      {
        id: "game-creative",
        name: "游戏创意内容",
        icon: "🎮",
        desc: "游戏创意制作和爆款视频策划，适合游戏/娱乐类账号",
        tags: ["游戏", "创意", "娱乐"],
        hotspotKeywords: [
          "游戏创意",
          "最赚钱",
          "爆款",
          "youtube爆款视频",
          "赚钱",
        ],
      },
      {
        id: "ai-application",
        name: "鸿蒙智能应用",
        icon: "🚀",
        desc: "开发鸿蒙系统智能应用，适合开发/科技类账号",
        tags: ["鸿蒙", "智能", "应用"],
        hotspotKeywords: ["鸿蒙应用", "具身智能", "AI", "智能", "鸿蒙", "应用"],
      },
      {
        id: "intelligent-competition",
        name: "智能大赛创意",
        icon: "🏆",
        desc: "智能比赛和大赛内容创作，适合教育/科技类账号",
        tags: ["比赛", "智能", "教育"],
        hotspotKeywords: ["智能比赛", "具身智能", "比赛", "大赛", "AI", "智能"],
      },
      {
        id: "code-analysis",
        name: "开源代码分析",
        icon: "💻",
        desc: "分析和解读开源项目代码，适合开发/技术类账号",
        tags: ["开源", "代码", "技术"],
        hotspotKeywords: [
          "OPENCODE",
          "CLAUDE",
          "开源榜",
          "热点榜",
          "微信指数上升",
          "技术",
          "代码",
        ],
      },
      {
        id: "chip-analysis",
        name: "芯片半导体分析",
        icon: "⚡",
        desc: "芯片和半导体行业分析，适合科技/硬件类账号",
        tags: ["芯片", "半导体", "科技"],
        hotspotKeywords: ["芯片", "半导体", "算力", "AI", "科技", "硬件"],
      },
      {
        id: "ai-content",
        name: "AIGC内容创作",
        icon: "🎨",
        desc: "AI生成内容创作和工具应用，适合AI/创作类账号",
        tags: ["AI", "AIGC", "创作"],
        hotspotKeywords: [
          "AI",
          "AIGC",
          "agent",
          "CLAUDE",
          "OPENCODE",
          "人工智能",
          "创作",
        ],
      },
    ],
    matchedHotspots: [], // 匹配到的热点
    selectedTemplate: null, // 当前选中的模板
    showHotspotDialog: false, // 是否显示热点选择对话框
    // === 热点缓存 ===
    lastHotspotFetch: null, // 最后获取热点的时间
    hotspotCacheValid: false, // 缓存是否有效（30分钟）
  },

  onLoad() {
    console.log('模板页面加载');
  },

  onShow() {
    console.log('模板页面显示');
    // 检查热点缓存是否需要刷新
    this.checkHotspotCache();
  },

  // 使用模板
  async useTemplate(e) {
    const template = e.currentTarget.dataset.template;

    // 先获取匹配的热点
    wx.showLoading({ title: "匹配热点中..." });

    try {
      let allHotspots = [];

      // === 优先从本地存储加载缓存（首页模式）===
      const cached = wx.getStorageSync('hotspot_cache');
      if (cached && cached.hotspots && cached.hotspots.length > 0) {
        console.log(`【模板库】从本地存储加载热点: ${cached.hotspots.length} 条`);
        allHotspots = cached.hotspots;

        // 更新缓存状态
        if (cached.fetchTime) {
          this.setData({
            lastHotspotFetch: new Date(cached.fetchTime),
            hotspotCacheValid: true
          });
        }
      }

      // 如果本地没有缓存，调用云函数
      if (allHotspots.length === 0) {
        console.log('【模板库】本地无缓存，调用云函数获取热点');
        const res = await wx.cloud.callFunction({
          name: 'hotspot-miyucaicai',
          data: {},
          timeout: 15000, // 增加超时时间到15秒
        });

        if (res.result && res.result.success) {
          allHotspots = res.result.data || [];
          console.log(`【模板库】从云函数获取热点成功: ${allHotspots.length} 条`);

          // 保存到缓存
          this.saveHotspotsToStorage({
            hotspots: allHotspots,
            fetchTime: new Date().toISOString(),
          });

          this.setData({
            lastHotspotFetch: new Date(),
            hotspotCacheValid: true,
          });
        } else {
          throw new Error(res.result?.error || '获取热点失败');
        }
      } else {
        console.log('【模板库】成功使用缓存数据，跳过云函数调用');
      }

      // 根据模板关键词匹配热点
      const keywords = template.hotspotKeywords || [];
      const matchedHotspots = allHotspots.filter((hotspot) => {
        const hotspotText =
          `${hotspot.title || hotspot.name || ""} ${hotspot.description || ""} ${hotspot.source || ""}`.toLowerCase();
        return keywords.some((keyword) =>
          hotspotText.includes(keyword.toLowerCase()),
        );
      });

      wx.hideLoading();

      if (matchedHotspots.length > 0) {
        // 找到匹配的热点，显示选择对话框
        const formattedHotspots = matchedHotspots.map((hotspot) => ({
          name: hotspot.name || hotspot.title,
          description: hotspot.description || hotspot.content || "",
          heat: hotspot.heat || hotspot.hotness || 80,
          source: hotspot.source,
          url: hotspot.url || "",
        }));

        this.setData({
          selectedTemplate: template,
          matchedHotspots: formattedHotspots.slice(0, 10), // 最多显示10个
          showHotspotDialog: true,
        });
      } else {
        // 没有匹配的热点，使用备用热点数据
        console.warn("没有匹配的热点，使用备用数据");
        const mockHotspots = this.getMockHotspots();
        const mockMatched = mockHotspots.filter((hotspot) => {
          const hotspotText =
            `${hotspot.name} ${hotspot.description || ""} ${hotspot.source}`.toLowerCase();
          return keywords.some((keyword) =>
            hotspotText.includes(keyword.toLowerCase()),
          );
        });

        if (mockMatched.length > 0) {
          this.setData({
            selectedTemplate: template,
            matchedHotspots: mockMatched.slice(0, 10),
            showHotspotDialog: true,
          });
        } else {
          // 备用数据也没有匹配的，直接使用模板
          this.navigateWithTemplate(template, null);
        }
      }
    } catch (error) {
      wx.hideLoading();
      console.error("获取热点失败:", error);

      // 云函数调用失败，使用备用热点数据
      console.warn("调用失败，使用备用热点数据");
      const mockHotspots = this.getMockHotspots();
      const keywords = template.hotspotKeywords || [];
      const matchedHotspots = mockHotspots.filter((hotspot) => {
        const hotspotText =
          `${hotspot.name} ${hotspot.description || ""} ${hotspot.source}`.toLowerCase();
        return keywords.some((keyword) =>
          hotspotText.includes(keyword.toLowerCase()),
        );
      });

      if (matchedHotspots.length > 0) {
        this.setData({
          selectedTemplate: template,
          matchedHotspots: matchedHotspots.slice(0, 10),
          showHotspotDialog: true,
        });
        wx.showToast({
          title: "已加载备用热点数据",
          icon: "none",
          duration: 5000,
        });
      } else {
        // 备用数据也没有匹配的，直接使用模板
        this.navigateWithTemplate(template, null);
      }
    }
  },

  // 选择热点
  selectHotspot(e) {
    const index = e.currentTarget.dataset.index;
    const hotspot = this.data.matchedHotspots[index];
    const template = this.data.selectedTemplate;

    this.setData({ showHotspotDialog: false });
    this.navigateWithTemplate(template, hotspot);
  },

  // 跳过热点选择
  skipHotspot() {
    const template = this.data.selectedTemplate;
    this.setData({ showHotspotDialog: false });
    this.navigateWithTemplate(template, null);
  },

  // 跳转到agents页面
  navigateWithTemplate(template, hotspot) {
    let url = `/pages/agents/agents?template=${template.id}`;

    if (hotspot) {
      // 将热点信息编码后传递（包含完整字段，确保agents页面能正确解析）
      const hotspotInfo = encodeURIComponent(
        JSON.stringify({
          id: hotspot.id || Date.now(),
          title: hotspot.name,
          name: hotspot.name,
          description: hotspot.description || "",
          heat: hotspot.heat || hotspot.hotness || 80,
          hotness: hotspot.heat || hotspot.hotness || 80,
          source: hotspot.source || "未知",
          url: hotspot.url || "",
          tags: hotspot.tags || []
        }),
      );
      url += `&hotspot=${hotspotInfo}`;
      console.log(`【模板库】跳转到agents，携带热点: ${hotspot.name}`);
    } else {
      console.log(`【模板库】跳转到agents，无热点信息`);
    }

    wx.navigateTo({ url });
  },

  // 空操作，防止事件冒泡
  noop() {},

  // === 热点缓存相关方法 ===

  // 检查热点缓存是否有效（30分钟）
  checkHotspotCache() {
    const lastFetch = this.data.lastHotspotFetch;
    if (!lastFetch) {
      // 从本地存储加载缓存
      this.loadHotspotsFromStorage();
      return;
    }

    // 计算时间差（毫秒）
    const now = Date.now();
    const elapsed = now - lastFetch.getTime();
    const thirtyMinutes = 30 * 60 * 1000;

    if (elapsed > thirtyMinutes) {
      console.log('热点缓存过期，静默刷新中');
      // 静默刷新，不打扰用户
      this.loadHotspots();
    } else {
      console.log(
        `热点缓存有效，剩余 ${(thirtyMinutes - elapsed) / 60000} 分钟`
      );
    }
  },

  // 加载热点数据（带缓存）
  async loadHotspots() {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      console.log('云开发未初始化，跳过热点加载');
      this.loadHotspotsFromStorage();
      return;
    }

    try {
      console.log('开始获取热点数据');
      const res = await wx.cloud.callFunction({
        name: 'hotspot-miyucaicai',
        data: {},
        timeout: 15000, // 增加超时时间到15秒
      });

      if (res.result && res.result.success) {
        const allHotspots = res.result.data || [];
        console.log(`获取到 ${allHotspots.length} 条热点`);

        // 保存到本地存储
        this.saveHotspotsToStorage({
          hotspots: allHotspots,
          fetchTime: new Date().toISOString(),
        });

        this.setData({
          lastHotspotFetch: new Date(),
          hotspotCacheValid: true,
        });

        console.log('热点数据已缓存');
      } else {
        throw new Error(res.result?.error || '获取热点失败');
      }
    } catch (error) {
      console.error('加载热点失败:', error);
      // 加载失败时，尝试从本地存储加载
      this.loadHotspotsFromStorage();
    }
  },

  // 保存热点到本地存储
  saveHotspotsToStorage(data) {
    try {
      wx.setStorageSync('hotspot_cache', data);
      console.log('热点数据已保存到本地存储');
    } catch (error) {
      console.error('保存热点数据失败:', error);
    }
  },

  // 从本地存储加载热点
  loadHotspotsFromStorage() {
    try {
      const cached = wx.getStorageSync('hotspot_cache');
      if (cached && cached.hotspots && cached.hotspots.length > 0) {
        console.log('从本地存储加载热点:', cached.hotspots.length, '条');
        this.setData({
          lastHotspotFetch: new Date(cached.fetchTime),
          hotspotCacheValid: true,
        });
      }
    } catch (error) {
      console.error('从本地存储加载热点失败:', error);
    }
  },

  // 获取备用热点数据（参考热点页面，确保数据结构一致）
  getMockHotspots() {
    return [
      {
        name: "库迪宣布取消全场9.9元",
        description:
          "瑞幸、蜜雪冰城、奈雪的茶等纷纷收缩低价策略，中国咖啡价格战走到拐点了吗？",
        heat: 95,
        source: "知乎",
        url: "https://www.zhihu.com/question/xxx",
      },
      {
        name: "ChatGPT-5即将发布",
        description: "OpenAI最新模型即将来袭，AI领域迎来新一轮竞争",
        heat: 92,
        source: "微博",
        url: "https://weibo.com/xxx",
      },
      {
        name: "小米汽车SU7销量突破",
        description: "上市首月销量突破万台，新能源汽车市场竞争白热化",
        heat: 89,
        source: "新闻",
        url: "https://news.com/xxx",
      },
      {
        name: "大学生就业率创新低",
        description: "2024届毕业生就业形势严峻，灵活就业成为新趋势",
        heat: 87,
        source: "知乎",
        url: "https://www.zhihu.com/question/yyy",
      },
      {
        name: "短剧市场爆发式增长",
        description: "微短剧成为新风口，创作者纷纷入局",
        heat: 94,
        source: "抖音",
        url: "https://douyin.com/xxx",
      },
      {
        name: "AI视频工具快速迭代",
        description: "Runway、Sora等AI视频工具竞相推出，视频创作迎来变革",
        heat: 91,
        source: "科技媒体",
        url: "https://tech.com/xxx",
      },
      {
        name: "户外露营持续火热",
        description: "都市青年纷纷拥抱户外生活，露营装备热销",
        heat: 85,
        source: "小红书",
        url: "https://xiaohongshu.com/xxx",
      },
      {
        name: "美食探店Vlog走红",
        description: "各地特色美食成为创作热点，探店类视频流量巨大",
        heat: 88,
        source: "抖音",
        url: "https://douyin.com/yyy",
      },
    ];
  },
});
