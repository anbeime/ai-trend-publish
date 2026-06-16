// quality-detector.js - 质量检测与优化模块
// 检测画面质量、情节连贯度、人物一致性、合规性、爆款潜力

/**
 * QualityDetector 类
 */
class QualityDetector {
  constructor(pageContext) {
    this.page = pageContext;
    this.promptTemplateManager = require("./prompt-templates");
  }

  /**
   * 检测分镜脚本质量
   * @param {object} scriptData - 分镜脚本数据
   * @returns {Promise<object>} - 质量检测报告
   */
  async detectStoryboardQuality(scriptData) {
    console.log("开始检测分镜脚本质量");

    try {
      const prompt = this.buildQualityDetectionPrompt(scriptData);

      const res = await wx.cloud.callFunction({
        name: "agentAI",
        data: {
          agentType: "qualityDetector",
          userMessage: prompt,
          conversationHistory: [],
        },
      });

      if (res.result && res.result.success) {
        const report = this.parseQualityReport(res.result.reply);
        console.log("质量检测完成:", report);

        return {
          success: true,
          report,
        };
      }

      throw new Error("质量检测失败");
    } catch (error) {
      console.error("质量检测失败:", error);

      // 降级：返回基础评分
      return {
        success: true,
        report: this.generateBasicScore(scriptData),
      };
    }
  }

  /**
   * 构建质量检测提示词
   * @param {object} scriptData - 分镜脚本数据
   * @returns {string} - 提示词
   */
  buildQualityDetectionPrompt(scriptData) {
    const { title, scenes = [], totalDuration } = scriptData;

    return `你是一个短视频质量检测专家，精通爆款视频的评判标准。

【分镜脚本信息】
标题：${title}
分镜数量：${scenes.length}
总时长：${totalDuration || 0}秒
分镜详情：
${scenes.map((s, i) => `${i + 1}. ${s.description || s.content}`).join("\n")}

【检测维度】
请从以下维度进行质量检测（每项满分100分）：

1. **画面质量** (权重20%)
   - 分镜描述的清晰度
   - 场景的可视化程度
   - AI生图的友好度

2. **情节连贯度** (权重25%)
   - 分镜间的逻辑连贯性
   - 情节发展的流畅性
   - 转换的合理性

3. **人物一致性** (权重20%)
   - 角色前后描述的一致性
   - 动作和表情的连贯性
   - 外貌特征的统一性

4. **合规性检查** (权重15%)
   - 是否包含敏感内容
   - 是否符合平台规范
   - 是否有版权风险

5. **爆款潜力** (权重20%)
   - 是否有记忆点设计
   - 是否有互动引导
   - 是否符合爆款趋势

【输出要求】
请以JSON格式输出质量报告：
{
  "overallScore": 总分(0-100),
  "items": {
    "visualQuality": {
      "score": 分数(0-100),
      "status": "合格"/"需优化"/"不合格",
      "issues": ["问题1", "问题2"],
      "suggestions": ["优化建议1", "优化建议2"]
    },
    "plotCoherence": { ...同上... },
    "characterConsistency": { ...同上... },
    "compliance": { ...同上... },
    "viralPotential": { ...同上... }
  },
  "overallStatus": "合格"/"需优化"/"不合格",
  "quickWins": ["快速优化建议1", "快速优化建议2"],
  "criticalIssues": ["必须修复的问题1", "必须修复的问题2"]
}`;
  }

  /**
   * 解析质量报告
   * @param {string} aiReply - AI返回的文本
   * @returns {object} - 质量报告
   */
  parseQualityReport(aiReply) {
    try {
      const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error("无法解析质量报告JSON");
    } catch (error) {
      console.error("解析质量报告失败:", error);
      return {
        overallScore: 60,
        overallStatus: "需优化",
        items: {},
        quickWins: [],
        criticalIssues: [],
      };
    }
  }

