// pages/agents/modules/character-utils.js
// 角色设定和三视图工具模块

/**
 * 从剧本中提取角色
 * @param {string|object} script - 剧本文本或JSON对象
 * @returns {Array} 角色列表 [{id, name, description, role}]
 */
function extractCharactersFromScript(script) {
  try {
    console.log("开始提取角色...", script);

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

    console.log("提取到的角色:", characters);
    return characters;
  } catch (error) {
    console.error("提取角色失败:", error);
    return [];
  }
}

/**
 * 构建角色三视图提示词
 * @param {string} characterDesc - 角色描述
 * @param {object} styleConfig - 风格配置
 * @returns {string} 三视图提示词
 */
function buildTurnaroundPrompt(characterDesc, styleConfig) {
  const basePrompt = styleConfig.basePrompt || "anime style, manga art, 2D animation, cel shaded";
  const extendedKeywords = styleConfig.extendedKeywords || "Japanese anime style, vibrant colors, clean lines, cute aesthetic";

  return `Character turnaround sheet with three views of the same character arranged horizontally:
- LEFT: Front view
- CENTER: Side view (profile)
- RIGHT: Back view

Character: ${characterDesc}

Style: ${basePrompt}, ${extendedKeywords}
Art quality: High quality, clean lines, consistent lighting, white background

Ensure character's face, hair, and outfit are clearly visible in all three views.
The character should look exactly the same in all three views, only the angle changes.`;
}

/**
 * 生成角色三视图
 * @param {object} character - 角色对象 {id, name, description, role}
 * @param {string} style - 风格名称
 * @param {object} styleLibrary - 风格库
 * @param {object} context - 上下文对象，包含generateImage方法和addMessage方法
 * @param {boolean} isCancelled - 是否已取消
 * @returns {Promise<string>} 三视图图片URL
 */
async function generateCharacterTurnaround(character, style, styleLibrary, context, isCancelled) {
  // 检查是否已取消
  if (isCancelled) {
    console.log("角色三视图生成被取消");
    throw new Error("用户取消了创作任务");
  }

  try {
    console.log("开始生成角色三视图:", character);

    if (context.addMessage) {
      context.addMessage("system", `🎨 正在为"${character.name}"生成三视图...`);
    }

    const styleConfig = styleLibrary[style] || styleLibrary.anime;
    const prompt = buildTurnaroundPrompt(character.description, styleConfig);

    // 生成三视图图片
    const turnaroundUrl = await context.generateImage(prompt);

    // 检查是否已取消（图片生成后）
    if (isCancelled) {
      console.log("角色三视图生成后被取消");
      throw new Error("用户取消了创作任务");
    }

    if (context.addMessage) {
      context.addMessage("system", `"${character.name}"的三视图生成完成`);
    }

    return {
      ...character,
      combinedViewUrl: turnaroundUrl,
      status: "completed",
      createdAt: Date.now(),
    };
  } catch (error) {
    console.error("生成角色三视图失败:", error);
    if (context.addMessage) {
      context.addMessage("system", `生成"${character.name}"三视图失败：${error.message}`);
    }
    throw error;
  }
}

/**
 * 批量生成角色三视图
 * @param {Array} characters - 角色列表
 * @param {string} style - 风格名称
 * @param {object} styleLibrary - 风格库
 * @param {object} context - 上下文对象，包含generateImage方法和addMessage方法
 * @param {boolean} isCancelled - 是否已取消
 * @returns {Promise<Array>} 生成的角色三视图列表
 */
async function generateAllCharacterTurnarounds(characters, style, styleLibrary, context, isCancelled) {
  try {
    console.log("开始批量生成角色三视图:", characters.length, "个角色");

    if (context.addMessage) {
      context.addMessage("system", `🎨 开始为${characters.length}个角色生成三视图...`);
    }

    const turnaroundPromises = characters.map(character =>
      generateCharacterTurnaround(character, style, styleLibrary, context, isCancelled)
    );

    const results = await Promise.all(turnaroundPromises);

    if (context.addMessage) {
      context.addMessage("system", `所有角色三视图生成完成`);
    }

    return results;
  } catch (error) {
    console.error("批量生成角色三视图失败:", error);
    if (context.addMessage) {
      context.addMessage("system", `批量生成三视图失败：${error.message}`);
    }
    throw error;
  }
}

