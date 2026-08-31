// article-generator.js - 公众号文章生成模块

class ArticleGenerator {
  constructor(pageContext) {
    this.page = pageContext;
  }

  /**
   * 生成公众号爆款文章HTML
   * @param {Object} hotTopic - 热点话题
   * @param {string} hotTopic.title - 标题
   * @param {string} hotTopic.category - 分类
   * @param {number} hotTopic.heat - 热度
   * @param {number} hotTopic.score - 评分
   * @returns {Object} {title, content, cover_url}
   */
  generateArticleHTML(hotTopic) {
    const title = hotTopic.title || '热点话题';
    const category = hotTopic.category || '热点';
    const heat = hotTopic.heat || 0;
    const score = hotTopic.score || 0;

    console.log('生成文章:', { title, category, heat, score });

    // 使用随机占位图（实际应该调用生图云函数）
    const coverImage = this.generateCoverImage(title, category);

    // HTML文章内容（内联CSS样式）
    const htmlContent = `
<section style="max-width: 677px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; line-height: 1.8; color: #333;">

<!-- 封面图 -->
<div style="width: 100%; margin-bottom: 24px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
  <img src="${coverImage}" style="width: 100%; height: auto; display: block;" alt="封面图">
</div>

<!-- 标题区域 -->
<h1 style="font-size: 32px; font-weight: 700; color: #1a202c; margin: 32px 0 24px; line-height: 1.4; text-align: center;">
  ${title}
</h1>

<!-- 热点标签 -->
<div style="display: flex; justify-content: center; gap: 12px; margin: 20px 0 32px; flex-wrap: wrap;">
  <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 500;">${category}</span>
  <span style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 500;">热搜话题</span>
  <span style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 500;">今日热点</span>
</div>

<!-- 导语 -->
<p style="font-size: 18px; color: #4a5568; margin-bottom: 32px; padding: 20px; background: #f7fafc; border-left: 4px solid #4a6cf7; border-radius: 0 8px 8px 0;">
  📢 <strong style="color: #4a6cf7;">重磅推荐</strong>：本文为您深度解析<strong style="color: #e53e3e; font-weight: 700;">${title}</strong>的最新动态，带您了解行业前沿趋势，把握市场机遇！热度达 <strong style="color: #f5576c; font-weight: 700;">${heat.toLocaleString()}</strong>，评分 <strong style="color: #00f2fe; font-weight: 700;">${score}</strong>/10！
</p>

<!-- 正文第一段 -->
<h2 style="font-size: 24px; font-weight: 700; color: #2d3748; margin: 36px 0 20px; padding-bottom: 12px; border-bottom: 3px solid #4a6cf7;">
  🌟 背景介绍
</h2>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
  近期，<strong style="color: #4a6cf7; font-weight: 600;">${title}</strong>成为全网热议焦点，搜索热度达到<strong style="color: #e53e3e; font-weight: 700;">${heat.toLocaleString()}</strong>次。这一现象不仅反映了当前<strong style="color: #5b7be8; font-weight: 600;">${category}</strong>领域的发展趋势，更预示着未来的市场走向。
</p>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
  作为<strong style="color: #4a6cf7; font-weight: 600;">今日最热话题</strong>，它引发了各界的广泛关注和深入讨论。从普通用户到行业专家，都在探讨其背后的深层次原因和潜在影响。
</p>

<!-- 正文第二段 -->
<h2 style="font-size: 24px; font-weight: 700; color: #2d3748; margin: 36px 0 20px; padding-bottom: 12px; border-bottom: 3px solid #f5576c;">
  💡 核心要点
</h2>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
  通过深入分析，我们发现了以下<strong style="color: #f5576c; font-weight: 600;">核心亮点</strong>：
</p>

<ul style="list-style: none; padding: 0; margin: 24px 0;">
  <li style="background: #fff5f5; padding: 16px 20px; margin-bottom: 12px; border-radius: 8px; border-left: 4px solid #f5576c; font-size: 16px;">
    ✅ <strong style="color: #f5576c;">趋势明显</strong>：数据持续攀升，市场反应热烈
  </li>
  <li style="background: #fef3f7; padding: 16px 20px; margin-bottom: 12px; border-radius: 8px; border-left: 4px solid #ed64a6; font-size: 16px;">
    ✅ <strong style="color: #ed64a6;">影响深远</strong>：涉及多个行业，波及范围广
  </li>
  <li style="background: #faf5ff; padding: 16px 20px; margin-bottom: 12px; border-radius: 8px; border-left: 4px solid #b83280; font-size: 16px;">
    ✅ <strong style="color: #b83280;">机会巨大</strong>：市场空间广阔，发展潜力大
  </li>
</ul>

<!-- 正文第三段 -->
<h2 style="font-size: 24px; font-weight: 700; color: #2d3748; margin: 36px 0 20px; padding-bottom: 12px; border-bottom: 3px solid #4facfe;">
  🎯 深度分析
</h2>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
  从<strong style="color: #4facfe; font-weight: 600;">数据分析</strong>角度来看，这一热点的出现并非偶然。它背后有着复杂的<strong style="color: #4a6cf7; font-weight: 600;">市场逻辑</strong>和<strong style="color: #f5576c; font-weight: 600;">社会因素</strong>。
</p>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
  专家指出，这种现象与当前<strong style="color: #5b7be8; font-weight: 600;">${category}</strong>行业的快速发展密切相关。随着<strong style="color: #4a6cf7; font-weight: 600;">技术进步</strong>和<strong style="color: #f5576c; font-weight: 600;">消费升级</strong>，市场需求发生了显著变化。
</p>

<!-- 正文第四段 -->
<h2 style="font-size: 24px; font-weight: 700; color: #2d3748; margin: 36px 0 20px; padding-bottom: 12px; border-bottom: 3px solid #00f2fe;">
  🚀 未来展望
</h2>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
  展望未来，<strong style="color: #00f2fe; font-weight: 600;">${title}</strong>这一话题还将持续发酵。预计在<strong style="color: #4facfe; font-weight: 600;">未来6个月</strong>内，相关领域将迎来新的发展机遇。
</p>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
  行业专家预测，<strong style="color: #4a6cf7; font-weight: 600;">市场规模</strong>将继续扩大，<strong style="color: #f5576c; font-weight: 600;">技术创新</strong>将不断涌现，<strong style="color: #00f2fe; font-weight: 600;">用户体验</strong>将得到显著提升。
</p>

<!-- 总结部分 -->
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; border-radius: 16px; margin: 40px 0; box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);">
  <h3 style="font-size: 22px; font-weight: 700; margin: 0 0 16px; text-align: center;">
    📝 总结
  </h3>
  <p style="font-size: 16px; line-height: 2; margin: 0; text-align: justify;">
    综上所述，<strong style="font-weight: 700;">${title}</strong>作为当前<strong style="font-weight: 700;">最热话题</strong>，其影响深远、意义重大。无论是行业从业者还是普通用户，都应该关注这一趋势，把握发展机遇。
  </p>
</div>

<!-- 结尾引导 -->
<p style="font-size: 16px; color: #718096; text-align: center; margin: 32px 0; font-style: italic;">
  ——— END ———<br>
  感谢您的阅读！如果您喜欢本文，请<strong style="color: #4a6cf7; font-weight: 600;">点赞</strong>和<strong style="color: #f5576c; font-weight: 600;">分享</strong>给更多人！
</p>

</section>
`;

    return {
      title: title,
      content: htmlContent,
      cover_url: coverImage
    };
  }

