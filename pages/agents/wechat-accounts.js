// pages/agents/wechat-accounts.js - 公众号管理页面
// 使用云数据库持久化存储公众号配置

const MultiAccountPublisher = require('./modules/multi-account-publisher.js');

Page({
  data: {
    accounts: [], // 公众号列表
    currentAccount: null, // 当前选中的公众号
    showAccountModal: false, // 是否显示添加/编辑弹窗
    editingAccount: null, // 正在编辑的公众号（null表示新增）
    loading: false, // 加载状态
    formData: {
      name: '',
      app_id: '',
      app_secret: '',
      avatar: ''
    }
  },

  multiAccountPublisher: null,

  onLoad(options) {
    this.multiAccountPublisher = new MultiAccountPublisher(this);
    this.loadAccounts();
  },

  onShow() {
    // 每次显示页面都刷新数据
    this.loadAccounts();
  },

  /**
   * 加载公众号列表（从云数据库）
   */
  async loadAccounts() {
    this.setData({ loading: true });

    try {
      // 使用异步方法从云数据库加载
      const accounts = await this.multiAccountPublisher.loadAccounts();
      const currentAccount = await this.multiAccountPublisher.getCurrentAccount();

      console.log('加载公众号列表:', accounts);
      console.log('当前选中公众号:', currentAccount);

      this.setData({
        accounts: accounts || [],
        currentAccount: currentAccount || null,
        loading: false
      });
    } catch (error) {
      console.error('加载公众号列表失败:', error);
      this.setData({ loading: false });
      
      // 降级使用同步方法
      const accounts = this.multiAccountPublisher.loadAccountsSync();
      const currentAccount = this.multiAccountPublisher.getCurrentAccount();

      this.setData({
        accounts: accounts || [],
        currentAccount: currentAccount || null
      });
    }
  },

  /**
   * 显示添加公众号弹窗
   */
  showAddAccountModal() {
    console.log('显示添加公众号弹窗');

    this.setData({
      showAccountModal: true,
      editingAccount: null,
      formData: {
        name: '',
        app_id: '',
        app_secret: '',
        avatar: ''
      }
    });
  },

  /**
   * 编辑公众号
   */
  editAccount(e) {
    // data-app-id 在 dataset 中变成 appId
    const app_id = e.currentTarget.dataset.appId;
    const account = this.data.accounts.find(acc => acc.app_id === app_id);

    console.log('编辑公众号:', account);

    if (!account) {
      wx.showToast({
        title: '公众号不存在',
        icon: 'none'
      });
      return;
    }

    this.setData({
      showAccountModal: true,
      editingAccount: account,
      formData: {
        name: account.name || '',
        app_id: account.app_id || '',
        app_secret: account.app_secret || '',
        avatar: account.avatar || ''
      }
    });
  },

  /**
   * 隐藏添加/编辑弹窗
   */
  hideAccountModal() {
    console.log('隐藏添加/编辑弹窗');

    this.setData({
      showAccountModal: false,
      editingAccount: null,
      formData: {
        name: '',
        app_id: '',
        app_secret: '',
        avatar: ''
      }
    });
  },

  /**
   * 表单输入处理
   */
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;

    this.setData({
      [`formData.${field}`]: value
    });
  },

  /**
   * 保存公众号（新增或更新）- 使用云数据库
   */
  async saveAccount() {
    const { name, app_id, app_secret, avatar } = this.data.formData;

    // 表单验证
    if (!name || !name.trim()) {
      wx.showToast({
        title: '请输入公众号名称',
        icon: 'none'
      });
      return;
    }

    if (!app_id || !app_id.trim()) {
      wx.showToast({
        title: '请输入AppID',
        icon: 'none'
      });
      return;
    }

    // 验证AppID格式
    if (!app_id.startsWith('wx')) {
      wx.showToast({
        title: 'AppID应以wx开头',
        icon: 'none'
      });
      return;
    }

    if (!app_secret || !app_secret.trim()) {
      wx.showToast({
        title: '请输入AppSecret',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    const accountData = {
      name: name.trim(),
      app_id: app_id.trim(),
      app_secret: app_secret.trim(),
      avatar: avatar.trim()
    };

    try {
      // 保存到云数据库
      const result = await this.multiAccountPublisher.saveAccount(accountData);

      wx.hideLoading();

      if (result.success) {
        // 设为当前选中
        await this.multiAccountPublisher.setCurrentAccount(app_id.trim());
        
        // 重新加载账号列表
        await this.loadAccounts();
        
        this.hideAccountModal();
        
        console.log('公众号已保存并选中:', accountData.name);
        
        // 提示用户
        wx.showModal({
          title: '保存成功',
          content: `「${name.trim()}」已保存并设为当前公众号，返回即可使用它发布文章。`,
          showCancel: false,
          confirmText: '知道了'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('保存公众号失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 选择公众号（设为当前使用）
   */
  async selectAccount(e) {
    // 注意：dataset 中的连字符会转为驼峰，data-app-id 变成 appId
    const app_id = e.currentTarget.dataset.appId;
    
    console.log('点击事件:', e);
    console.log('dataset:', e.currentTarget.dataset);
    console.log('点击的 app_id:', app_id);
    console.log('当前账号列表:', this.data.accounts);
    
    if (!app_id) {
      console.error('无法获取 app_id');
      wx.showToast({
        title: '选择失败，请重试',
        icon: 'none'
      });
      return;
    }
    
    const account = this.data.accounts.find(acc => acc.app_id === app_id);

    console.log('找到的公众号:', account);

    if (!account) {
      wx.showToast({
        title: '公众号不存在',
        icon: 'none'
      });
      return;
    }

    try {
      const result = await this.multiAccountPublisher.setCurrentAccount(app_id);

      if (result.success) {
        this.setData({
          currentAccount: account
        });

        wx.showToast({
          title: `已选中 ${account.name}`,
          icon: 'success',
          duration: 1500
        });

        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      }
    } catch (error) {
      console.error('选择公众号失败:', error);
      wx.showToast({
        title: '选择失败',
        icon: 'none'
      });
    }
  },

  /**
   * 删除公众号
   */
  async deleteAccount(e) {
    // data-app-id 在 dataset 中变成 appId
    const app_id = e.currentTarget.dataset.appId;
    const account = this.data.accounts.find(acc => acc.app_id === app_id);

    console.log('删除公众号:', account);

    if (!account) {
      return;
    }

    // 如果是当前选中的公众号，给出提示
    if (this.data.currentAccount && this.data.currentAccount.app_id === app_id) {
      wx.showModal({
        title: '无法删除',
        content: '这是当前正在使用的公众号，请先切换到其他公众号后再删除',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }

    try {
      await this.multiAccountPublisher.deleteAccount(app_id);
      await this.loadAccounts();
    } catch (err) {
      console.error('删除公众号失败:', err);
      wx.showToast({
        title: err.message || '删除失败',
        icon: 'none'
      });
    }
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止点击事件冒泡
  },

  /**
   * 返回发布页面
   */
  goBackToPublish() {
    console.log('返回发布页面');
    wx.navigateBack();
  },

  /**
   * 复制服务器IP地址
   */
  copyServerIP() {
    wx.setClipboardData({
      data: '39.108.254.228',
      success: () => {
        wx.showToast({
          title: 'IP已复制',
          icon: 'success',
          duration: 2000
        });
      }
    });
  }
});

/**
 * 格式化时间
 */
function formatTime(timestamp) {
  if (!timestamp) return '未知';

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }

  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }

  // 小于1天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }

  // 小于1周
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }

  // 其他情况显示日期
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
