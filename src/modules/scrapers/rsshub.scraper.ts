/**
 * RSSHub API 客户端
 *
 * 这个模块提供了一个简单易用的 RSSHub API 客户端，支持 RSSHub 的所有通用参数，
 * 并内置了缓存机制以提高性能和减轻 RSSHub 服务器负载。
 *
 * 基本用法:
 * ```typescript
 * import request from "./data-sources/rsshub.ts";
 *
 * // 获取 RSS 格式数据
 * const feed = await request("/v2/bing/daily-wallpaper").rss();
 *
 * // 获取 Atom 格式数据
 * const atomFeed = await request("/v2/bing/daily-wallpaper").atom();
 *
 * // 获取 JSON 格式数据
 * const jsonFeed = await request("/v2/bing/daily-wallpaper").json();
 * ```
 *
 * 处理不同格式的数据:
 * ```typescript
 * // RSS 和 Atom 格式是 XML 数据，可能需要进一步解析
 * import { XMLParser } from "npm:fast-xml-parser";
 *
 * const parser = new XMLParser({
 *   ignoreAttributes: false,
 *   attributeNamePrefix: "@_",
 * });
 *
 * // 解析 RSS 数据
 * const rssData = await request("/some/path").rss2();
 * const parsedRSS = parser.parse(rssData);
 *
 * // JSON 格式直接可用
 * const jsonData = await request("/some/path").json();
 * console.log(jsonData.items[0].title);
 * ```
 *
 * 使用过滤参数:
 * ```typescript
 * // 过滤包含特定关键词的内容
 * const filteredFeed = await request("/weibo/user/1195230310")
 *   .filter("科技")           // 只包含"科技"相关内容
 *   .filterOut("广告")        // 排除包含"广告"的内容
 *   .get();
 *
 * // 更精细的过滤控制
 * const feed = await request("/some/path")
 *   .filterTitle("标题关键词")   // 仅过滤标题
 *   .filterDescription("描述关键词") // 仅过滤描述
 *   .filterAuthor("作者名")     // 过滤作者
 *   .filterCategory("分类名")   // 过滤分类
 *   .filterTime(3600)         // 仅显示最近一小时内的内容
 *   .get();
 * ```
 *
 * 限制条目数量:
 * ```typescript
 * // 只返回前5条内容
 * const limitedFeed = await request("/zhihu/daily")
 *   .limit(5)
 *   .get();
 * ```
 *
 * 全文输出:
 * ```typescript
 * // 获取全文内容
 * const fullContent = await request("/some/path")
 *   .fulltext()
 *   .get();
 * ```
 *
 * 格式转换:
 * ```typescript
 * // 输出 JSON 格式
 * const jsonOutput = await request("/some/path")
 *   .format("json")
 *   .get();
 *
 * // 简体转繁体
 * const traditionalChinese = await request("/some/path")
 *   .opencc("s2t")
 *   .get();
 * ```
 *
 * 缓存控制:
 * ```typescript
 * // 清除特定路径的缓存
 * request("/some/path").clearCache();
 *
 * // 清除所有缓存
 * request.clearCache();
 *
 * // 配置缓存
 * request.config({
 *   enableCache: true,
 *   cacheMaxAge: 10 * 60 * 1000, // 10分钟
 *   cacheSize: 200
 * });
 * ```
 *
 * 其他配置:
 * ```typescript
 * // 修改 RSSHub 实例地址
 * request.config({
 *   baseURL: "https://your-rsshub-instance.com",
 *   timeout: 5000 // 5秒超时
 * });
 * ```
 */

import axios, { AxiosError } from "npm:axios";
import { XMLParser } from "npm:fast-xml-parser";
import LRUCache from "npm:lru-cache";

// 类型定义
/**
 * RSSHub 客户端配置接口
 */
interface RSSHubConfig {
  /** RSSHub 实例的基础 URL */
  baseURL: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存过期时间（毫秒） */
  cacheMaxAge?: number;
  /** 缓存最大条目数 */
  cacheSize?: number;
}

