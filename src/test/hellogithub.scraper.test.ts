import { HelloGithubScraper } from "@src/modules/scrapers/hellogithub.scraper.ts";

async function testScraper() {
  console.log("开始测试 HelloGithubScraper...");
  const scraper = new HelloGithubScraper();

  try {
    // 1. 获取热门仓库列表
    console.log("\n1. 获取热门仓库列表");
    const hotItems = await scraper.getHotItems(1);
    console.log("热门仓库列表:");
    console.log(JSON.stringify(hotItems, null, 2));

    if (hotItems.length > 0) {
      // 2. 获取第一个仓库的详细信息
      console.log("\n2. 获取仓库详情");
      const firstItem = hotItems[0];
      console.log(`获取项目详情: ${firstItem.itemId}`);
      const result = await scraper.getItemDetail(firstItem.itemId);
      console.log("仓库详情:");
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error: any) {
    console.error("测试过程中发生错误:", error.message);
  }
}

// 运行测试
testScraper();