/**
 * 生成带角色参考的图片
 * @param {string} prompt - 提示词
 * @param {Array} characterReferenceUrls - 角色参考图片URL列表
 * @param {object} context - 上下文对象，包含generateImage方法和generateImageHuggingFace方法
 * @returns {Promise<string>} 生成的图片URL
 */
async function generateImageWithCharacterReference(prompt, characterReferenceUrls, context) {
  console.log("使用角色参考生成图片, characterReferenceUrls:", characterReferenceUrls);

  // 如果没有参考图，使用纯文本生成
  if (characterReferenceUrls.length === 0) {
    return await context.generateImage(prompt);
  }

  // 尝试使用支持参考图的API
  try {
    // 方法1: 尝试Hugging Face（支持多图参考）
    const hfConfig = context.huggingfaceConfig;
    if (hfConfig && hfConfig.enabled && hfConfig.apiKey) {
      console.log("尝试使用Hugging Face生成带参考图的图片...");
      const hfPrompt = `${prompt}\n\nReference style from provided character turnaround images. Maintain character consistency.`;

      return await context.generateImageHuggingFace(hfPrompt);
    }
  } catch (error) {
    console.warn("Hugging Face多图参考失败，降级为纯文本生成:", error);
  }

  // 方法2: 降级为纯文本生成
  console.log("降级为纯文本生成...");
  const enhancedPrompt = `${prompt}\n\nCharacter reference: ${characterReferenceUrls.join(', ')}\nPlease maintain character appearance consistency across all scenes.`;
  return await context.generateImage(enhancedPrompt);
}

/**
 * 生成带多图参考的视频
 * @param {string} prompt - 提示词
 * @param {Array} referenceUrls - 参考图片URL列表
 * @param {object} context - 上下文对象，包含generateVideo方法
 * @returns {Promise<string>} 生成的视频URL
 */
async function generateVideoWithReference(prompt, referenceUrls, context) {
  console.log("使用多图参考生成视频", referenceUrls.length, "张参考图");

  // 如果没有参考图，使用普通视频生成
  if (referenceUrls.length === 0) {
    return await context.generateVideo(prompt);
  }

  // 构建增强提示词
  const referencePrompt = `${prompt}\n\nUse the following reference images to maintain character consistency:\n${referenceUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}\n\nThe characters in the video must look exactly the same as in the reference images.`;

  // 尝试使用支持多图参考的API
  try {
    // 目前大多数API不支持多图参考，降级为带提示词的生成
    console.log("尝试使用GLM视频生成...");
    return await context.generateVideo(referencePrompt);
  } catch (error) {
    console.error("视频生成失败:", error);
    throw error;
  }
}

/**
 * 获取场景中的角色
 * @param {string} sceneText - 场景文本（保留用于未来扩展）
 * @param {Array} characters - 角色列表
 * @returns {Array} 场景中的角色列表
 */
function getCharactersInScene(sceneText, characters) {
  // 简单实现：返回所有角色，让AI自动决定
  // sceneText 参数保留用于未来扩展，可以根据场景文本智能过滤角色
  return characters;
}

/**
 * 创建角色三视图提示词的替代版本
 * @param {string} characterDesc - 角色描述
 * @param {string} stylePrompt - 风格提示词
 * @returns {string} 三视图提示词
 */
function createCharacterSheetPrompt(characterDesc, stylePrompt) {
  return `A character turnaround sheet showing three views of the same character:
Left: Front view
Center: Side view (profile)  
Right: Back view

Character Description: ${characterDesc}

Style: ${stylePrompt}

Requirements:
- All three views show the same character, only the viewing angle changes
- Character's facial features, hairstyle, and outfit must be consistent across all views
- Clean white background
- High quality, detailed artwork
- Professional character design sheet`;
}

module.exports = {
  extractCharactersFromScript,
  buildTurnaroundPrompt,
  generateCharacterTurnaround,
  generateAllCharacterTurnarounds,
  generateImageWithCharacterReference,
  generateVideoWithReference,
  getCharactersInScene,
  createCharacterSheetPrompt,
};
