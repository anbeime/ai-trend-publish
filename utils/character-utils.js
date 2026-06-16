// utils/character-utils.js - 角色设定与三视图模块化工具
// 提取自 agents.js 的角色一致性功能，避免工作流程干扰

/**
 * 从剧本中提取主要角色
 * @param {string|object} script - 剧本内容（JSON字符串或对象）
 * @returns {Array} 角色数组，每个角色包含 id, name, description, role
 */
function extractCharactersFromScript(script) {
  try {
    console.log("[character-utils] 开始提取角色...", script);

    let characters = [];

    // 尝试解析JSON格式的剧本
    let scriptData = { scenes: [] }; // 默认空数组
    if (typeof script === "string") {
      try {
        scriptData = JSON.parse(script);
      } catch (e) {
        // 如果不是JSON，使用文本提取
        scriptData = { scenes: [{ narration: script }] };
      }
    } else if (typeof script === "object" && script !== null) {
      scriptData = script;
    }

    // 从场景中提取角色描述
    if (scriptData && scriptData.scenes && scriptData.scenes.length > 0) {
      // 获取第一个场景的角色描述
      const firstScene = scriptData.scenes[0];
      let characterDesc = firstScene.character_description || firstScene.characterDescription || "";

      // 如果没有明确的character_description，尝试从narration中提取
      if (!characterDesc && firstScene.narration) {
        // 简单的提取：寻找描述人的关键词
        const narration = firstScene.narration;
        if (narration.includes("人") || narration.includes("男") || narration.includes("女")) {
          characterDesc = narration;
        }
      }

      // 智能分割多个角色（按句号、分号、逗号分割）
      if (characterDesc) {
        const rawCharacters = characterDesc
          .split(/[。；;，]/)
          .map(desc => desc.trim())
          .filter(desc => desc.length > 5); // 过滤掉太短的描述

        // 最多提取2个角色
        characters = rawCharacters.slice(0, 2).map((desc, index) => ({
          id: `char_${Date.now()}_${index}`,
          name: index === 0 ? "主角" : "第二主角",
          description: desc,
          role: index === 0 ? "main" : "supporting",
        }));
      }
    }

    console.log("[character-utils] 提取到的角色:", characters);
    return characters;
  } catch (error) {
    console.error("[character-utils] 提取角色失败:", error);
    return [];
  }
}

/**
 * 构建角色三视图提示词
 * @param {string} characterDesc - 角色描述
 * @param {object} styleConfig - 风格配置对象，包含 basePrompt 和 extendedKeywords
 * @returns {string} 完整的三视图提示词
 */
function buildTurnaroundPrompt(characterDesc, styleConfig) {
  const style = styleConfig || { basePrompt: "anime style", extendedKeywords: "cute, colorful" };

  return `Character turnaround sheet with three views of the same character arranged horizontally:
- LEFT: Front view
- CENTER: Side view (profile)
- RIGHT: Back view

Character: ${characterDesc}

Style: ${style.basePrompt}, ${style.extendedKeywords}
Art quality: High quality, clean lines, consistent lighting, white background

Ensure character's face, hair, and outfit are clearly visible in all three views.
The character should look exactly the same in all three views, only the angle changes.`;
}

/**
 * 获取场景中的角色（简单实现）
 * @param {string} sceneText - 场景文本
 * @param {Array} characters - 所有角色数组
 * @returns {Array} 场景中出现的角色
 */
function getCharactersInScene(sceneText, characters) {
  // 简单实现：返回所有角色，让AI自动决定
  return characters;
}

/**
 * 根据用户输入推荐最适合的风格
 * @param {string} userInput - 用户输入
 * @param {object} styleLibrary - 风格库对象
 * @returns {string} 推荐风格键名
 */
function getRecommendedStyle(userInput, styleLibrary) {
  if (!userInput || typeof userInput !== "string") {
    return "anime"; // 默认返回动漫风格
  }

  const input = userInput.toLowerCase();
  const styleKeys = Object.keys(styleLibrary);

  // 关键词匹配表
  const keywordsMap = {
    anime: [
      "动漫",
      "二次元",
      "漫画",
      "可爱",
      "萌",
      "日系",
      "kawaii",
      "anime",
      "manga",
    ],
    guofeng: [
      "历史",
      "古代",
      "古装",
      "武侠",
      "传统文化",
      "李白",
      "古代",
      "guofeng",
    ],
    modern: [
      "产品",
      "商业",
      "科技",
      "现代",
      "写实",
      "介绍",
      "广告",
      "modern",
    ],
    cyberpunk: ["未来", "科幻", "赛博", "未来", "AI", "科技", "cyberpunk"],
    watercolor: [
      "艺术",
      "文艺",
      "治愈",
      "情感",
      "水彩",
      "艺术",
      "治愈",
      "watercolor",
    ],
    retro: ["游戏", "怀旧", "复古", "像素", "8-bit", "游戏", "复古", "retro"],
    minimal: ["简约", "简洁", "高端", "品牌", "minimal", "clean"],
    cinematic: ["电影", "大片", "史诗", "好莱坞", "电影感", "cinematic"],
  };

  // 匹配关键
  for (const styleKey of styleKeys) {
    const style = styleLibrary[styleKey];
    const keywords = keywordsMap[styleKey] || [];

    // 检查推荐场景中是否有匹
    for (const scenario of style.recommendedFor) {
      if (input.includes(scenario.toLowerCase())) {
        return styleKey;
      }
    }

    // 检查关键词匹配
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        return styleKey;
      }
    }
  }

  // 默认返回动漫风格
  return "anime";
}

/**
 * 应用风格到提示词
 * @param {string} basePrompt - 基础提示词
 * @param {object} style - 风格对象
 * @returns {object} 包含 prompt 和 negativePrompt 的对象
 */
function applyStyleToPrompt(basePrompt, style) {
  if (!style) {
    return {
      prompt: basePrompt,
      negativePrompt: "",
    };
  }

  // 组合风格提示
  const stylePrompt = `${style.basePrompt}, ${style.extendedKeywords}`;

  // 添加负向提示词（禁止风格）
  const negativePrompt = `(no: ${style.forbidden})`;

  return {
    prompt: `${stylePrompt}, ${basePrompt}`,
    negativePrompt: negativePrompt,
  };
}

/**
 * 生成角色三视图（纯逻辑部分，不包含实际图像生成）
 * @param {object} character - 角色对象
 * @param {object} styleConfig - 风格配置
 * @returns {object} 包含 prompt 和 character 信息的对象
 */
function prepareCharacterTurnaround(character, styleConfig) {
  console.log("[character-utils] 准备角色三视图生成:", character);

  const prompt = buildTurnaroundPrompt(character.description, styleConfig);

  return {
    character,
    prompt,
    styleConfig,
  };
}

/**
 * 批量准备角色三视图
 * @param {Array} characters - 角色数组
 * @param {object} styleConfig - 风格配置
 * @returns {Array} 准备结果数组
 */
function prepareAllCharacterTurnarounds(characters, styleConfig) {
  console.log("[character-utils] 批量准备角色三视图:", characters.length, "个角色");

  return characters.map(character => 
    prepareCharacterTurnaround(character, styleConfig)
  );
}

module.exports = {
  extractCharactersFromScript,
  buildTurnaroundPrompt,
  getCharactersInScene,
  getRecommendedStyle,
  applyStyleToPrompt,
  prepareCharacterTurnaround,
  prepareAllCharacterTurnarounds,
};