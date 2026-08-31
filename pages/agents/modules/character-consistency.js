// pages/agents/modules/character-consistency.js
// 角色一致性模块 - 处理角色三视图生成和管理

class CharacterConsistencyManager {
  constructor(page) {
    this.page = page;
  }

  // 从剧本中提取主要角色
  extractCharactersFromScript(script) {
    try {
      console.log("开始提取角色...", script);

      let characters = [];

      // 检查脚本是否存在
      if (!script) {
        console.warn("脚本为空，跳过角色提取");
        return [];
      }

      // 尝试解析JSON格式的剧本
      let scriptData;
      if (typeof script === "string") {
        try {
          scriptData = JSON.parse(script);
        } catch (e) {
          // 如果不是JSON，使用文本提取
          scriptData = { scenes: [{ narration: script }] };
        }
      } else {
        scriptData = script;
      }

      // 从场景中提取角色描述
      if (scriptData.scenes && scriptData.scenes.length > 0) {
        // 获取第一个场景的角色描述
        const firstScene = scriptData.scenes[0];
        let characterDesc =
          firstScene.character_description ||
          firstScene.characterDescription ||
          "";

        // 如果没有明确的character_description，尝试从narration中提取
        if (!characterDesc && firstScene.narration) {
          // 简单的提取：寻找描述人的关键词
          const narration = firstScene.narration;
          if (
            narration.includes("人") ||
            narration.includes("男") ||
            narration.includes("女")
          ) {
            characterDesc = narration;
          }
        }

        // 智能分割多个角色（按句号、分号、逗号）
        if (characterDesc) {
          const rawCharacters = characterDesc
            .split(/[。；;，]/)
            .map((desc) => desc.trim())
            .filter((desc) => desc.length > 5); // 过滤掉太短的描述

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

  // 构建角色三视图提示词
  buildTurnaroundPrompt(characterDesc, style = "anime", styleLibrary) {
    const styleConfig = styleLibrary[style] || styleLibrary.anime;

    return `Character turnaround sheet with three views of same character arranged horizontally:
- LEFT: Front view
- CENTER: Side view (profile)
- RIGHT: Back view

Character: ${characterDesc}

Style: ${styleConfig.basePrompt}, ${styleConfig.extendedKeywords}
Art quality: High quality, clean lines, consistent lighting, white background

Ensure character's face, hair, and outfit are clearly visible in all three views.
The character should look exactly the same in all three views, only angle changes.`;
  }

  // 生成角色三视图图片
  async generateCharacterTurnaround(character) {
    const page = this.page;

    // 检查是否已取消
    if (page.data.isCancelled) {
      console.log("角色三视图生成被取消");
      throw new Error("用户取消了创作任务");
    }

    try {
      console.log("开始生成角色三视图:", character);

      page.addMessage("system", `🎨 正在为"${character.name}"生成三视图...`);

      const style = page.data.selectedStyle;
      const prompt = this.buildTurnaroundPrompt(
        character.description,
        style,
        page.data.styleLibrary,
      );

      // 生成三视图图片
      const turnaroundUrl = await page.generateImage(prompt);

      // 检查是否已取消（图片生成后）
      if (page.data.isCancelled) {
        console.log("角色三视图生成后被取消");
        throw new Error("用户取消了创作任务");
      }

      // 保存角色表
      const characterSheets = page.data.characterSheets || {};
      characterSheets[character.id] = {
        ...character,
        combinedViewUrl: turnaroundUrl,
        status: "completed",
        createdAt: Date.now(),
      };

      page.setData({ characterSheets });

      page.addMessage("system", `"${character.name}"的三视图生成完成`);

      return turnaroundUrl;
    } catch (error) {
      console.error("生成角色三视图失败:", error);
      page.addMessage(
        "system",
        `生成"${character.name}"三视图失败：${error.message}`,
      );
      throw error;
    }
  }

  // 批量生成角色三视图
  async generateAllCharacterTurnarounds(characters) {
    try {
      console.log("开始批量生成角色三视图:", characters.length, "个角色");

      this.page.addMessage(
        "system",
        `🎨 开始为${characters.length}个角色生成三视图...`,
      );

      const turnaroundPromises = characters.map((character) =>
        this.generateCharacterTurnaround(character),
      );

      await Promise.all(turnaroundPromises);

      this.page.addMessage("system", "所有角色三视图生成完成");

      // 触发角色创作历史保存（所有角色完成后保存一条记录）
      if (this.page.saveCharacterCreationHistory) {
        const characterSheets = this.page.data.characterSheets || {};
        const userMessage = this.page.data.inputValue || "角色三视图生成";
        this.page.saveCharacterCreationHistory(userMessage, characterSheets);
      }
    } catch (error) {
      console.error("批量生成角色三视图失败:", error);
      this.page.addMessage("system", `批量生成三视图失败：${error.message}`);
      throw error;
    }
  }

  // 获取场景中的角色
  getCharactersInScene(sceneText, characters) {
    // 简单实现：返回所有角色，让AI自动决定
    return characters;
  }
}

module.exports = CharacterConsistencyManager;
