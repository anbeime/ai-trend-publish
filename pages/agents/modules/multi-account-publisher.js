// multi-account-publisher.js - 多账号公众号发布模块
// 支持切换不同公众号进行发布，使用云数据库持久化存储

class MultiAccountPublisher {
  constructor(pageContext) {
    this.page = pageContext;
    // 多账号发布服务地址（通过服务器 IP，因为微信 IP 白名单需要）
    this.serverUrl = 'http://39.108.254.228:8002';
    // API 端点
    this.publishEndpoint = '/publish-draft';
    this.healthEndpoint = '/health-multi';
    this.timeout = 120000; // 120秒超时

    // 本地缓存（用于快速访问）
    this._accountsCache = null;
    this._selectedCache = null;
  }

  /**
   * 调用云函数
   * @param {string} action - 操作类型
   * @param {Object} data - 参数数据
   */
  async callCloudFunction(action, data = {}) {
    // 获取或创建用户标识（用于解决云函数 openid 为 undefined 的问题）
    let userOpenId = wx.getStorageSync('user_openid');
    if (!userOpenId) {
      // 生成一个唯一的用户标识
      userOpenId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      wx.setStorageSync('user_openid', userOpenId);
      console.log('创建新用户标识:', userOpenId);
    }
    
    // 通过 cloud-shim 路由到服务器 API
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'wechat-account-manager',
        data: { action, ...data, clientOpenId: userOpenId },
        success: (res) => {
          console.log('[MultiAccount] 调用成功:', action, res.result);
          resolve(res.result);
        },
        fail: (err) => {
          console.error('[MultiAccount] 调用失败:', action, err);
          reject(err);
        }
      });
    });
  }

  /**
   * 加载公众号配置列表（从云数据库）
   */
  async loadAccounts() {
    try {
      const result = await this.callCloudFunction('getAccounts');
      
      if (result.success) {
        this._accountsCache = result.data;
        console.log('从云数据库加载公众号配置:', result.data.length, '个');
        return result.data;
      } else {
        console.error('加载公众号配置失败:', result.message);
        return [];
      }
    } catch (error) {
      console.error('加载公众号配置异常:', error);
      // 降级到本地存储
      const localAccounts = wx.getStorageSync('wechat_accounts') || [];
      console.log('降级使用本地存储:', localAccounts.length, '个');
      return localAccounts;
    }
  }

  /**
   * 同步加载（兼容旧代码，返回本地缓存或空数组）
   */
  loadAccountsSync() {
    if (this._accountsCache) {
      return this._accountsCache;
    }
    // 返回本地存储作为降级
    return wx.getStorageSync('wechat_accounts') || [];
  }

  /**
   * 保存公众号配置到云数据库
   * @param {Object} account - 公众号配置
   */
  async saveAccount(account) {
    try {
      const result = await this.callCloudFunction('saveAccount', { account });
      
      if (result.success) {
        // 更新本地缓存
        await this.loadAccounts();
        wx.showToast({
          title: result.message || '保存成功',
          icon: 'success',
          duration: 1500
        });
        return result;
      } else {
        throw new Error(result.message || '保存失败');
      }
    } catch (error) {
      console.error('保存公众号配置失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none',
        duration: 2000
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除公众号配置
   * @param {string} app_id - 要删除的公众号AppID
   */
  async deleteAccount(app_id) {
    return new Promise((resolve, reject) => {
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个公众号配置吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await this.callCloudFunction('deleteAccount', { app_id });
              
              if (result.success) {
                // 更新本地缓存
                await this.loadAccounts();
                wx.showToast({
                  title: '删除成功',
                  icon: 'success',
                  duration: 1500
                });
                resolve(result);
              } else {
                throw new Error(result.message);
              }
            } catch (error) {
              console.error('删除公众号配置失败:', error);
              reject(error);
            }
          } else {
            resolve({ success: false, canceled: true });
          }
        },
        fail: reject
      });
    });
  }

  /**
   * 获取当前选中的公众号
   */
  async getCurrentAccount() {
    try {
      // 先检查本地缓存
      if (this._selectedCache) {
        return this._selectedCache;
      }

      const result = await this.callCloudFunction('getSelected');
      
      if (result.success) {
        this._selectedCache = result.data;
        return result.data;
      } else {
        console.log('没有选中的公众号');
        return null;
      }
    } catch (error) {
      console.error('获取当前公众号失败:', error);
      // 降级到本地存储
      const currentAppId = wx.getStorageSync('current_wechat_app_id');
      const accounts = this.loadAccountsSync();
      return accounts.find(acc => acc.app_id === currentAppId) || null;
    }
  }

  /**
   * 设置当前选中的公众号
   * @param {string} app_id - 公众号AppID
   */
  async setCurrentAccount(app_id) {
    try {
      const result = await this.callCloudFunction('setSelected', { app_id });
      
      if (result.success) {
        // 更新本地缓存
        const accounts = this._accountsCache || await this.loadAccounts();
        this._selectedCache = accounts.find(acc => acc.app_id === app_id);
        
        // 同时保存到本地存储作为备份
        wx.setStorageSync('current_wechat_app_id', app_id);
        
        console.log('设置当前公众号成功:', this._selectedCache?.name);
        return { success: true, account: this._selectedCache };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('设置当前公众号失败:', error);
      // 降级到本地存储
      wx.setStorageSync('current_wechat_app_id', app_id);
      const accounts = this.loadAccountsSync();
      const account = accounts.find(acc => acc.app_id === app_id);
      return { success: true, account };
    }
  }

  /**
   * 发布文章到指定公众号
   * @param {Object} article - 文章数据
   * @param {string} article.title - 文章标题
   * @param {string} article.content - HTML内容
   * @param {string} article.cover_url - 封面图URL
   * @param {string} app_id - 公众号AppID（可选，不传则使用当前选中的公众号）
   * @returns {Promise} 发布结果
   */
  async publishToAccount(article, app_id = null) {
    // 确定要发布的公众号
    let targetAppId = app_id;
    
    if (!targetAppId) {
      const selectedAccount = await this.getCurrentAccount();
      targetAppId = selectedAccount?.app_id;
    }

    if (!targetAppId) {
      return {
        success: false,
        error: '请先选择要发布的公众号'
      };
    }

    // 获取公众号配置
    const accounts = await this.loadAccounts();
    const account = accounts.find(acc => acc.app_id === targetAppId);

    if (!account) {
      return {
        success: false,
        error: '公众号配置不存在，请重新添加'
      };
    }

    console.log('发布到公众号:', account.name);
    console.log('文章标题:', article.title);

    // 使用云函数代理发布（解决手机端HTTP域名白名单限制）
    // 云函数超时60秒，后端API可能需要较长时间处理
    const MAX_RETRIES = 2; // 最大重试次数
    let retryCount = 0;
    let lastError = null;

    while (retryCount <= MAX_RETRIES) {
      try {
        if (retryCount > 0) {
          console.log(`发布重试第 ${retryCount} 次...`);
          wx.showLoading({ title: `重试中(${retryCount}/${MAX_RETRIES})...`, mask: true });
          // 重试前等待2秒
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const requestData = {
          title: article.title,
          content: article.content,
          cover_url: article.cover_url || '',
          wechat_app_id: account.app_id,
          wechat_app_secret: account.app_secret,
          source: '小程序多账号发布'
        };

        console.log('通过云函数 social-media-proxy 代理发布');
        console.log('发布请求数据:', {
          title: requestData.title,
          contentLength: requestData.content ? requestData.content.length : 0,
          hasCover: !!requestData.cover_url,
          wechat_app_id: requestData.wechat_app_id ? requestData.wechat_app_id.substring(0, 8) + '...' : 'N/A'
        });

        const res = await wx.cloud.callFunction({
          name: 'social-media-proxy',
          data: {
            action: 'publish-multi',
            data: requestData
          }
        });

        console.log('云函数代理发布响应:', res.result);

        const result = res.result;
        if (result.success) {
          // 检查后端API返回的实际结果
          const apiData = result.data;
          if (apiData && apiData.success === true) {
            return {
              success: true,
              data: apiData,
              account: account,
              media_id: apiData.media_id
            };
          } else {
            return {
              success: false,
              error: apiData?.error || result.error || '发布失败'
            };
          }
        } else {
          // 检查是否是超时错误，决定是否重试
          const isTimeout = result.isTimeout || 
            (result.error && (result.error.includes('timeout') || result.error.includes('超时')));
          
          if (isTimeout && retryCount < MAX_RETRIES) {
            lastError = result.error || '云函数代理发布超时';
            retryCount++;
            continue;
          }
          
          return {
            success: false,
            error: result.error || '云函数代理发布失败'
          };
        }
      } catch (error) {
        console.error('云函数代理发布异常:', error);
        
        // 检查是否是云函数超时错误
        const errMsg = error.errMsg || error.message || '';
        const isCloudTimeout = errMsg.includes('-504003') || errMsg.includes('timed out') || errMsg.includes('FUNCTIONS_TIME_LIMIT');
        
        if (isCloudTimeout && retryCount < MAX_RETRIES) {
          lastError = errMsg;
          retryCount++;
          continue;
        }
        
        return {
          success: false,
          error: isCloudTimeout 
            ? '云函数执行超时，请检查网络后重试（发布操作可能仍在后台执行）'
            : errMsg || '云函数代理发布失败，请检查云函数是否已部署'
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
   * @returns {Promise} 健康检查结果
   */
  async healthCheck() {
    console.log('多账号发布服务健康检查（通过云函数代理）...');

    try {
      const res = await wx.cloud.callFunction({
        name: 'social-media-proxy',
        data: {
          action: 'health',
          data: {}
        }
      });

      console.log('健康检查响应:', res.result);
      return {
        success: res.result?.success || false,
        data: res.result?.apiStatus || res.result,
        statusCode: res.result?.success ? 200 : 503
      };
    } catch (error) {
      console.error('云函数健康检查失败:', error);
      return {
        success: false,
        error: error.errMsg || error.message || '云函数健康检查失败，请检查云函数是否已部署'
      };
    }
  }

  /**
   * 批量发布到多个公众号
   * @param {Object} article - 文章数据
   * @param {Array} app_ids - 公众号AppID数组
   * @returns {Promise} 批量发布结果
   */
  async batchPublish(article, app_ids = null) {
    // 如果未指定公众号，则发布到所有已配置的公众号
    let targetAppIds = app_ids;

    if (!targetAppIds) {
      const accounts = await this.loadAccounts();
      targetAppIds = accounts.map(acc => acc.app_id);
    }

    if (targetAppIds.length === 0) {
      return {
        success: false,
        error: '没有可用的公众号配置'
      };
    }

    console.log(`批量发布到 ${targetAppIds.length} 个公众号...`);

    const results = [];
    const errors = [];

    for (let i = 0; i < targetAppIds.length; i++) {
      const app_id = targetAppIds[i];
      console.log(`\n发布到第 ${i + 1}/${targetAppIds.length} 个公众号...`);

      try {
        const result = await this.publishToAccount(article, app_id);
        results.push({
          app_id: app_id,
          success: true,
          data: result
        });
      } catch (err) {
        console.error(`发布到公众号 ${app_id} 失败:`, err);
        errors.push({
          app_id: app_id,
          success: false,
          error: err.message
        });
      }

      // 延迟1秒，避免请求过于频繁
      if (i < targetAppIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      total: targetAppIds.length,
      success: results.length,
      failed: errors.length,
      results: results,
      errors: errors
    };
  }
}

module.exports = MultiAccountPublisher;
