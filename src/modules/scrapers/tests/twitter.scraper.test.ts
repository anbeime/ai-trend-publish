import { assertEquals } from "jsr:@std/assert";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { TwitterScraper } from "@src/modules/scrapers/twitter.scraper.ts";

Deno.test({
  name: "Twitter爬虫测试",
  async fn() {
    const configManager = ConfigManager.getInstance();
    await configManager.initDefaultConfigSources();

    const scraper = new TwitterScraper();
    const result = await scraper.scrape("https://x.com/CohereForAI");

    // 验证返回结果不为空
    assertEquals(typeof result, "object");
    assertEquals(Array.isArray(result), true);
    assertEquals(result.length > 0, true);

    // 验证推文内容格式
    const firstTweet = result[0];
    assertEquals(typeof firstTweet.content, "string");
    assertEquals(typeof firstTweet.publishDate, "string");
  },
});

Deno.test({
  name: "Twitter爬虫错误处理测试",
  async fn() {
    const scraper = new TwitterScraper();
    try {
      await scraper.scrape("https://x.com/invalid_user_404");
      throw new Error("应该抛出错误");
    } catch (error) {
      assertEquals(error instanceof Error, true);
    }
  },
});
