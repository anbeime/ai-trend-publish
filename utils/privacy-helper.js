/**
 * 隐私接口授权工具
 * 用于在小程序中调用隐私接口前进行授权检查
 * 
 * 隐私接口范围：
 * - saveImageToPhotosAlbum（保存图片到相册）
 * - setClipboardData / getClipboardData（读写剪切板）
 * - chooseImage / chooseMedia（选择相册图片）
 * - getFileSystemManager（文件系统）
 */

/**
 * 检查并请求隐私授权
 * 在调用隐私接口前调用此方法，确保用户已同意隐私协议
 * 
 * @param {string} scope - 隐私接口名称，如 'wx.saveImageToPhotosAlbum'
 * @returns {Promise<boolean>} 用户是否已授权
 */
function checkPrivacyAuthorization(scope) {
  return new Promise((resolve) => {
    // 检查是否支持隐私检查（基础库 2.32.3 以上）
    if (typeof wx.requirePrivacyAuthorize !== 'function') {
      // 不支持隐私检查，直接放行
      resolve(true);
      return;
    }

    wx.requirePrivacyAuthorize({
      success() {
        resolve(true);
      },
      fail(err) {
        console.warn('隐私授权检查失败:', err);
        // 如果用户拒绝，弹出隐私协议说明
        wx.showModal({
          title: '隐私授权提示',
          content: '为了使用此功能，需要您同意隐私协议中关于相册和剪切板的使用授权。',
          confirmText: '去设置',
          cancelText: '取消',
          success(res) {
            if (res.confirm) {
              wx.openPrivacySetting({
                success() {
                  resolve(true);
                },
                fail() {
                  resolve(false);
                }
              });
            } else {
              resolve(false);
            }
          }
        });
      }
    });
  });
}

/**
 * 安全调用：保存图片到相册
 * 自带隐私授权检查
 * 
 * @param {string} filePath - 图片文件路径
 * @returns {Promise<void>}
 */
function saveImageToPhotosAlbum(filePath) {
  return new Promise((resolve, reject) => {
    checkPrivacyAuthorization('wx.saveImageToPhotosAlbum').then(authorized => {
      if (!authorized) {
        reject(new Error('用户未授权隐私协议'));
        return;
      }
      wx.saveImageToPhotosAlbum({
        filePath: filePath,
        success: resolve,
        fail: reject
      });
    });
  });
}

/**
 * 安全调用：写入剪切板
 * 自带隐私授权检查
 * 
 * @param {string} data - 要复制到剪切板的内容
 * @returns {Promise<void>}
 */
function setClipboardData(data) {
  return new Promise((resolve, reject) => {
    checkPrivacyAuthorization('wx.setClipboardData').then(authorized => {
      if (!authorized) {
        reject(new Error('用户未授权隐私协议'));
        return;
      }
      wx.setClipboardData({
        data: data,
        success: resolve,
        fail: reject
      });
    });
  });
}

/**
 * 安全调用：读取剪切板
 * 自带隐私授权检查
 * 
 * @returns {Promise<{data: string}>}
 */
function getClipboardData() {
  return new Promise((resolve, reject) => {
    checkPrivacyAuthorization('wx.getClipboardData').then(authorized => {
      if (!authorized) {
        reject(new Error('用户未授权隐私协议'));
        return;
      }
      wx.getClipboardData({
        success: resolve,
        fail: reject
      });
    });
  });
}

/**
 * 安全调用：选择图片
 * 自带隐私授权检查
 * 
 * @param {Object} options - wx.chooseImage 参数
 * @returns {Promise<Object>}
 */
function chooseImage(options = {}) {
  return new Promise((resolve, reject) => {
    checkPrivacyAuthorization('wx.chooseImage').then(authorized => {
      if (!authorized) {
        reject(new Error('用户未授权隐私协议'));
        return;
      }
      wx.chooseImage({
        ...options,
        success: resolve,
        fail: reject
      });
    });
  });
}

/**
 * 安全调用：选择媒体（图片/视频）
 * 自带隐私授权检查
 * 
 * @param {Object} options - wx.chooseMedia 参数
 * @returns {Promise<Object>}
 */
function chooseMedia(options = {}) {
  return new Promise((resolve, reject) => {
    checkPrivacyAuthorization('wx.chooseMedia').then(authorized => {
      if (!authorized) {
        reject(new Error('用户未授权隐私协议'));
        return;
      }
      wx.chooseMedia({
        ...options,
        success: resolve,
        fail: reject
      });
    });
  });
}

module.exports = {
  checkPrivacyAuthorization,
  saveImageToPhotosAlbum,
  setClipboardData,
  getClipboardData,
  chooseImage,
  chooseMedia
};