  /**
   * 生成基础评分（降级方案）
   * @param {object} scriptData - 分镜脚本数据
   * @returns {object} - 基础质量报告
   */
  generateBasicScore(scriptData) {
    const { scenes = [] } = scriptData;

    const scores = {
      visualQuality: {
        score: 70,
        status: "合格",
        issues: [],
        suggestions: ["增加更多画面细节描述"],
      },
      plotCoherence: {
        score: scenes.length > 3 ? 75 : 60,
        status: "合格",
        issues: scenes.length < 3 ? ["分镜数量偏少"] : [],
        suggestions: ["增加情节转折"],
      },
      characterConsistency: {
        score: 65,
        status: "需优化",
        issues: ["角色描述可能不一致"],
        suggestions: ["统一角色外貌特征"],
      },
      compliance: {
        score: 85,
        status: "合格",
        issues: [],
        suggestions: ["检查敏感词"],
      },
      viralPotential: {
        score: 60,
        status: "需优化",
        issues: ["缺少记忆点设计"],
        suggestions: ["增加金句或反转"],
      },
    };

    const overallScore = Math.round(
      scores.visualQuality.score * 0.2 +
        scores.plotCoherence.score * 0.25 +
        scores.characterConsistency.score * 0.2 +
        scores.compliance.score * 0.15 +
        scores.viralPotential.score * 0.2,
    );

    return {
      overallScore,
      overallStatus: overallScore >= 80 ? "合格" : "需优化",
      items: scores,
      quickWins: ["增加分镜细节描述", "设计记忆点或反转", "统一角色外貌特征"],
      criticalIssues: overallScore < 60 ? ["质量评分过低，建议重写"] : [],
    };
  }
}

/**
 * ContentOptimizer 类 - 内容优化智能体
 */
class ContentOptimizer {
  constructor(pageContext) {
    this.page = pageContext;
    this.qualityDetector = new QualityDetector(pageContext);
  }

  /**
   * 优化分镜脚本
   * @param {object} scriptData - 分镜脚本数据
   * @param {object} qualityReport - 质量报告
   * @param {string} optimizationFocus - 优化重点（quick/comprehensive/custom）
   * @returns {Promise<object>} - 优化结果
   */
  async optimizeScript(
    scriptData,
    qualityReport = null,
    optimizationFocus = "comprehensive",
  ) {
    console.log("开始优化分镜脚本, 优化重点:", optimizationFocus);

    try {
      // 1. 如果没有质量报告，先进行检测
      if (!qualityReport) {
        const detectionResult =
          await this.qualityDetector.detectStoryboardQuality(scriptData);
        qualityReport = detectionResult.report;
      }

      // 2. 根据优化重点生成优化提示词
      const prompt = this.buildOptimizationPrompt(
        scriptData,
        qualityReport,
        optimizationFocus,
      );

      // 3. 调用AI智能体优化
      const res = await wx.cloud.callFunction({
        name: "agentAI",
        data: {
          agentType: "contentOptimizer",
          userMessage: prompt,
          conversationHistory: [],
        },
      });

      if (res.result && res.result.success) {
        const optimizedScript = this.parseOptimizedScript(res.result.reply);

        console.log("内容优化完成");

        return {
          success: true,
          originalScript: scriptData,
          qualityReport,
          optimizationFocus,
          optimizedScript,
        };
      }

      throw new Error("内容优化失败");
    } catch (error) {
      console.error("内容优化失败:", error);
      return {
        success: false,
        error: error.message || "内容优化失败",
      };
    }
  }

