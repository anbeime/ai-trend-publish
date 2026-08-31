import ejs from "ejs";
import fs from "fs";
import path from "path";
import { HelloGithubScraper } from "@src/modules/scrapers/hellogithub.scraper.ts";

async function testTemplate() {
  try {
    // 1. 获取数据
    const scraper = new HelloGithubScraper();
    const hotItems = await scraper.getHotItems(1);
    const items = await Promise.all(
      hotItems.slice(0, 5).map((item) => scraper.getItemDetail(item.itemId)),
    );

    // 2. 读取模板
    const templatePath = path.join(
      __dirname,
      "../templates/hellogithub-weixin.ejs",
    );
    const template = fs.readFileSync(templatePath, "utf-8");

    // 3. 渲染模板
    const html = ejs.render(template, { items });

    // 4. 保存结果
    const outputPath = path.join(
      __dirname,
      "../../output/hellogithub-weixin.html",
    );
    fs.writeFileSync(outputPath, html, "utf-8");

    console.log("模板渲染成功！输出文件:", outputPath);
  } catch (error: any) {
    console.error("模板测试失败:", error.message);
  }
}

// 运行测试
testTemplate();
