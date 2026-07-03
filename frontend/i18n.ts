export const translations = {
  en: {
    landing: {
      heroTitle: "AI-Powered Content Automation",
      heroSubtitle: "From trending topics to published articles. Auto-collect hotspots, AI-create content, and publish to 10+ platforms automatically.",
      cta: "Get Started Free",
      watchDemo: "Watch Demo",
      features: {
        title: "All-in-One Content Platform",
        hotspot: "Real-time Hotspot Collection",
        hotspotDesc: "Auto-collect trending topics from 50+ sources including Weibo, Zhihu, V2EX. Real-time updates and intelligent deduplication.",
        ai: "AI Content Analysis",
        aiDesc: "Multi-agent AI system with 4-layer analysis framework. Deep insight into phenomena, logic, needs, and predictions.",
        video: "AI Video Generation",
        videoDesc: "Professional digital human videos in 30 seconds. Hyper-realistic avatars, neural voice cloning, perfect lip-sync.",
        article: "AI Article Writing",
        articleDesc: "1000+ words high-quality articles in 1 minute. 85% originality rate, optimized for SEO and social engagement.",
        publish: "Auto Publishing",
        publishDesc: "One-click publishing to WeChat Official Account, Weibo, TikTok and 10+ platforms. Real-time status tracking.",
        auto: "Scheduled Automation",
        autoDesc: "Set it and forget it. Auto-run workflow at scheduled times. Daily content updates without manual intervention."
      },
      workflow: {
        title: "How It Works",
        desc: "From hotspot discovery to content publication in 4 simple steps",
        step1: "Collect Hotspots",
        step1Desc: "Auto-collect trending topics from multiple platforms in real-time",
        step2: "AI Analysis",
        step2Desc: "Deep analysis and insight extraction using multi-agent AI system",
        step3: "Content Creation",
        step3Desc: "AI generates articles, scripts, and digital human videos",
        step4: "Auto Publish",
        step4Desc: "One-click publishing to multiple platforms simultaneously"
      },
      hotspot: {
        title: "Live Hotspots",
        desc: "Real-time trending topics from across the internet"
      },
      showcase: {
        title: "What You Can Create",
        desc: "From articles to videos, everything automated by AI"
      },
      trust: "Trusted by 10,000+ creators worldwide"
    },
    nav: {
      dashboard: "Dashboard",
      create: "Quick Create",
      assets: "Assets Studio",
      settings: "API Settings",
      logout: "Logout",
      profile: "Profile Settings",
      billing: "Billing & Plans",
      usage: "Usage Details"
    },
    user: {
      tier: "Pro Plan",
      expiry: "Renews on Nov 24, 2023",
      credits: "Credits",
      minutes: "min",
      used: "Used",
      remaining: "Remaining",
      upgrade: "Upgrade Plan",
      basicInfo: "Basic Info",
      username: "Username",
      email: "Email Address",
      security: "Account Security",
      changePassword: "Change Password",
      saveChanges: "Save Changes"
    },
    dashboard: {
      title: "My Videos",
      subtitle: "Manage your digital human productions",
      newProject: "New Project",
      createFirst: "Create New Video",
      status: {
        done: "Done",
        failed: "Failed",
        processing: "Processing"
      }
    },
    create: {
      title: "Create Magic in 30 Seconds",
      subtitle: "Select your assets, set the vibe, and let AI do the rest.",
      audioMode: {
        title: "Audio Mode",
        tts: "TTS Synthesis",
        direct: "Use Voice Audio",
        ttsDesc: "Generate speech from script using AI voice cloning",
        directDesc: "Use the voice asset's audio file directly"
      },
      emotions: {
        title: "Synthesis Style",
        happy: "Happy",
        serious: "Serious",
        excited: "Excited",
        professional: "Professional",
        gentle: "Gentle"
      },
      steps: {
        face: "Avatar Selection",
        voice: "Voice Selection",
        content: "Script Selection"
      },
      placeholders: {
        avatar: "Select Avatar",
        voice: "Select Voice",
        script: "Write your script here...",
        prompt: "E.g., Natural smile, sincere eye contact, moderate speaking rate..."
      },
      labels: {
        choose: "Choose from Library",
        library: "Library",
        editor: "Custom Editor",
        saveScript: "Save to Library",
        cloningStatus: "Enhanced AI Cloning Active",
        cloningDesc: "AI will simulate the specific resonance of {voice} while maintaining consistency across the script.",
        change: "Change Asset",
        swap: "Select from Studio",
        prompt: "Action Prompt",
        preview: "Voice Synthesis & Preview",
        checkSync: "Synthesizing audio for {voice} with {emotion} emotion...",
        listen: "Synthesize & Listen",
        generating: "Synthesizing...",
        synthesize: "Synthesize",
        playPreview: "Play",
        pausePreview: "Pause",
        savePreview: "Save",
        savingPreview: "Saving...",
        previewReady: "Preview ready",
        previewNotReady: "Not synthesized yet",
        ready: "Everything ready? Launch generation.",
        launching: "Launching AI...",
        generate: "GENERATE VIDEO",
        selectAsset: "Select {type}",
        audioModeInfo: "No script needed in direct audio mode",
        qualityOptimization: "Quality Optimization",
        ready100: "100% Ready",
        usingAudioFrom: "Using audio from: {voice}",
        audioFileReady: "Audio file ready",
        noAudioFile: "No audio file available",
        directAudioMode: "Direct Audio Mode",
        directAudioDesc: "Using voice audio directly",
        directAudioInfo: "The video will use the audio file from {voice} directly without TTS processing.",
        browseCollection: "Browse your collection for the perfect component.",
        search: "Search...",
        close: "Close",
        playVoice: "Play Voice",
        pauseVoice: "Pause"
      },
      alert: "Mission Launched! 🚀 Check Dashboard for progress."
    },
    assets: {
      title: "Assets Studio",
      newBtn: "New {type}",
      upload: "Upload / AI Generate",
      aiGen: "AI Generation",
      localUpload: "Local Upload",
      tabs: {
        avatar: "Avatars",
        voice: "Voices",
        script: "Scripts"
      },
      system: "System",
      modal: {
        name: "Asset Name",
        namePlaceholder: "Enter a unique name...",
        prompt: "Generation Prompt",
        promptPlaceholder: "Describe your vision...",
        images: "Reference Images (Optional, max 4)",
        uploadHint: "Drag or click to add images",
        submit: "Start Creation",
        fileSelect: "Select Local File"
      }
    },
    humor: {
      billing: "Our finance bots are currently on a digital vacation in the Metaverse. Billing will resume once they stop arguing over Bitcoin! 🤖💰"
    },
    auth: {
      loginSuccess: "Login Successful!",
      redirecting: "Redirecting to dashboard..."
    },
    settings: {
      title: "API Configuration",
      subtitle: "Configure your third-party service API keys. System defaults will be used when not configured.",
      categories: {
        aiImage: "AI Image Generation",
        aiImageDesc: "Generate images with AI",
        cloudStorage: "Cloud Storage",
        cloudStorageDesc: "Store and serve files",
        digitalHuman: "Digital Human Video",
        digitalHumanDesc: "Generate talking avatar videos",
        tts: "Text-to-Speech",
        ttsDesc: "Convert text to natural speech",
        llm: "Large Language Model",
        llmDesc: "Generate text content with AI"
      },
      addConfig: "Add Configuration",
      editConfig: "Edit Configuration",
      noConfig: "No configurations yet. System defaults will be used.",
      default: "Default",
      system: "System",
      validated: "Validated",
      notValidated: "Not validated",
      setAsDefault: "Set as default for this category",
      displayName: "Display Name",
      selectProvider: "Select Provider",
      availableProviders: "Available Providers",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      confirmDelete: "Are you sure you want to delete this configuration?"
    }
  },
  zh: {
    landing: {
      heroTitle: "AI驱动的内容自动化平台",
      heroSubtitle: "从热点发现到内容发布一站式完成。自动采集热点、AI创作内容、一键发布到10+平台。",
      cta: "立即免费开始",
      watchDemo: "观看演示",
      features: {
        title: "一站式内容创作平台",
        hotspot: "实时热点采集",
        hotspotDesc: "自动采集微博、知乎、V2EX等50+平台热点话题。实时更新，智能去重。",
        ai: "AI内容分析",
        aiDesc: "多智能体AI系统，四层分析框架。深度洞察现象、逻辑、需求与预测。",
        video: "AI视频生成",
        videoDesc: "30秒生成专业数字人口播视频。超写实形象、神经网络语音克隆、完美口型匹配。",
        article: "AI文章写作",
        articleDesc: "1分钟生成1000+字高质量文章。85%原创率，SEO优化，社交传播友好。",
        publish: "一键自动发布",
        publishDesc: "一键发布到微信公众号、微博、TikTok等10+平台。实时状态追踪。",
        auto: "定时自动化",
        autoDesc: "设置后自动运行。定时触发工作流，每日更新内容无需人工干预。"
      },
      workflow: {
        title: "工作流程",
        desc: "从热点发现到内容发布，仅需4步",
        step1: "采集热点",
        step1Desc: "实时从多个平台自动采集热点话题",
        step2: "AI分析",
        step2Desc: "多智能体AI系统进行深度分析与洞察提取",
        step3: "内容创作",
        step3Desc: "AI生成文章、脚本和数字人视频",
        step4: "自动发布",
        step4Desc: "一键同步发布到多个平台"
      },
      hotspot: {
        title: "实时热点",
        desc: "全网实时热点话题"
      },
      showcase: {
        title: "你可以创作什么",
        desc: "从文章到视频，一切由AI自动化完成"
      },
      trust: "全球 10,000+ 创作者的共同选择"
    },
    nav: {
      dashboard: "仪表盘",
      create: "极速创作",
      assets: "资产中心",
      settings: "API 设置",
      logout: "退出登录",
      profile: "个人设置",
      billing: "订阅与账单",
      usage: "用量明细"
    },
    user: {
      tier: "专业版会员",
      expiry: "2023年11月24日续费",
      credits: "算力点数",
      minutes: "分钟",
      used: "已用",
      remaining: "剩余",
      upgrade: "升级方案",
      basicInfo: "基本信息",
      username: "用户名",
      email: "邮箱地址",
      security: "账号安全",
      changePassword: "修改密码",
      saveChanges: "保存设置"
    },
    dashboard: {
      title: "我的视频",
      subtitle: "管理您的数字人作品",
      newProject: "新建项目",
      createFirst: "创建首个视频",
      status: {
        done: "完成",
        failed: "失败",
        processing: "生成中"
      }
    },
    create: {
      title: "30秒开启数字魔法",
      subtitle: "选择素材，设定风格，让 AI 搞定剩下的工作。",
      audioMode: {
        title: "音频模式",
        tts: "TTS 合成",
        direct: "直接使用音频",
        ttsDesc: "使用 AI 语音克隆从脚本生成语音",
        directDesc: "直接使用所选音色的音频文件"
      },
      emotions: {
        title: "合成风格选择",
        happy: "开心",
        serious: "严肃",
        excited: "亢奋",
        professional: "专业",
        gentle: "温柔"
      },
      steps: {
        face: "形象库选择",
        voice: "音色库选择",
        content: "脚本库选择"
      },
      placeholders: {
        avatar: "请选择形象",
        voice: "请选择音色",
        script: "在此输入您的脚本内容...",
        prompt: "例如：自然微笑，真诚眼神交流，语速适中..."
      },
      labels: {
        choose: "从库中选择",
        library: "资产库",
        editor: "自定义编辑",
        saveScript: "保存到脚本库",
        cloningStatus: "语音克隆引擎已就绪",
        cloningDesc: "AI 将模拟 {voice} 的独特音色，同时保持脚本的一致性表达。",
        change: "更换素材",
        swap: "打开资产中心选择",
        prompt: "动作/表演提示词",
        preview: "语音预览与合成",
        checkSync: "正在使用 {voice} 以 {emotion} 情绪合成音频预览...",
        listen: "合成并试听",
        generating: "正在合成预览...",
        synthesize: "合成",
        playPreview: "试听",
        pausePreview: "暂停",
        savePreview: "保存",
        savingPreview: "保存中...",
        previewReady: "已合成，可试听/保存",
        previewNotReady: "尚未合成",
        ready: "准备就绪？立即开始视频生成。",
        launching: "任务启动中...",
        generate: "立即生成视频",
        selectAsset: "选择{type}",
        audioModeInfo: "直接使用音频模式下无需选择脚本",
        qualityOptimization: "音质优化",
        ready100: "100% 就绪",
        usingAudioFrom: "使用音频来自: {voice}",
        audioFileReady: "音频文件就绪",
        noAudioFile: "无可用音频文件",
        directAudioMode: "直接音频模式",
        directAudioDesc: "直接使用音色音频",
        directAudioInfo: "视频将直接使用 {voice} 的音频文件，无需 TTS 处理。",
        browseCollection: "从素材库中选择合适的组件。",
        search: "搜索...",
        close: "关闭",
        playVoice: "播放音色",
        pauseVoice: "暂停"
      },
      alert: "任务已启动！🚀 请在仪表盘查看进度。"
    },
    assets: {
      title: "资产中心",
      newBtn: "新建{type}",
      upload: "上传 / AI生成",
      aiGen: "AI 生成素材",
      localUpload: "本地文件上传",
      tabs: {
        avatar: "形象库",
        voice: "音色库",
        script: "脚本库"
      },
      system: "官方",
      modal: {
        name: "资产名称",
        namePlaceholder: "给它起个好记的名字...",
        prompt: "生成提示词",
        promptPlaceholder: "描述你想要生成的形象/内容...",
        images: "参考图片 (可选，最多4张)",
        uploadHint: "点击或拖拽上传图片",
        submit: "立即开始创建",
        fileSelect: "选择本地文件"
      }
    },
    humor: {
      billing: "财务机器人正在元宇宙休假，顺便因为比特币的走势吵得不可开交。等它们和解了再来谈钱的事儿吧！🤖💰"
    },
    auth: {
      loginSuccess: "登录成功！",
      redirecting: "正在跳转到仪表盘..."
    },
    settings: {
      title: "API 配置",
      subtitle: "配置您的第三方服务 API 密钥。未配置时将使用系统默认配置。",
      categories: {
        aiImage: "AI 生图",
        aiImageDesc: "使用 AI 生成图片",
        cloudStorage: "云存储",
        cloudStorageDesc: "存储和分发文件",
        digitalHuman: "数字人视频",
        digitalHumanDesc: "生成口播视频",
        tts: "语音合成",
        ttsDesc: "将文字转换为自然语音",
        llm: "大语言模型",
        llmDesc: "使用 AI 生成文本内容"
      },
      addConfig: "添加配置",
      editConfig: "编辑配置",
      noConfig: "暂无配置，将使用系统默认配置",
      default: "默认",
      system: "系统",
      validated: "已验证",
      notValidated: "未验证",
      setAsDefault: "设为此类别的默认配置",
      displayName: "显示名称",
      selectProvider: "选择服务商",
      availableProviders: "支持的服务商",
      save: "保存",
      saving: "保存中...",
      cancel: "取消",
      delete: "删除",
      edit: "编辑",
      confirmDelete: "确定要删除此配置吗？"
    }
  }
};

export type TranslationKeys = typeof translations.en;