  /**
   * 构建优化提示词
   * @param {object} scriptData - 分镜脚本数据
   * @param {object} qualityReport - 质量报告
   * @param {string} focus - 优化重点
   * @returns {string} - 提示词
   */
  buildOptimizationPrompt(scriptData, qualityReport, focus) {
    const { items = {} } = qualityReport;

    let prompt = `你是一个短视频内容优化专家，精通爆款内容设计。

【原始分镜脚本】
${JSON.stringify(scriptData, null, 2)}

【质量检测结果】
${JSON.stringify(qualityReport, null, 2)}

【优化重点：${focus}】

`;

    switch (focus) {
      case "quick":
        prompt += `快速优化要求：
1. 重点解决"需优化"的项
2. 修复所有"不合格"的项
3. 提升总分至少10分
4. 输出JSON格式：{"optimizedScript": {...}, "improvements": [...]}
`;
        break;

      case "comprehensive":
        prompt += `全面优化要求：
1. 修复所有质量问题
2. 增强爆款潜力（记忆点、反转、金句）
3. 优化画面描述（面向AI生图）
4. 提升情节连贯性和人物一致性
5. 确保合规性
6. 输出JSON格式：{"optimizedScript": {...}, "improvements": [...], "optimizationNotes": "..."}
`;
        break;

      case "custom":
        prompt += `自定义优化：
请根据用户的自定义要求进行优化。
`;
        break;
    }

    return prompt;
  }

  /**
   * 解析优化后的脚本
   * @param {string} aiReply - AI返回的文本
   * @returns {object} - 优化后的脚本
   */
  parseOptimizedScript(aiReply) {
    try {
      const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);

        if (result.optimizedScript) {
          return {
            ...result.optimizedScript,
            improvements: result.improvements || [],
            optimizationNotes: result.optimizationNotes || "",
          };
        }

        return result;
      }

      // 如果没有JSON，返回原始脚本
      return scriptData;
    } catch (error) {
      console.error("解析优化脚本失败:", error);
      return scriptData;
    }
  }

  /**
   * 快速修复特定分镜
   * @param {object} sceneData - 分镜数据
   * @param {string} issue - 问题描述
   * @returns {Promise<object>} - 修复结果
   */
  async fixScene(sceneData, issue) {
    console.log("修复分镜:", sceneData.description, "问题:", issue);

    try {
      const prompt = `请修复以下分镜的问题：

【分镜信息】
${JSON.stringify(sceneData, null, 2)}

【问题】
${issue}

【修复要求】
1. 保持分镜的基本结构
2. 针对问题进行修复
3. 优化画面描述（面向AI生图）
4. 输出JSON格式

请修复该分镜。`;

      const res = await wx.cloud.callFunction({
        name: "agentAI",
        data: {
          agentType: "sceneFixer",
          userMessage: prompt,
          conversationHistory: [],
        },
      });

      if (res.result && res.result.success) {
        const fixedScene = this.parseFixedScene(res.result.reply);

        return {
          success: true,
          originalScene: sceneData,
          issue,
          fixedScene,
        };
      }

      throw new Error("分镜修复失败");
    } catch (error) {
      console.error("分镜修复失败:", error);
      return {
        success: false,
        error: error.message || "分镜修复失败",
      };
    }
  }

  /**
   * 解析修复后的分镜
   * @param {string} aiReply - AI返回的文本
   * @returns {object} - 修复后的分镜
   */
  parseFixedScene(aiReply) {
    try {
      const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return null;
    } catch (error) {
      console.error("解析修复分镜失败:", error);
      return null;
    }
  }

  /**
   * 生成爆款标题建议
   * @param {object} scriptData - 分镜脚本数据
   * @returns {Promise<object>} - 标题建议
   */
  async generateViralTitles(scriptData) {
    console.log("生成爆款标题建议");

    try {
      const prompt = `你是一个短视频爆款标题专家。

【分镜脚本信息】
标题：${scriptData.title}
内容摘要：${scriptData.description || scriptData.scenes?.map((s) => s.description).join("; ")}

【标题要求】
1. 吸睛，3-15字
2. 包含热点关键词
3. 制造悬念或痛点
4. 符合平台调性（抖音/快手/视频号）
5. 避免标题党

请生成5个爆款标题备选，输出JSON格式：
{
  "titles": [
    {"title": "标题1", "reason": "推荐理由"},
    {"title": "标题2", "reason": "推荐理由"}
  ]
}`;

      const res = await wx.cloud.callFunction({
        name: "agentAI",
        data: {
          agentType: "titleGenerator",
          userMessage: prompt,
          conversationHistory: [],
        },
      });

      if (res.result && res.result.success) {
        const titles = this.parseTitleSuggestions(res.result.reply);

        return {
          success: true,
          titles,
        };
      }

      throw new Error("标题生成失败");
    } catch (error) {
      console.error("标题生成失败:", error);
      return {
        success: false,
        error: error.message || "标题生成失败",
      };
    }
  }

  /**
   * 解析标题建议
   * @param {string} aiReply - AI返回的文本
   * @returns {array} - 标题列表
   */
  parseTitleSuggestions(aiReply) {
    try {
      const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return result.titles || [];
      }

      return [];
    } catch (error) {
      console.error("解析标题建议失败:", error);
      return [];
    }
  }
}

