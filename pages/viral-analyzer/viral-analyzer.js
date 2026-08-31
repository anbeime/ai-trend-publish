// pages/viral-analyzer/viral-analyzer.js
// 爆款视频分析页面 - 独立页面，不修改 agents 页面

const { ViralVideoAnalyzer } = require('../agents/modules/viral-video-analyzer.js');

Page({
  data: {
    // 输入
    videoUrl: '',
    
    // 分析状态
    analyzing: false,
    analysisComplete: false,
    
    // 分析结果
    platform: '',
    analysis: null,
    replicationPlan: null,
    suggestions: null,
    
    // 错误信息
    errorMsg: '',
    
    // 支持的链接示例
    linkExamples: [
      { platform: '抖音', example: 'https://v.douyin.com/xxxxx' },
      { platform: '快手', example: 'https://v.kuaishou.com/xxxxx' },
      { platform: 'B站', example: 'https://b23.tv/xxxxx' },
      { platform: '小红书', example: 'https://xhs.link/xxxxx' },
      { platform: '视频号', example: 'https://channels.weixin.qq.com/xxxxx' }
    ],
    
    // 当前选中的标签页
    activeTab: 'analysis', // analysis, script, storyboard, differentiation
    
    // 复制成功提示
    copySuccess: false
  },

  onLoad() {
    this.analyzer = new ViralVideoAnalyzer(this);
  },

  // 输入视频链接
  onUrlInput(e) {
    this.setData({
      videoUrl: e.detail.value,
      errorMsg: ''
    });
  },

  // 粘贴链接
  async pasteUrl() {
    try {
      const res = await wx.getClipboardData();
      this.setData({
        videoUrl: res.data,
        errorMsg: ''
      });
    } catch (err) {
      wx.showToast({
        title: '粘贴失败',
        icon: 'none'
      });
    }
  },

  // 清空输入
  clearInput() {
    this.setData({
      videoUrl: '',
      errorMsg: ''
    });
  },

  // 开始分析
  async startAnalysis() {
    const { videoUrl } = this.data;
    
    if (!videoUrl.trim()) {
      this.setData({ errorMsg: '请输入视频链接' });
      return;
    }

    // 验证链接格式
    const platform = this.detectPlatform(videoUrl);
    if (!platform) {
      this.setData({ errorMsg: '暂不支持该平台链接，目前支持：抖音、快手、B站、小红书、视频号' });
      return;
    }

    this.setData({
      analyzing: true,
      analysisComplete: false,
      errorMsg: ''
    });

    // 模拟分析过程（实际项目中这里会调用云函数解析视频）
    setTimeout(() => {
      const result = this.generateMockResult(platform, videoUrl);
      
      this.setData({
        platform: result.platform,
        analysis: result.analysis,
        replicationPlan: result.replicationPlan,
        suggestions: result.suggestions,
        analysisComplete: true,
        activeTab: 'analysis',
        analyzing: false
      });
      
      wx.showToast({
        title: '分析完成（演示模式）',
        icon: 'success'
      });
    }, 1500);
  },

  // 检测平台
  detectPlatform(url) {
    if (/douyin\.com|iesdouyin\.com/.test(url)) return '抖音';
    if (/kuaishou\.com/.test(url)) return '快手';
    if (/bilibili\.com|b23\.tv/.test(url)) return 'B站';
    if (/xiaohongshu\.com|xhs\.link/.test(url)) return '小红书';
    if (/channels\.weixin\.qq\.com/.test(url)) return '视频号';
    return null;
  },

  // 生成模拟分析结果
  generateMockResult(platform, url) {
    // 根据平台返回对应的模拟数据
    const templates = {
      '抖音': {
        platform: '抖音',
        analysis: {
          basicInfo: {
            title: '3个让你变有钱的存钱习惯，第2个太重要了！',
            author: '理财小能手',
            duration: 45,
            likes: 1250000,
            comments: 45000,
            shares: 89000,
            publishTime: '2026-02-10'
          },
          viralFactors: [
            {
              type: 'hook',
              name: '黄金3秒钩子',
              description: '为什么你存不下钱？',
              score: 85
            },
            {
              type: 'emotion',
              name: '情绪价值',
              description: '焦虑+希望，戳中用户痛点',
              examples: ['共鸣', '好奇', '希望']
            },
            {
              type: 'information',
              name: '信息价值',
              description: '实用的理财技巧，可操作性强',
              examples: ['干货', '技巧', '可操作']
            },
            {
              type: 'conflict',
              name: '冲突点',
              description: '月光族 vs 存钱达人'
            }
          ],
          structure: {
            opening: {
              duration: '0-3秒',
              purpose: '抓住注意力',
              technique: '悬念开场'
            },
            setup: {
              duration: '3-10秒',
              purpose: '建立问题背景',
              content: '揭示存不下钱的3个原因'
            },
            climax: {
              duration: '10秒-结尾前5秒',
              purpose: '核心内容/解决方案',
              content: '展示3个存钱习惯和具体方法'
            },
            ending: {
              duration: '最后5秒',
              purpose: '引导互动/关注',
              cta: '关注我，学习更多理财知识'
            }
          },
          emotionCurve: {
            curve: [
              { time: '0-3秒', emotion: '好奇', intensity: 80 },
              { time: '3-10秒', emotion: '焦虑', intensity: 70 },
              { time: '中间', emotion: '希望', intensity: 90 },
              { time: '结尾', emotion: '动力', intensity: 85 }
            ]
          },
          visualElements: {
            style: '真人出镜+图文',
            colorPalette: ['暖色调', '金色', '白色'],
            shots: ['近景', '中景', '特写'],
            subtitles: {
              style: '黄色描边',
              animation: '逐字出现',
              position: '底部居中'
            },
            effects: ['文字放大', '箭头指示', '数字动画']
          },
          copywriting: {
            title: {
              text: '3个让你变有钱的存钱习惯，第2个太重要了！',
              length: 21,
              pattern: '清单型',
              keywords: ['存钱', '习惯', '变有钱']
            },
            structure: '问题-原因-解决-结果',
            keyPhrases: ['你知道吗', '重点来了', '记住这3点'],
            tone: '口语化+亲切'
          }
        },
        replicationPlan: {
          keyPoints: [
            {
              priority: '必须',
              element: '黄金3秒钩子',
              description: '为什么你存不下钱？',
              implementation: '设计一个同样吸引人的开场，使用类似的悬念或冲突'
            },
            {
              priority: '必须',
              element: '情绪价值',
              description: '焦虑+希望，戳中用户痛点',
              implementation: '找到能引发相同情绪的内容角度'
            },
            {
              priority: '重要',
              element: '内容结构',
              description: '悬念开场 → 问题揭示 → 解决方案',
              implementation: '保持相同的节奏和结构'
            }
          ],
          scriptTemplate: {
            opening: {
              duration: '0-3秒',
              template: '【画面：强视觉冲击或真人出镜】\n【文案：为什么你存不下钱？（制造悬念）】',
              tips: ['前3秒必须抓住注意力', '使用强视觉冲击或悬念']
            },
            body: {
              duration: '根据内容调整',
              template: '【铺垫】揭示存不下钱的3个常见原因\n【发展】逐步展开每个原因，配合案例\n【高潮】展示3个实用的存钱习惯\n【转折】强调第2个习惯最重要',
              tips: ['保持信息密度', '每10秒一个情绪起伏']
            },
            ending: {
              duration: '最后5秒',
              template: '【总结】快速回顾3个习惯\n【CTA】关注我，学习更多理财知识\n【钩子】下期分享：如何月入过万',
              tips: ['明确引导互动', '留下记忆点']
            }
          },
          storyboard: {
            style: '真人出镜+图文',
            colorPalette: ['暖色调', '金色', '白色'],
            shots: ['近景（开场）', '中景（讲解）', '特写（关键数据）'],
            subtitleStyle: {
              style: '黄色描边',
              animation: '逐字出现',
              position: '底部居中'
            },
            effects: ['文字放大', '箭头指示', '数字动画']
          },
          copyTemplate: {
            title: {
              pattern: '清单型',
              template: '{数字}个{主题}，第{数字}个{效果}',
              examples: ['3个', '存钱习惯', '太重要了']
            }
          },
          differentiation: {
            contentAngles: [
              '换个受众群体（如从职场人换成学生）',
              '换个场景（如从室内换成户外）',
              '增加个人经历或故事',
              '加入争议观点或反转'
            ],
            presentation: [
              '改变拍摄角度或景别',
              '使用不同的剪辑节奏',
              '尝试不同的字幕样式',
              '更换背景音乐风格'
            ],
            avoidHomogenization: [
              '加入个人 IP 特色（口头禅、标志性动作）',
              '结合时事热点',
              '提供更新的信息或数据',
              '增加互动环节'
            ],
            innovation: [
              '在原爆款基础上做升级版（如"进阶版"、"2026版"）',
              '做反向内容（如"千万别这样做"）',
              '做合集或系列化'
            ]
          },
          checklist: [
            { step: 1, task: '确定对标视频的核心爆款要素', done: false },
            { step: 2, task: '设计差异化内容角度', done: false },
            { step: 3, task: '撰写脚本（参考模板）', done: false },
            { step: 4, task: '设计分镜和视觉风格', done: false },
            { step: 5, task: '准备拍摄/制作素材', done: false },
            { step: 6, task: '拍摄/制作视频', done: false },
            { step: 7, task: '剪辑（保持相同节奏）', done: false },
            { step: 8, task: '添加字幕和特效', done: false },
            { step: 9, task: '选择相似风格的 BGM', done: false },
            { step: 10, task: '设计标题和封面', done: false },
            { step: 11, task: '发布并监测数据', done: false }
          ]
        },
        suggestions: {
          suitableFor: ['知识型创作者', '理财博主'],
          difficulty: {
            level: '中等',
            reasons: ['需要真人出镜', '需要专业知识', '文案要求较高']
          },
          successProbability: {
            score: 75,
            level: '高',
            reasons: ['实用性强', '受众广泛', '痛点明确']
          }
        }
      }
    };

    // 返回对应平台的数据，如果没有则返回抖音模板
    return templates[platform] || templates['抖音'];
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // 复制文本
  copyText(e) {
    const text = e.currentTarget.dataset.text;
    wx.setClipboardData({
      data: text,
      success: () => {
        this.setData({ copySuccess: true });
        setTimeout(() => {
          this.setData({ copySuccess: false });
        }, 2000);
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  // 复制整个方案
  copyFullPlan() {
    const { replicationPlan, analysis } = this.data;
    
    const fullText = this.generateFullPlanText(replicationPlan, analysis);
    
    wx.setClipboardData({
      data: fullText,
      success: () => {
        wx.showToast({ title: '完整方案已复制', icon: 'success' });
      }
    });
  },

  // 生成完整方案文本
  generateFullPlanText(plan, analysis) {
    if (!plan) return '';
    
    let text = `【爆款视频复刻方案】\n\n`;
    
    // 基础信息
    text += `📊 原视频信息\n`;
    text += `平台: ${analysis?.basicInfo?.title || '未知'}\n`;
    text += `点赞: ${analysis?.basicInfo?.likes || 0}\n`;
    text += `时长: ${analysis?.basicInfo?.duration || 0}秒\n\n`;
    
    // 复刻要点
    text += `🎯 复刻要点\n`;
    plan.keyPoints?.forEach((point, index) => {
      text += `${index + 1}. ${point.element}\n`;
      text += `   ${point.description}\n`;
      text += `   实施: ${point.implementation}\n\n`;
    });
    
    // 脚本模板
    if (plan.scriptTemplate) {
      text += `📝 脚本模板\n`;
      text += `【开场】${plan.scriptTemplate.opening?.duration}\n`;
      text += `${plan.scriptTemplate.opening?.template}\n\n`;
      text += `【主体】\n${plan.scriptTemplate.body?.template}\n\n`;
      text += `【结尾】${plan.scriptTemplate.ending?.duration}\n`;
      text += `${plan.scriptTemplate.ending?.template}\n\n`;
    }
    
    // 差异化建议
    if (plan.differentiation) {
      text += `💡 差异化建议\n`;
      text += `内容角度:\n`;
      plan.differentiation.contentAngles?.forEach(angle => {
        text += `- ${angle}\n`;
      });
      text += `\n表现形式:\n`;
      plan.differentiation.presentation?.forEach(item => {
        text += `- ${item}\n`;
      });
    }
    
    return text;
  },

  // 保存到本地
  saveToLocal() {
    const { replicationPlan, analysis } = this.data;
    
    if (!replicationPlan) {
      wx.showToast({ title: '没有可保存的内容', icon: 'none' });
      return;
    }

    const planData = {
      timestamp: new Date().toISOString(),
      platform: this.data.platform,
      analysis: analysis,
      replicationPlan: replicationPlan
    };

    // 获取已保存的方案
    let savedPlans = wx.getStorageSync('viral_analysis_plans') || [];
    savedPlans.unshift(planData);
    
    // 最多保存20个
    if (savedPlans.length > 20) {
      savedPlans = savedPlans.slice(0, 20);
    }
    
    wx.setStorageSync('viral_analysis_plans', savedPlans);
    
    wx.showToast({
      title: '已保存到本地',
      icon: 'success'
    });
  },

  // 查看历史记录
  viewHistory() {
    wx.navigateTo({
      url: '/pages/viral-analyzer/history'
    });
  },

  // 分享方案
  sharePlan() {
    // 生成分享图或文本
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 用户点击右上角分享
  onShareAppMessage() {
    const { analysis } = this.data;
    return {
      title: `爆款视频复刻方案: ${analysis?.basicInfo?.title || '分析结果'}`,
      path: '/pages/viral-analyzer/viral-analyzer',
      imageUrl: '/images/share-viral.png'
    };
  }
});
