import FirecrawlApp from "npm:firecrawl";
import {
  ContentScraper,
  ScrapedContent,
  ScraperOptions,
} from "@src/modules/interfaces/scraper.interface.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { formatDate } from "@src/utils/common.ts";
import zod from "npm:zod";
import { Logger } from "@zilla/logger";

const logger = new Logger("fireCrawl-scraper");

// 使用 zod 定义数据结构
const StorySchema = zod.object({
  headline: zod.string(),
  content: zod.string(),
  link: zod.string(),
  date_posted: zod.string(),
});

const StoriesSchema = zod.object({
  stories: zod.array(StorySchema),
});

export class FireCrawlScraper implements ContentScraper {
  private app!: FirecrawlApp;

  async refresh(): Promise<void> {
    const startTime = Date.now();
    this.app = new FirecrawlApp({
      apiKey: await ConfigManager.getInstance().get("FIRE_CRAWL_API_KEY"),
    });
    logger.debug(`FireCrawlApp 初始化完成, 耗时: ${Date.now() - startTime}ms`);
  }

  private generateId(url: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const urlHash = url.split("").reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
    return `fc_${timestamp}_${random}_${Math.abs(urlHash)}`;
  }

  async scrape(
    sourceId: string,
    options?: ScraperOptions,
  ): Promise<ScrapedContent[]> {
    try {
      await this.refresh();
      const startTime = Date.now();
      const currentDate = new Date().toLocaleDateString();

      // 构建提取提示词
      const promptForFirecrawl = `
      Return only today's AI or LLM related story or post headlines and links in JSON format from the page content. 
      They must be posted today, ${currentDate}. The format should be:
        {
          "stories": [
            {
              "headline": "headline1",
              "content":"content1"
              "link": "link1",
              "date_posted": "YYYY-MM-DD HH:mm:ss",
            },
            ...
          ]
        }
      If there are no AI or LLM stories from today, return {"stories": []}.
      
      The source link is ${sourceId}. 
      If a story link is not absolute, prepend ${sourceId} to make it absolute. 
      Return only pure JSON in the specified format (no extra text, no markdown, no \\\\).  
      The content should be about 500 words, which can summarize the full text and the main point.
      Translate all into Chinese.
      !!
      `;

      // 使用 FirecrawlApp 进行抓取
      const scrapeResult = await this.app.scrapeUrl(sourceId, {
        formats: ["extract"],
        extract: {
          prompt: promptForFirecrawl,
          schema: StoriesSchema,
        },
      });

      if (!scrapeResult.success || !scrapeResult.extract?.stories) {
        throw new Error(scrapeResult.error || "未获取到有效内容");
      }

      // 使用 zod 验证返回数据
      const validatedData = StoriesSchema.parse(scrapeResult.extract);

      // 转换为 ScrapedContent 格式
      logger.debug(
        `[FireCrawl] 从 ${sourceId} 获取到 ${validatedData.stories.length} 条内容 耗时: ${
          Date.now() - startTime
        }ms`,
      );
      return validatedData.stories.map((story) => ({
        id: this.generateId(story.link),
        title: story.headline,
        content: story.content,
        url: story.link,
        publishDate: formatDate(story.date_posted),
        score: 0,
        metadata: {
          source: "fireCrawl",
          originalUrl: story.link,
          datePosted: story.date_posted,
        },
      }));
    } catch (error) {
      logger.error("FireCrawl抓取失败:", error);
      throw error;
    }
  }
}
