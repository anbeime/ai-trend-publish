// 错误处理工具类
// 提供友好的错误提示和解决方案

class ErrorHandler {
  constructor() {
    // 错误类型映射
    this.errorMap = {
      // 网络错误
      'network': {
        title: '网络连接失败',
        message: '请检查网络连接后重试',
        icon: 'none',
        solutions: [
          '检查手机网络连接',
          '切换到WiFi网络',
          '稍后再试'
        ]
      },
      
      // 云函数错误
      'cloud_function': {
        title: '服务调用失败',
        message: '云服务暂时不可用，请稍后重试',
        icon: 'none',
        solutions: [
          '检查云开发环境是否正常',
          '查看云函数日志',
          '联系技术支持'
        ]
      },
      
      // API密钥错误
      'api_key': {
        title: 'API已默认可用',
        message: '使用内置GLM API，无需配置',
        icon: 'none',
        solutions: [
          '已使用默认GLM API密钥',
          '可直接使用所有功能',
          '无需额外配置'
        ]
      },
      
      // API密钥无效
      'api_key_invalid': {
        title: 'API调用失败',
        message: '使用默认API调用失败，请稍后重试',
        icon: 'none',
        solutions: [
          '检查网络连接',
          '稍后再试',
          '联系技术支持'
        ]
      },
      
      // 积分不足
      'insufficient_credits': {
        title: '积分不足',
        message: '您的创作额度已用完',
        icon: 'none',
        solutions: [
          '每日免费额度：3次',
          '使用金币：10金币/次',
          '兑换额度：50金币=3次'
        ],
        action: {
          text: '兑换额度',
          callback: 'exchangeCredits'
        }
      },
      
      // 输入为空
      'empty_input': {
        title: '请输入内容',
        message: '请输入您的创作需求',
        icon: 'none',
        solutions: [
          '描述您想要的视频内容',
          '例如：AI工具测评',
          '描述越具体效果越好'
        ]
      },
      
      // 生成失败
      'generation_failed': {
        title: '生成失败',
        message: 'AI生成内容失败，请重试',
        icon: 'none',
        solutions: [
          '检查输入内容是否合规',
          '尝试简化描述',
          '稍后再试'
        ]
      },
      
      // 图片生成失败
      'image_generation_failed': {
        title: '图片生成失败',
        message: '分镜图片生成失败',
        icon: 'none',
        solutions: [
          '检查API密钥是否有效',
          '检查提示词是否合规',
          '尝试重新生成'
        ]
      },
      
      // 超时错误
      'timeout': {
        title: '请求超时',
        message: 'AI生成时间较长，请稍后查看',
        icon: 'none',
        solutions: [
          '生成复杂内容需要更长时间',
          '可以先做其他事情',
          '稍后在历史记录中查看'
        ]
      },
      
      // 权限错误
      'permission_denied': {
        title: '权限不足',
        message: '您没有权限执行此操作',
        icon: 'none',
        solutions: [
          '检查是否已登录',
          '检查云开发权限设置',
          '联系管理员'
        ]
      },
      
      // 数据库错误
      'database_error': {
        title: '数据保存失败',
        message: '数据库操作失败',
        icon: 'none',
        solutions: [
          '检查数据库权限设置',
          '查看云开发控制台',
          '稍后重试'
        ]
      },
      
      // 未知错误
      'unknown': {
        title: '操作失败',
        message: '发生未知错误，请重试',
        icon: 'none',
        solutions: [
          '重启小程序',
          '清除缓存后重试',
          '联系技术支持'
        ]
      }
    };
  }

  /**
   * 处理错误并显示友好提示
   * @param {Error|String} error - 错误对象或错误类型
   * @param {Object} options - 额外选项
   */
  handle(error, options = {}) {
    console.error('错误处理:', error);

    let errorType = 'unknown';
    let errorMessage = '';

    // 判断错误类型
    if (typeof error === 'string') {
      errorType = error;
    } else if (error instanceof Error) {
      errorMessage = error.message || '';
      errorType = this.detectErrorType(error);
    } else if (error && error.errMsg) {
      errorMessage = error.errMsg;
      errorType = this.detectErrorType(error);
    }

    const errorConfig = this.errorMap[errorType] || this.errorMap['unknown'];

    // 显示错误提示
    if (options.showToast !== false) {
      wx.showToast({
        title: errorConfig.message,
        icon: errorConfig.icon || 'none',
        duration: 2500
      });
    }

    // 如果有详细解决方案，显示对话框
    if (options.showDetail) {
      this.showDetailDialog(errorConfig, options);
    }

    // 返回错误配置供调用者使用
    return {
      type: errorType,
      config: errorConfig,
      originalError: error
    };
  }

  /**
   * 检测错误类型
   */
  detectErrorType(error) {
    const errorMsg = error.message || error.errMsg || '';

    // 网络错误
    if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('连接')) {
      return 'network';
    }

    // 云函数错误
    if (errorMsg.includes('cloud function') || errorMsg.includes('云函数')) {
      return 'cloud_function';
    }

    // API密钥错误
    if (errorMsg.includes('API key') || errorMsg.includes('api_key') || errorMsg.includes('密钥')) {
      if (errorMsg.includes('invalid') || errorMsg.includes('无效')) {
        return 'api_key_invalid';
      }
      return 'api_key';
    }

    // 积分不足
    if (errorMsg.includes('credit') || errorMsg.includes('积分') || errorMsg.includes('额度')) {
      return 'insufficient_credits';
    }

    // 权限错误
    if (errorMsg.includes('permission') || errorMsg.includes('权限')) {
      return 'permission_denied';
    }

    // 数据库错误
    if (errorMsg.includes('database') || errorMsg.includes('数据库')) {
      return 'database_error';
    }

    // 超时错误
    if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
      return 'timeout';
    }

    return 'unknown';
  }

  /**
   * 显示详细错误对话框
   */
  showDetailDialog(errorConfig, options = {}) {
    const solutions = errorConfig.solutions || [];
    const content = `${errorConfig.message}\n\n解决方案：\n${solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

    const modalOptions = {
      title: errorConfig.title,
      content: content,
      showCancel: !!errorConfig.action,
      confirmText: errorConfig.action ? errorConfig.action.text : '知道了',
      success: (res) => {
        if (res.confirm && errorConfig.action) {
          if (errorConfig.action.url) {
            wx.navigateTo({ url: errorConfig.action.url });
          } else if (errorConfig.action.callback && options.context) {
            const callback = options.context[errorConfig.action.callback];
            if (typeof callback === 'function') {
              callback.call(options.context);
            }
          }
        }
      }
    };

    wx.showModal(modalOptions);
  }

  /**
   * 快捷方法：显示网络错误
   */
  showNetworkError() {
    return this.handle('network', { showDetail: true });
  }

  /**
   * 快捷方法：显示API密钥错误
   */
  showApiKeyError() {
    return this.handle('api_key', { showDetail: true });
  }

  /**
   * 快捷方法：显示积分不足错误
   */
  showInsufficientCreditsError(context) {
    return this.handle('insufficient_credits', { showDetail: true, context });
  }

  /**
   * 快捷方法：显示生成失败错误
   */
  showGenerationError() {
    return this.handle('generation_failed', { showDetail: true });
  }
}

// 创建单例
const errorHandler = new ErrorHandler();

module.exports = errorHandler;
