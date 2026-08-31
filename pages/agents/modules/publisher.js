// publisher.js - 推送文章到服务器模块
// 优先使用云函数代理（解决手机端HTTP域名白名单限制），降级到直接请求

class Publisher {
  constructor(pageContext) {
    this.page = pageContext;
    // 服务器地址（降级时使用，仅在开发者工具中有效）
    this.serverUrl = 'http://39.108.254.228:8002';
    this.publishEndpoint = '/publish-draft';
    this.timeout = 120000; // 120秒超时
  }

  /**
   * 推送文章到发布服务器
   * 优先使用云函数代理，降级到直接请求
   * @param {Object} article - 文章数据
   * @param {string} article.title - 文章标题
   * @param {string} article.content - HTML内容
   * @param {string} article.cover_url - 封面图URL
   * @returns {Promise} 推送结果
   */
  async publishArticle(article) {
    console.log('推送文章到服务器:', article.title);

    // 构建请求数据
    const requestData = {
      title: article.title,
      content: article.content,
      cover_url: article.cover_url || ''
    };

    console.log('请求数据:', {
      title: requestData.title,
      contentLength: requestData.content.length,
      cover_url: requestData.cover_url
    });

    // 优先使用云函数代理（云函数超时60秒，支持重试）
    const MAX_RETRIES = 2;
    let retryCount = 0;
    let lastError = null;

    while (retryCount <= MAX_RETRIES) {
      try {
        if (retryCount > 0) {
          console.log(`推送重试第 ${retryCount} 次...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log('通过云函数 social-media-proxy 代理推送文章');

        const res = await wx.cloud.callFunction({
          name: 'social-media-proxy',
          data: {
            action: 'publish-draft',
            data: requestData
          }
        });

        console.log('云函数代理推送响应:', res.result);

        const result = res.result;
        if (result.success) {
          const apiData = result.data;
          if (apiData && (apiData.success === true || apiData.media_id)) {
            return {
              success: true,
              data: apiData,
              statusCode: 200
            };
          } else {
            // 云函数代理成功但后端API返回失败
            throw new Error(apiData?.error || result.error || '发布失败');
          }
        } else {
          // 检查是否是超时错误
          const isTimeout = result.isTimeout ||
            (result.error && (result.error.includes('timeout') || result.error.includes('超时')));

          if (isTimeout && retryCount < MAX_RETRIES) {
            lastError = result.error || '后端API响应超时';
            retryCount++;
            continue;
          }

          throw new Error(result.error || '云函数代理发布失败');
        }
      } catch (cloudError) {
        console.error('云函数代理推送失败:', cloudError.message);

        // 检查是否是云函数超时错误
        const errMsg = cloudError.errMsg || cloudError.message || '';
        const isCloudTimeout = errMsg.includes('-504003') || errMsg.includes('timed out') || errMsg.includes('FUNCTIONS_TIME_LIMIT');

        if (isCloudTimeout && retryCount < MAX_RETRIES) {
          lastError = errMsg;
          retryCount++;
          continue;
        }

        return {
          success: false,
          error: isCloudTimeout
            ? '云函数执行超时，请稍后检查草稿箱确认是否已发布'
            : (cloudError.message || '云函数代理发布失败，请检查云函数是否已部署')
        };
      }
    }

    // 所有重试都失败了
    return {
      success: false,
      error: lastError || '发布超时，请稍后检查草稿箱确认是否已发布'
    };
  }

  /**
   * 健康检查
   * 优先通过云函数代理
   * @returns {Promise} 健康检查结果
   */
  async healthCheck() {
    console.log('健康检查（通过云函数代理）...');

    try {
      const res = await wx.cloud.callFunction({
        name: 'social-media-proxy',
        data: {
          action: 'health',
          data: {}
        }
      });

      console.log('云函数健康检查响应:', res.result);
      return {
        success: res.result?.success || false,
        data: res.result?.apiStatus || res.result,
        statusCode: res.result?.success ? 200 : 503
      };
    } catch (error) {
      console.error('云函数健康检查失败:', error);
      return {
        success: false,
        error: error.message || '云函数健康检查失败，请检查云函数是否已部署'
      };
    }
  }

  /**
   * 完整流程：获取热点 -> 生成文章 -> 推送
   * @param {Object} hotTopic - 热点话题
   * @returns {Promise} 完整流程结果
   */
  async completeWorkflow(hotTopic) {
    try {
      console.log('========== 完整流程开始 ==========');

      // 步骤1：健康检查
      console.log('1. 健康检查...');
      const health = await this.healthCheck();
      console.log('   服务器状态:', health.success ? '正常' : '异常');

      // 步骤2：生成文章
      console.log('2. 生成文章...');
      const ArticleGenerator = require('./article-generator.js');
      const articleGen = new ArticleGenerator(this.page);
      const article = articleGen.generateArticleHTML(hotTopic);
      console.log('   文章生成成功');
      console.log('   标题:', article.title);
      console.log('   内容长度:', article.content.length);

      // 步骤3：推送文章
      console.log('3. 推送文章...');
      const publishResult = await this.publishArticle(article);
      console.log('   推送成功');

      const result = {
        success: true,
        hotTopic: hotTopic,
        article: {
          title: article.title,
          contentLength: article.content.length,
          cover_url: article.cover_url
        },
        publishResult: publishResult
      };

      console.log('========== 流程完成 ==========');
      return result;

    } catch (err) {
      console.error('完整流程失败:', err);
      return {
        success: false,
        error: err.message,
        hotTopic: hotTopic
      };
    }
  }

  /**
   * 批量推送文章
   * @param {Array} articles - 文章数组
   * @returns {Promise} 批量推送结果
   */
  async batchPublish(articles) {
    console.log(`批量推送 ${articles.length} 篇文章...`);

    const results = [];
    const errors = [];

    for (let i = 0; i < articles.length; i++) {
      console.log(`\n推送第 ${i + 1}/${articles.length} 篇...`);

      try {
        const result = await this.publishArticle(articles[i]);
        results.push({
          index: i,
          success: true,
          data: result
        });
      } catch (err) {
        console.error(`第 ${i + 1} 篇推送失败:`, err);
        errors.push({
          index: i,
          success: false,
          error: err.message
        });
      }

      // 延迟1秒，避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      total: articles.length,
      success: results.length,
      failed: errors.length,
      results: results,
      errors: errors
    };
  }
}

module.exports = Publisher;
