// pages/database-init/database-init.js
Page({
  data: {
    loading: false,
    status: '',
    collections: [
      { name: 'creation_history', description: '创作历史记录', status: 'unknown' },
      { name: 'user_credits', description: '用户积分', status: 'unknown' },
      { name: 'memberships', description: '会员信息', status: 'unknown' },
      { name: 'orders', description: '订单记录', status: 'unknown' },
      { name: 'projects', description: '项目管理', status: 'unknown' },
      { name: 'templates', description: '模板管理', status: 'unknown' },
      { name: 'wechat_accounts', description: '公众号配置', status: 'unknown' },
    ],
    logs: []
  },

  onLoad() {
    this.checkCollections();
  },

  // 检查集合状态
  async checkCollections() {
    this.setData({ loading: true, status: '正在检查数据库集合...' });
    
    const logs = [];
    const collections = [...this.data.collections];
    
    for (let i = 0; i < collections.length; i++) {
      const collection = collections[i];
      
      try {
        // 尝试查询集合是否存在
        const result = await wx.cloud.database().collection(collection.name).count();
        collection.status = 'exists';
        logs.push(`✅ ${collection.name} 集合已存在 (${result.total} 条记录)`);
      } catch (error) {
        if (error.errCode === -502005) {
          // 集合不存在
          collection.status = 'missing';
          logs.push(`❌ ${collection.name} 集合不存在`);
        } else {
          collection.status = 'error';
          logs.push(`⚠️ ${collection.name} 检查失败: ${error.message}`);
        }
      }
      
      // 更新UI
      this.setData({ collections, logs });
      await this.sleep(200); // 避免请求过快
    }
    
    this.setData({ loading: false, status: '检查完成' });
  },

  // 初始化所有集合
  async initAllCollections() {
    this.setData({ loading: true, status: '正在初始化数据库集合...' });
    
    const logs = ['=== 开始初始化数据库集合 ==='];
    const collections = [...this.data.collections];
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'init-collections'
      });
      
      if (result.result && result.result.success) {
        logs.push('✅ 数据库初始化成功');
        
        // 更新集合状态
        for (const item of result.result.results || []) {
          const index = collections.findIndex(c => c.name === item.collection);
          if (index !== -1) {
            collections[index].status = item.status === 'created' ? 'created' : 'exists';
            logs.push(`✅ ${item.collection}: ${item.status === 'created' ? '创建成功' : '已存在'}`);
          }
        }
      } else {
        logs.push('❌ 数据库初始化失败: ' + (result.result?.message || '未知错误'));
      }
    } catch (error) {
      logs.push('❌ 调用初始化云函数失败: ' + error.message);
    }
    
    this.setData({ collections, logs, loading: false, status: '初始化完成' });
  },

  // 初始化单个集合
  async initCollection(e) {
    const name = e.currentTarget.dataset.name;
    const description = e.currentTarget.dataset.description;
    
    wx.showModal({
      title: '确认初始化',
      content: `确定要初始化 "${description}" (${name}) 集合吗？`,
      success: async (res) => {
        if (res.confirm) {
          this.setData({ loading: true, status: `正在初始化 ${name}...` });
          
          const logs = [...this.data.logs, `=== 开始初始化 ${name} ===`];
          
          try {
            // 尝试创建集合（通过添加一条记录）
            const db = wx.cloud.database();
            const result = await db.collection(name).add({
              data: {
                _init: true,
                description: '初始化测试记录',
                createTime: new Date()
              }
            });
            
            logs.push(`✅ ${name} 集合创建成功`);
            
            // 删除测试记录
            await db.collection(name).doc(result._id).remove();
            logs.push(`✅ 测试记录已清理`);
            
            // 更新集合状态
            const collections = [...this.data.collections];
            const index = collections.findIndex(c => c.name === name);
            if (index !== -1) {
              collections[index].status = 'created';
            }
            
            this.setData({ collections, logs, loading: false, status: '初始化完成' });
            
            wx.showToast({
              title: '初始化成功',
              icon: 'success'
            });
          } catch (error) {
            logs.push(`❌ ${name} 初始化失败: ${error.message}`);
            this.setData({ logs, loading: false, status: '初始化失败' });
            
            wx.showToast({
              title: '初始化失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 测试创作历史功能
  async testCreationHistory() {
    this.setData({ loading: true, status: '正在测试创作历史功能...' });
    
    const logs = [...this.data.logs, '=== 测试创作历史功能 ==='];
    
    try {
      // 1. 测试保存
      logs.push('1. 测试保存创作历史...');
      const saveResult = await wx.cloud.callFunction({
        name: 'creationHistory',
        data: {
          action: 'save',
          data: {
            projectId: 'test-project',
            agentId: 'test-agent',
            agentName: '测试智能体',
            character: '测试角色',
            prompt: '这是一个测试创作',
            content: '这是测试创作的内容',
            mediaType: 'text',
            mediaUrl: '',
            duration: 0,
            status: 'completed'
          }
        }
      });
      
      if (saveResult.result && saveResult.result.success) {
        logs.push('✅ 保存测试成功');
        const recordId = saveResult.result.data._id;
        
        // 2. 测试查询
        logs.push('2. 测试查询创作历史...');
        const listResult = await wx.cloud.callFunction({
          name: 'creationHistory',
          data: {
            action: 'list',
            data: { limit: 10 }
          }
        });
        
        if (listResult.result && listResult.result.success) {
          logs.push(`✅ 查询测试成功，找到 ${listResult.result.data.length} 条记录`);
          
          // 3. 测试删除
          logs.push('3. 测试删除创作历史...');
          const deleteResult = await wx.cloud.callFunction({
            name: 'creationHistory',
            data: {
              action: 'delete',
              data: { id: recordId }
            }
          });
          
          if (deleteResult.result && deleteResult.result.success) {
            logs.push('✅ 删除测试成功');
          } else {
            logs.push(`❌ 删除测试失败: ${deleteResult.result?.error || '未知错误'}`);
          }
        } else {
          logs.push(`❌ 查询测试失败: ${listResult.result?.error || '未知错误'}`);
        }
      } else {
        logs.push(`❌ 保存测试失败: ${saveResult.result?.error || '未知错误'}`);
      }
    } catch (error) {
      logs.push(`❌ 测试过程中出现异常: ${error.message}`);
    }
    
    this.setData({ logs, loading: false, status: '测试完成' });
  },

  // 迁移本地历史到云端
  async migrateLocalHistory() {
    const localHistory = wx.getStorageSync('creation_history') || [];
    
    if (localHistory.length === 0) {
      wx.showToast({
        title: '没有本地历史记录',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '确认迁移',
      content: `发现 ${localHistory.length} 条本地历史记录，确定要迁移到云端吗？`,
      success: async (res) => {
        if (res.confirm) {
          this.setData({ loading: true, status: '正在迁移本地历史记录...' });
          
          const logs = [...this.data.logs, `=== 开始迁移 ${localHistory.length} 条本地记录 ===`];
          let successCount = 0;
          let failCount = 0;
          
          for (const item of localHistory) {
            try {
              // 跳过已经是云端的记录
              if (item.fromCloud) {
                logs.push(`⏭️ 跳过云端记录: ${item.id}`);
                continue;
              }
              
              await wx.cloud.callFunction({
                name: 'creationHistory',
                data: {
                  action: 'save',
                  data: {
                    projectId: item.projectId || '',
                    agentId: item.agentId || 'local',
                    agentName: item.type || '本地创作',
                    character: '',
                    prompt: item.hotspot?.title || '本地创作',
                    content: item.content,
                    mediaType: 'text',
                    mediaUrl: '',
                    duration: 0,
                    status: item.status || 'completed'
                  }
                }
              });
              
              successCount++;
              logs.push(`✅ 迁移成功: ${item.id}`);
            } catch (error) {
              failCount++;
              logs.push(`❌ 迁移失败 ${item.id}: ${error.message}`);
            }
            
            // 更新进度
            this.setData({ 
              logs, 
              status: `迁移中... ${successCount + failCount}/${localHistory.length}` 
            });
            
            await this.sleep(100); // 避免请求过快
          }
          
          logs.push(`=== 迁移完成: 成功 ${successCount} 条，失败 ${failCount} 条 ===`);
          this.setData({ logs, loading: false, status: '迁移完成' });
          
          wx.showToast({
            title: `迁移完成: ${successCount} 成功, ${failCount} 失败`,
            icon: successCount > 0 ? 'success' : 'none'
          });
        }
      }
    });
  },

  // 清空本地历史
  clearLocalHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空本地历史记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('creation_history');
          
          this.setData({ 
            logs: [...this.data.logs, '✅ 本地历史记录已清空'],
            status: '本地历史已清空'
          });
          
          wx.showToast({
            title: '已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 复制日志
  copyLogs() {
    const text = this.data.logs.join('\n');
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '日志已复制',
          icon: 'success'
        });
      }
    });
  },

  // 清空日志
  clearLogs() {
    this.setData({ logs: [] });
  },

  // 辅助函数：延时
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