/**
 * QualityManager 类 - 统一管理质量检测和优化
 */
class QualityManager {
  constructor(pageContext) {
    this.page = pageContext;
    this.detector = new QualityDetector(pageContext);
    this.optimizer = new ContentOptimizer(pageContext);
  }

  /**
   * 完整的质量检测和优化流程
   * @param {object} scriptData - 分镜脚本数据
   * @param {object} options - 选项
   * @returns {Promise<object>} - 完整结果
   */
  async fullQualityCheck(scriptData, options = {}) {
    const {
      autoFix = false,
      optimizationLevel = "quick", // quick/comprehensive
      generateTitles = false,
    } = options;

    console.log("开始完整质量检测流程");

    try {
      // 1. 质量检测
      const detectionResult =
        await this.detector.detectStoryboardQuality(scriptData);

      if (!detectionResult.success) {
        throw new Error("质量检测失败");
      }

      const report = detectionResult.report;

      // 2. 如果需要自动优化
      let optimizedScript = scriptData;
      if (autoFix && report.overallScore < 80) {
        console.log("自动优化分镜脚本");
        const optimizationResult = await this.optimizer.optimizeScript(
          scriptData,
          report,
          optimizationLevel,
        );

        if (optimizationResult.success) {
          optimizedScript = optimizationResult.optimizedScript;
        }
      }

      // 3. 如果需要生成标题
      let viralTitles = [];
      if (generateTitles) {
        console.log("生成爆款标题");
        const titleResult =
          await this.optimizer.generateViralTitles(optimizedScript);

        if (titleResult.success) {
          viralTitles = titleResult.titles;
        }
      }

      console.log("完整质量检测流程完成");

      return {
        success: true,
        originalScript: scriptData,
        qualityReport: report,
        optimizedScript,
        viralTitles,
        summary: this.generateSummary(report, optimizedScript, viralTitles),
      };
    } catch (error) {
      console.error("完整质量检测流程失败:", error);
      return {
        success: false,
        error: error.message || "质量检测流程失败",
      };
    }
  }

  /**
   * 生成总结
   * @param {object} report - 质量报告
   * @param {object} optimizedScript - 优化后的脚本
   * @param {array} viralTitles - 爆款标题
   * @returns {string} - 总结文本
   */
  generateSummary(report, optimizedScript, viralTitles) {
    let summary = `质量评分：${report.overallScore}分 (${report.overallStatus})\n\n`;

    if (report.quickWins && report.quickWins.length > 0) {
      summary += `快速优化建议：\n${report.quickWins.map((w) => `- ${w}`).join("\n")}\n\n`;
    }

    if (report.criticalIssues && report.criticalIssues.length > 0) {
      summary += `必须修复的问题：\n${report.criticalIssues.map((i) => `- ${i}`).join("\n")}\n\n`;
    }

    if (viralTitles && viralTitles.length > 0) {
      summary += `推荐标题：\n${viralTitles.map((t) => `- ${t.title}`).join("\n")}\n`;
    }

    return summary;
  }
}

module.exports = {
  QualityDetector,
  ContentOptimizer,
  QualityManager,
};
