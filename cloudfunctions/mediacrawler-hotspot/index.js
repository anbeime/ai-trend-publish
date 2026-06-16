// 云函数：mediacrawler-hotspot
// 集成MediaCrawler爬虫，获取各大平台热点数据
const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// MediaCrawler API配置
const MEDIACRAWLER_API_BASE = process.env.MEDIACRAWLER_API_URL || 'http://localhost:8080/api';

/**
 * 调用MediaCrawler API启动爬虫任务
 * @param {Object} config - 爬虫配置
 * @returns {Promise<Object>} 爬虫结果
 */
async function startCrawler(config) {
  try {
    const response = await axios.post(`${MEDIACRAWLER_API_BASE}/crawler/start`, config, {
      timeout: 60000 // 60秒超时
    });
    return response.data;
  } catch (error) {
    console.error('启动爬虫失败:', error.message);
    throw error;
  }
}

/**
 * 获取爬虫状态
 * @returns {Promise<Object>} 爬虫状态
 */
async function getCrawlerStatus() {
  try {
    const response = await axios.get(`${MEDIACRAWLER_API_BASE}/crawler/status`);
    return response.data;
  } catch (error) {
    console.error('获取爬虫状态失败:', error.message);
    throw error;
  }
}

/**
 * 获取爬取的数据
 * @param {Object} params - 查询参数
 * @returns {Promise<Array>} 数据列表
 */
async function getCrawledData(params) {
  try {
    const response = await axios.get(`${MEDIACRAWLER_API_BASE}/data/list`, {
      params: params
    });
    return response.data;
  } catch (error) {
    console.error('获取数据失败:', error.message);
    throw error;
  }
}

/**
 * 从小红书爬取热点
 * @param {string} keyword - 搜索关键词
 * @param {number} maxCount - 最大爬取数量
 * @returns {Promise<Array>} 热点数据
 */
async function crawlXiaohongshu(keyword = '热点', maxCount = 20) {
  const config = {
    platform: 'xhs',
    login_type: 'cookie',
    crawler_type: 'search',
    keywords: keyword,
    start_page: 1,
    crawler_max_notes_count: maxCount,
    enable_get_comments: false,
    enable_get_sub_comments: false,
    save_data_option: 'json'
  };

  await startCrawler(config);
  
  // 等待爬虫完成（轮询状态）
  let attempts = 0;
  const maxAttempts = 30; // 最多等待30次，每次2秒
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 等待2秒
    const status = await getCrawlerStatus();
    
    if (status.status === 'idle') {
      // 爬虫完成，获取数据
      const data = await getCrawledData({ platform: 'xhs', limit: maxCount });
      return data;
    }
    
    attempts++;
  }
  
  throw new Error('爬虫超时');
}

/**
 * 从抖音爬取热点
 * @param {string} keyword - 搜索关键词
 * @param {number} maxCount - 最大爬取数量
 * @returns {Promise<Array>} 热点数据
 */
async function crawlDouyin(keyword = '热点', maxCount = 20) {
  const config = {
    platform: 'dy',
    login_type: 'cookie',
    crawler_type: 'search',
    keywords: keyword,
    start_page: 1,
    crawler_max_notes_count: maxCount,
    enable_get_comments: false,
    enable_get_sub_comments: false,
    save_data_option: 'json'
  };

  await startCrawler(config);
  
  // 等待爬虫完成
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const status = await getCrawlerStatus();
    
    if (status.status === 'idle') {
      const data = await getCrawledData({ platform: 'dy', limit: maxCount });
      return data;
    }
    
    attempts++;
  }
  
  throw new Error('爬虫超时');
}

/**
 * 从B站爬取热点
 * @param {string} keyword - 搜索关键词
 * @param {number} maxCount - 最大爬取数量
 * @returns {Promise<Array>} 热点数据
 */
async function crawlBilibili(keyword = '热点', maxCount = 20) {
  const config = {
    platform: 'bili',
    login_type: 'cookie',
    crawler_type: 'search',
    keywords: keyword,
    start_page: 1,
    crawler_max_notes_count: maxCount,
    enable_get_comments: false,
    enable_get_sub_comments: false,
    save_data_option: 'json'
  };

  await startCrawler(config);
  
  // 等待爬虫完成
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const status = await getCrawlerStatus();
    
    if (status.status === 'idle') {
      const data = await getCrawledData({ platform: 'bili', limit: maxCount });
      return data;
    }
    
    attempts++;
  }
  
  throw new Error('爬虫超时');
}

/**
 * 转换爬取数据为热点格式
 * @param {Array} rawData - 原始数据
 * @param {string} platform - 平台名称
 * @returns {Array} 热点数据
 */
function convertToHotspots(rawData, platform) {
  const platformNames = {
    'xhs': '小红书',
    'dy': '抖音',
    'bili': 'B站',
    'wb': '微博',
    'zhihu': '知乎'
  };

  return rawData.map((item, index) => ({
    name: item.title || item.desc || item.content,
    reason: `${platformNames[platform] || platform}热点`,
    heat: item.liked_count || item.view_count || item.share_count || 0,
    url: item.note_url || item.video_url || item.url || '',
    source: platform,
    index: index + 1,
    author: item.author_name || item.nickname || '',
    publishTime: item.publish_time || item.create_time || '',
    tags: item.tags || []
  }));
}

/**
 * 云函数主入口
 */
exports.main = async (event, context) => {
  const { 
    platform = 'all',  // 平台：xhs, dy, bili, all
    keyword = '热点',   // 搜索关键词
    limit = 20         // 最大数量
  } = event;

  try {
    console.log(`开始爬取热点 - 平台: ${platform}, 关键词: ${keyword}, 数量: ${limit}`);

    let allHotspots = [];

    // 根据平台选择爬取
    if (platform === 'all') {
      // 爬取所有平台
      const [xhsData, dyData, biliData] = await Promise.allSettled([
        crawlXiaohongshu(keyword, Math.ceil(limit / 3)),
        crawlDouyin(keyword, Math.ceil(limit / 3)),
        crawlBilibili(keyword, Math.ceil(limit / 3))
      ]);

      if (xhsData.status === 'fulfilled') {
        allHotspots.push(...convertToHotspots(xhsData.value, 'xhs'));
      }
      if (dyData.status === 'fulfilled') {
        allHotspots.push(...convertToHotspots(dyData.value, 'dy'));
      }
      if (biliData.status === 'fulfilled') {
        allHotspots.push(...convertToHotspots(biliData.value, 'bili'));
      }
    } else if (platform === 'xhs') {
      const data = await crawlXiaohongshu(keyword, limit);
      allHotspots = convertToHotspots(data, 'xhs');
    } else if (platform === 'dy') {
      const data = await crawlDouyin(keyword, limit);
      allHotspots = convertToHotspots(data, 'dy');
    } else if (platform === 'bili') {
      const data = await crawlBilibili(keyword, limit);
      allHotspots = convertToHotspots(data, 'bili');
    } else {
      throw new Error(`不支持的平台: ${platform}`);
    }

    // 按热度排序
    allHotspots.sort((a, b) => b.heat - a.heat);

    // 限制返回数量
    const result = allHotspots.slice(0, limit);

    console.log(`成功获取 ${result.length} 个热点`);

    return {
      success: true,
      data: result,
      count: result.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('爬取热点失败:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      timestamp: new Date().toISOString()
    };
  }
};