/**
 * RSSHub 错误接口，扩展了标准 Error
 */
interface RSSHubError extends Error {
  /** HTTP 状态码 */
  status?: number;
  /** 请求的端点 */
  endpoint?: string;
}

// 默认配置
const defaultConfig: RSSHubConfig = {
  baseURL: "https://rsshub.app",
  timeout: 10000,
  enableCache: true,
  cacheMaxAge: 5 * 60 * 1000, // 5分钟
  cacheSize: 100,
};

// 配置和缓存实例
const config = { ...defaultConfig };
const cache = new LRUCache({
  max: config.cacheSize || 100,
  ttl: config.cacheMaxAge || 5 * 60 * 1000,
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

/**
 * 统一错误处理函数
 * @param error - 捕获的错误
 * @param endpoint - 请求的端点
 * @returns never - 总是抛出错误
 */
function handleError(error: unknown, endpoint: string): never {
  const rssError: RSSHubError = new Error(
    error instanceof Error ? error.message : "Unknown error occurred",
  );
  rssError.endpoint = endpoint;

  if (error instanceof AxiosError) {
    rssError.status = error.response?.status;
  }

  throw rssError;
}

/**
 * 解析 RSS XML 数据
 * @param raw - 原始 XML 字符串
 * @returns 解析后的 RSS 对象
 */
async function parseRSS(raw: string) {
  try {
    return parser.parse(raw);
  } catch (error) {
    throw new Error(
      `XML parsing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

class RequestSetup {
  private __path: string;
  private __cacheKey: string;
  private __params: URLSearchParams;

  /**
   * 创建一个新的请求设置实例
   * @param path - RSSHub 路径，例如 "/v2/bing/daily-wallpaper"
   */
  constructor(path: string) {
    this.__path = path;
    this.__cacheKey = `rsshub:${path}`;
    this.__params = new URLSearchParams();
  }

  /**
   * 添加内容过滤器，过滤标题和描述
   * @param pattern - 过滤模式，支持正则表达式
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 只返回包含"科技"的内容
   * request("/path").filter("科技").get();
   */
  filter(pattern: string): this {
    this.__params.set("filter", pattern);
    return this;
  }

  /**
   * 添加标题过滤器
   * @param pattern - 过滤模式，支持正则表达式
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 只返回标题包含"新闻"的内容
   * request("/path").filterTitle("新闻").get();
   */
  filterTitle(pattern: string): this {
    this.__params.set("filter_title", pattern);
    return this;
  }

  /**
   * 添加描述过滤器
   * @param pattern - 过滤模式，支持正则表达式
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 只返回描述包含"重要"的内容
   * request("/path").filterDescription("重要").get();
   */
  filterDescription(pattern: string): this {
    this.__params.set("filter_description", pattern);
    return this;
  }

  /**
   * 添加作者过滤器
   * @param pattern - 过滤模式，支持正则表达式
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 只返回特定作者的内容
   * request("/path").filterAuthor("张三").get();
   */
  filterAuthor(pattern: string): this {
    this.__params.set("filter_author", pattern);
    return this;
  }

  /**
   * 添加分类过滤器
   * @param pattern - 过滤模式，支持正则表达式
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 只返回特定分类的内容
   * request("/path").filterCategory("技术").get();
   */
  filterCategory(pattern: string): this {
    this.__params.set("filter_category", pattern);
    return this;
  }

  /**
   * 添加时间过滤器，只返回指定时间范围内的内容
   * @param seconds - 时间范围（秒）
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 只返回最近一小时的内容
   * request("/path").filterTime(3600).get();
   */
  filterTime(seconds: number): this {
    this.__params.set("filter_time", seconds.toString());
    return this;
  }

  /**
   * 添加排除过滤器，排除标题和描述中包含特定内容的条目
   * @param pattern - 排除模式，支持正则表达式
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 排除包含"广告"的内容
   * request("/path").filterOut("广告").get();
   */
  filterOut(pattern: string): this {
    this.__params.set("filterout", pattern);
    return this;
  }

  /**
   * 添加标题排除过滤器
   * @param pattern - 排除模式，支持正则表达式
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 排除标题包含"公告"的内容
   * request("/path").filterOutTitle("公告").get();
   */
  filterOutTitle(pattern: string): this {
    this.__params.set("filterout_title", pattern);
    return this;
  }

  /**
   * 添加描述排除过滤器
   * @param pattern - 排除模式，支持正则表达式
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 排除描述包含"推广"的内容
   * request("/path").filterOutDescription("推广").get();
   */
  filterOutDescription(pattern: string): this {
    this.__params.set("filterout_description", pattern);
    return this;
  }

  /**
   * 添加作者排除过滤器
   * @param pattern - 排除模式，支持正则表达式
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 排除特定作者的内容
   * request("/path").filterOutAuthor("李四").get();
   */
  filterOutAuthor(pattern: string): this {
    this.__params.set("filterout_author", pattern);
    return this;
  }

  /**
   * 添加分类排除过滤器
   * @param pattern - 排除模式，支持正则表达式
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 排除特定分类的内容
   * request("/path").filterOutCategory("娱乐").get();
   */
  filterOutCategory(pattern: string): this {
    this.__params.set("filterout_category", pattern);
    return this;
  }

  /**
   * 设置过滤是否区分大小写
   * @param sensitive - 是否区分大小写，默认为 true
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 不区分大小写的过滤
   * request("/path").filter("news").filterCaseSensitive(false).get();
   */
  filterCaseSensitive(sensitive: boolean): this {
    this.__params.set("filter_case_sensitive", sensitive ? "true" : "false");
    return this;
  }

  /**
   * 设置返回条目的最大数量
   * @param count - 最大条目数
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 只返回最多10条内容
   * request("/path").limit(10).get();
   */
  limit(count: number): this {
    this.__params.set("limit", count.toString());
    return this;
  }

  /**
   * 设置是否按发布时间排序
   * @param sort - 是否排序，默认为 true
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 不对内容进行排序
   * request("/path").sorted(false).get();
   */
  sorted(sort: boolean): this {
    this.__params.set("sorted", sort ? "true" : "false");
    return this;
  }

  /**
   * 设置全文输出模式
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 获取全文内容
   * request("/path").fulltext().get();
   */
  fulltext(): this {
    this.__params.set("mode", "fulltext");
    return this;
  }

  /**
   * 设置输出格式
   * @param type - 输出格式类型："rss", "atom", "json" 或 "rss3"
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 默认输出 RSS 2.0
   * const feed = await request("/jianshu/home").get();
   *
   * // 指定输出 RSS 2.0
   * const rssFeed = await request("/jianshu/home").format("rss").get();
   *
   * // 输出 Atom
   * const atomFeed = await request("/jianshu/home").format("atom").get();
   *
   * // 输出 JSON Feed
   * const jsonFeed = await request("/twitter/user/DIYgod").format("json").get();
   *
   * // 输出 RSS3
   * const rss3Feed = await request("/abc").format("rss3").get();
   *
   * // 和其他参数一起使用
   * const filteredFeed = await request("/bilibili/user/coin/2267573")
   *   .format("atom")
   *   .filter("微小微|赤九玖|暴走大事件")
   *   .get();
   */
  format(type: "rss" | "atom" | "json" | "rss3"): this {
    this.__params.set("format", type);
    return this;
  }

  /**
   * 设置简繁体转换
   * @param type - 转换类型："s2t"(简体转繁体) 或 "t2s"(繁体转简体)
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 简体转繁体
   * request("/path").opencc("s2t").get();
   */
  opencc(type: "s2t" | "t2s"): this {
    this.__params.set("opencc", type);
    return this;
  }

  /**
   * 设置输出简讯
   * @param wordCount - 简讯字数，必须大于等于100
   * @returns this - 返回实例自身，支持链式调用
   * @example
   * // 输出200字的简讯
   * request("/path").brief(200).get();
   */
  brief(wordCount: number): this {
    if (wordCount >= 100) {
      this.__params.set("brief", wordCount.toString());
    }
    return this;
  }

  /**
   * 发送请求并获取数据
   * @param suffix - URL后缀
   * @returns 请求结果
   * @private
   */
  private async _request(suffix: string) {
    // 构建带参数的URL
    let fullPath = `${config.baseURL}${this.__path}${suffix}`;
    const params = this.__params.toString();
    if (params) {
      fullPath += `?${params}`;
    }

    const cacheKey = `${this.__cacheKey}${suffix}:${params}`;

    // 检查缓存
    if (config.enableCache) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const response = await axios(fullPath, {
        timeout: config.timeout,
      });

      // 存储缓存
      if (config.enableCache) {
        cache.set(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      handleError(error, fullPath);
    }
  }

  /**
   * 获取 RSS 格式数据（默认方法）
   * @returns 根据指定格式返回相应的数据
   * @example
   * // 获取默认的 RSS 2.0 格式数据
   * const feed = await request("/jianshu/home").get();
   */
  get() {
    // 如果没有指定格式，默认使用 RSS 2.0
    if (!this.__params.has("format")) {
      this.__params.set("format", "rss");
    }

    return this._request("");
  }

  /**
   * 获取 RSS 2.0 格式数据
   * @returns RSS 2.0 数据
   * @example
   * // 获取 RSS 2.0 数据
   * const feed = await request("/jianshu/home").rss2();
   */
  async rss2() {
    this.__params.set("format", "rss");
    return this.get();
  }

  /**
   * 获取 Atom 格式数据
   * @returns Atom 数据
   * @example
   * // 获取 Atom 数据
   * const feed = await request("/jianshu/home").atom();
   */
  async atom() {
    this.__params.set("format", "atom");
    return this.get();
  }

  /**
   * 获取 JSON 格式数据
   * @returns JSON 数据
   * @example
   * // 获取 JSON Feed 数据
   * const feed = await request("/twitter/user/DIYgod").json();
   */
  async json() {
    this.__params.set("format", "json");
    return this.get();
  }

  /**
   * 获取 RSS3 格式数据
   * @returns RSS3 数据
   * @example
   * // 获取 RSS3 数据
   * const feed = await request("/abc").rss3();
   */
  async rss3() {
    this.__params.set("format", "rss3");
    return this.get();
  }

  /**
   * 清除此路径的所有缓存
   * @example
   * // 清除特定路径的缓存
   * request("/path").clearCache();
   */
  clearCache() {
    if (config.enableCache) {
      // 使用通配符清除所有与此路径相关的缓存
      for (const key of cache.keys()) {
        const cacheKey = String(key);
        if (cacheKey.startsWith(this.__cacheKey)) {
          cache.delete(cacheKey);
        }
      }
    }
  }
}

/**
 * 创建一个 RSSHub 请求
 * @param path - RSSHub 路径，例如 "/v2/bing/daily-wallpaper"
 * @returns RequestSetup 实例
 * @example
 * // 基本用法
 * const feed = await request("/v2/bing/daily-wallpaper").get();
 *
 * // 链式调用
 * const feed = await request("/weibo/user/1195230310")
 *   .filter("科技")
 *   .limit(5)
 *   .fulltext()
 *   .get();
 */
function request(path: string) {
  return new RequestSetup(path);
}

/**
 * 更新 RSSHub 客户端配置
 * @param values - 部分配置对象
 * @example
 * // 修改基础 URL 和超时设置
 * request.config({
 *   baseURL: "https://your-rsshub-instance.com",
 *   timeout: 5000
 * });
 *
 * // 禁用缓存
 * request.config({
 *   enableCache: false
 * });
 */
request.config = function (values: Partial<RSSHubConfig>) {
  Object.assign(config, values);

  // 更新缓存配置
  if (values.cacheSize || values.cacheMaxAge) {
    cache.reset();
  }
};

/**
 * 清除所有缓存
 * @example
 * // 清除所有缓存
 * request.clearCache();
 */
request.clearCache = function () {
  cache.clear();
};

export default request;
export type { RSSHubConfig, RSSHubError };
