import { assertEquals } from "jsr:@std/assert";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { FireCrawlScraper } from "@src/modules/scrapers/fireCrawl.scraper.ts";
import { Logger } from "@zilla/logger";
const logger = new Logger("fireCrawl-scraper");

Deno.test({
  name: "FireCrawl爬虫 scrapeUrl 测试",
  async fn() {
    const configManager = ConfigManager.getInstance();
    await configManager.initDefaultConfigSources();

    const scraper = new FireCrawlScraper();
    const result = await scraper.scrape(
      "https://www.toutiao.com/c/user/token/MS4wLjABAAAAHK1oKjkp6Bg3PJvPsD_i4cJrD41ElNK5jYIN9133Odc/?source=tuwen_detail&entrance_gid=7481195783346225716&log_from=59b4abc4209de_1741923570906",
    );

    // 验证返回结果不为空
    assertEquals(typeof result, "object");
    assertEquals(Array.isArray(result), true);
    assertEquals(result.length > 0, true);

    // 验证推文内容格式
    const firstTweet = result[0];
    assertEquals(typeof firstTweet.content, "string");
    assertEquals(typeof firstTweet.publishDate, "string");

    logger.info("FireCrawl爬虫 scrapeUrl 测试成功");
    logger.info("结果: ", result);
  },
});
