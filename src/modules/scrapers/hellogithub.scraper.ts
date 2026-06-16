import * as cheerio from "npm:cheerio";
import {
  AIGithubItem,
  AIGithubItemDetail,
} from "@src/modules/render/weixin/interfaces/aigithub.type.ts";

export class HelloGithubScraper {
  private static readonly BASE_URL = "https://hellogithub.com";
  private static readonly API_URL = "https://abroad.hellogithub.com/v1";

  /**
   * 获取热门仓库列表
   * @param page - 页码
   * @returns 仓库列表
   */
  public async getHotItems(page: number = 1): Promise<AIGithubItem[]> {
    try {
      const url =
        `${HelloGithubScraper.API_URL}/?sort_by=featured&page=${page}&rank_by=newest&tid=juBLV86qa5`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        throw new Error("Failed to fetch hot items");
      }

      return data.data.map((item: any) => ({
        itemId: item.item_id,
        author: item.author,
        title: item.title,
      }));
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to fetch hot items:", error);
        throw new Error(`Failed to fetch hot items: ${error.message}`);
      }
      throw new Error("Failed to fetch hot items: Unknown error");
    }
  }

  /**
   * 从 HelloGithub 获取项目详情
   * @param itemId - 项目ID
   * @returns 项目详情
   */
  public async getItemDetail(itemId: string): Promise<AIGithubItemDetail> {
    try {
      const url = `${HelloGithubScraper.BASE_URL}/repository/${itemId}`;
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      // 提取 __NEXT_DATA__ 中的数据
      const nextData = JSON.parse($("#__NEXT_DATA__").text());
      const repoData = nextData.props.pageProps.repo;

      // 提取标签
      const tags = repoData.tags.map((tag: { name: string }) => tag.name);

      // 提取相关链接
      const relatedUrls = [];

      // 提取 GitHub 仓库链接
      const githubUrl = repoData.url;

      // 提取其他链接
      if (repoData.homepage && repoData.homepage !== githubUrl) {
        console.log("Found homepage:", repoData.homepage);
        relatedUrls.push({ url: repoData.homepage, title: "官网" });
      }
      if (repoData.document && repoData.document !== githubUrl) {
        console.log("Found document:", repoData.document);
        relatedUrls.push({ url: repoData.document, title: "文档" });
      }
      if (repoData.download && repoData.download !== githubUrl) {
        console.log("Found download:", repoData.download);
        relatedUrls.push({ url: repoData.download, title: "下载" });
      }
      if (repoData.online && repoData.online !== githubUrl) {
        console.log("Found online demo:", repoData.online);
        relatedUrls.push({ url: repoData.online, title: "演示" });
      }
      // 计算上周获得的 star 数
      const starHistory = repoData.star_history;
      const lastWeekStars = starHistory ? starHistory.increment || 0 : 0;

      return {
        itemId,
        author: repoData.author,
        title: repoData.title,
        name: repoData.name,
        url: repoData.url,
        description: repoData.summary,
        language: repoData.primary_lang,
        totalStars: repoData.stars,
        totalIssues: repoData.open_issues,
        totalForks: repoData.forks,
        contributors: repoData.contributors,
        lastWeekStars,
        tags,
        license: repoData.license,
        relatedUrls,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to fetch project details:", error);
        throw new Error(`Failed to fetch project details: ${error.message}`);
      }
      throw new Error("Failed to fetch project details: Unknown error");
    }
  }
}