  /**
   * 生成封面图URL（占位图）
   * 实际应该调用 generateImage 云函数
   */
  generateCoverImage(title, category) {
    // 使用占位图服务
    const colors = {
      '科技': '4a6cf7',
      '财经': 'f5576c',
      '娱乐': 'f093fb',
      '生活': '00f2fe',
      '教育': '4facfe',
      '健康': '667eea',
      '热点': '5b7be8'
    };

    const color = colors[category] || '4a6cf7';
    const text = encodeURIComponent(title.substring(0, 15));
    return `https://via.placeholder.com/900x500/${color}/ffffff?text=${text}`;
  }

  /**
   * 调用生图云函数生成封面图（可选）
   */
  async generateCoverWithCloud(title, category, useHunyuan = false) {
    try {
      console.log('调用云函数生成封面图...');

      const prompt = `微信公众号文章封面图，${category}主题，${title}，高清，专业，现代风格，中文文字，简洁大气，1024x1024`;

      const res = await wx.cloud.callFunction({
        name: 'generateImage',
        data: {
          prompt: prompt,
          size: '1024x1024',
          useHunyuan: useHunyuan
        }
      });

      if (res.result && res.result.success && res.result.imageUrl) {
        console.log('封面图生成成功:', res.result.imageUrl);
        return res.result.imageUrl;
      }

      return this.generateCoverImage(title, category);
    } catch (err) {
      console.error('生图云函数调用失败:', err);
      return this.generateCoverImage(title, category);
    }
  }
}

module.exports = ArticleGenerator;
