class MediaGenerator {
  constructor(pageContext) {
    this.page = pageContext;
  }

  buildAgentContext(currentAgentKey) {
    const context = [];
    const agentOutputs = this.page.data.agentOutputs;
    
    for (const key in agentOutputs) {
      const output = agentOutputs[key];
      if (key !== currentAgentKey && output) {
        context.push({
          role: "assistant",
          content: "[" + key + "的输出] " + output.substring(0, 500)
        });
      }
    }
    
    return context;
  }

  async generateImages(prompts) {
    const images = [];
    for (const prompt of prompts) {
      try {
        const url = await this.page.apiService.generateImageGLM(prompt);
        images.push(url);
      } catch (error) {
        console.error("图片生成失败:", error);
      }
    }
    return images;
  }

  async generateVideo(prompt, options = {}) {
    try {
      // 使用 VideoGenerator，支持参考图
      return await this.page.videoGenerator.generateVideo(prompt, options);
    } catch (error) {
      console.error("视频生成失败:", error);
      return null;
    }
  }
}

module.exports = MediaGenerator;
