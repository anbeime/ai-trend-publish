// pages/consistency/consistency.js - 角色一致性检查页面
Page({
  data: {
    loading: false,
    activeFilter: 'all',
    consistencyData: {
      passRate: 85,
      total: 42,
      warnings: 6,
      errors: 0
    },
    issues: {
      good: [
        {
          id: '1',
          title: '角色服装颜色一致',
          description: '主角的服装颜色在所有分镜中保持一致',
          time: '2025-01-20 14:30'
        },
        {
          id: '2',
          title: '场景光照方向正确',
          description: '所有分镜的光照方向符合物理规律',
          time: '2025-01-20 14:25'
        },
        {
          id: '3',
          title: '角色面部特征稳定',
          description: '主角的面部特征在不同分镜中保持一致',
          time: '2025-01-20 14:20'
        }
      ],
      warning: [
        {
          id: 'w1',
          title: '背景元素轻微偏移',
          description: '部分分镜的背景元素位置有轻微不一致',
          suggestion: '调整分镜3、5的背景元素位置',
          time: '2025-01-20 14:15'
        },
        {
          id: 'w2',
          title: '角色表情过渡生硬',
          description: '角色表情变化在不同分镜中过渡不够自然',
          suggestion: '在分镜4和分镜5之间添加过渡表情',
          time: '2025-01-20 14:10'
        }
      ],
      error: [
        // 暂时没有错误项
      ]
    },
    selectedIssues: [], // 选中的问题ID
    showFilterPanel: false
  },

  onLoad(options) {
    console.log('一致性检查页面加载', options)
    // 如果有传入项目ID，加载项目数据
    if (options.projectId) {
      this.loadProjectData(options.projectId)
    }
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshData()
  },

  // 加载项目数据
  async loadProjectData(projectId) {
    this.setData({ loading: true })
    
    try {
      // 调用云函数获取项目数据
      const res = await wx.cloud.callFunction({
        name: 'project-manager',
        data: {
          action: 'get',
          projectId: projectId
        }
      })

      if (res.result && res.result.success) {
        const project = res.result.data
        console.log('项目数据加载成功:', project)
        
        // 根据项目数据更新问题列表
        this.updateIssuesFromProject(project)
      }
    } catch (error) {
      console.error('加载项目数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 根据项目数据更新问题列表
  updateIssuesFromProject(project) {
    // 实际的一致性检查逻辑
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    
    // 初始化问题列表
    const goodIssues = []
    const warningIssues = []
    const errorIssues = []
    
    // 检查规则1: 标题完整性
    if (!project.title || project.title.trim().length === 0) {
      errorIssues.push({
        id: 'title-missing',
        title: '项目标题缺失',
        description: '项目没有设置标题，建议添加有意义的标题',
        fix: '请编辑项目，添加一个合适的标题',
        time: now
      })
    } else if (project.title.trim().length < 3) {
      warningIssues.push({
        id: 'title-too-short',
        title: '项目标题过短',
        description: '项目标题可能不够清晰，建议补充更多信息',
        suggestion: '将标题长度增加到3个字符以上',
        time: now
      })
    } else {
      goodIssues.push({
        id: 'title-ok',
        title: '项目标题合格',
        description: '项目标题清晰明确',
        time: now
      })
    }
    
    // 检查规则2: 描述完整性
    if (!project.description || project.description.trim().length === 0) {
      warningIssues.push({
        id: 'desc-missing',
        title: '项目描述缺失',
        description: '项目没有设置描述，可能影响创作质量',
        suggestion: '补充项目描述，说明创作目标和要点',
        time: now
      })
    } else if (project.description.trim().length < 10) {
      warningIssues.push({
        id: 'desc-too-short',
        title: '项目描述过短',
        description: '项目描述可能不够详细，建议补充更多内容',
        suggestion: '将描述长度增加到10个字符以上',
        time: now
      })
    } else {
      goodIssues.push({
        id: 'desc-ok',
        title: '项目描述合格',
        description: '项目描述详细清晰',
        time: now
      })
    }
    
    // 检查规则3: 状态一致性
    if (project.status === 'completed' && (!project.script || project.script.trim().length === 0)) {
      errorIssues.push({
        id: 'completed-no-script',
        title: '已完成项目缺少脚本',
        description: '项目状态标记为已完成，但没有生成脚本内容',
        fix: '请生成脚本或调整项目状态',
        time: now
      })
    } else if (project.status === 'working' && project.script && project.script.trim().length > 0) {
      goodIssues.push({
        id: 'working-with-script',
        title: '进行中项目已有脚本',
        description: '项目正在制作中，且已生成脚本内容',
        time: now
      })
    } else if (project.status === 'pending') {
      warningIssues.push({
        id: 'status-pending',
        title: '项目状态为待处理',
        description: '项目尚未开始制作，请及时启动创作流程',
        suggestion: '点击"开始创作"按钮启动智能体协作',
        time: now
      })
    }
    
    // 检查规则4: 更新时间
    if (project.updateTime) {
      const updateTime = new Date(project.updateTime)
      const nowTime = new Date()
      const diffHours = (nowTime - updateTime) / (1000 * 60 * 60)
      
      if (diffHours > 24) {
        warningIssues.push({
          id: 'stale-project',
          title: '项目长时间未更新',
          description: `项目已超过${Math.floor(diffHours)}小时未更新`,
          suggestion: '检查项目进度并进行更新',
          time: now
        })
      } else {
        goodIssues.push({
          id: 'updated-recently',
          title: '项目更新及时',
          description: '项目在最近24小时内有过更新',
          time: now
        })
      }
    }
    
    // 计算统计数据
    const total = goodIssues.length + warningIssues.length + errorIssues.length
    const passRate = total > 0 ? Math.round((goodIssues.length / total) * 100) : 100
    
    this.setData({
      'consistencyData.passRate': passRate,
      'consistencyData.total': total,
      'consistencyData.warnings': warningIssues.length,
      'consistencyData.errors': errorIssues.length,
      issues: {
        good: goodIssues,
        warning: warningIssues,
        error: errorIssues
      }
    })
    
    console.log('一致性检查完成:', {
      通过率: passRate + '%',
      总检查项: total,
      警告: warningIssues.length,
      错误: errorIssues.length
    })
  },

  // 刷新数据
  refreshData() {
    // 这里可以重新加载数据或更新显示
    console.log('刷新一致性检查数据')
  },

  // 设置筛选器
  setFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ activeFilter: filter })
  },

  // 获取筛选后的问题列表（计算属性）
  filteredIssues() {
    const { activeFilter, issues } = this.data
    
    if (activeFilter === 'all') {
      return issues
    }
    
    return {
      [activeFilter]: issues[activeFilter] || []
    }
  },

  // 计算筛选后的问题数量
  filteredIssuesLength() {
    const filtered = this.filteredIssues()
    return (filtered.good || []).length + 
           (filtered.warning || []).length + 
           (filtered.error || []).length
  },

  // 是否有警告或错误
  hasWarningsOrErrors() {
    const { issues } = this.data
    return issues.warning.length > 0 || issues.error.length > 0
  },

  // 选中的问题数量
  selectedCount() {
    return this.data.selectedIssues.length
  },

  // 切换问题选中状态
  toggleIssue(e) {
    const issue = e.currentTarget.dataset.issue
    const { selectedIssues } = this.data
    
    const index = selectedIssues.indexOf(issue.id)
    if (index > -1) {
      selectedIssues.splice(index, 1)
    } else {
      selectedIssues.push(issue.id)
    }
    
    this.setData({ selectedIssues })
  },

  // 应用建议（针对警告）
  applySuggestion(e) {
    const issue = e.currentTarget.dataset.issue
    console.log('应用建议:', issue)
    
    wx.showModal({
      title: '应用建议',
      content: `确定要应用建议 "${issue.suggestion}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          // 实际应该调用云函数修复问题
          // 这里模拟修复成功
          this.removeIssue(issue.id, 'warning')
          
          wx.showToast({
            title: '建议已应用',
            icon: 'success'
          })
        }
      }
    })
  },

  // 应用修复（针对错误）
  applyFix(e) {
    const issue = e.currentTarget.dataset.issue
    console.log('应用修复:', issue)
    
    wx.showModal({
      title: '一键修复',
      content: `确定要修复问题 "${issue.title}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          // 实际应该调用云函数修复问题
          // 这里模拟修复成功
          this.removeIssue(issue.id, 'error')
          
          wx.showToast({
            title: '问题已修复',
            icon: 'success'
          })
        }
      }
    })
  },

  // 从问题列表中移除问题
  removeIssue(issueId, type) {
    const { issues } = this.data
    const updatedList = issues[type].filter(item => item.id !== issueId)
    
    this.setData({
      [`issues.${type}`]: updatedList,
      // 更新统计数据
      [`consistencyData.${type}s`]: updatedList.length,
      [`consistencyData.total`]: issues.good.length + 
                                (type === 'warning' ? updatedList.length : issues.warning.length) +
                                (type === 'error' ? updatedList.length : issues.error.length),
      [`consistencyData.passRate`]: Math.round(
        (issues.good.length / 
         (issues.good.length + 
          (type === 'warning' ? updatedList.length : issues.warning.length) +
          (type === 'error' ? updatedList.length : issues.error.length))) * 100
      )
    })
  },

  // 批量忽略
  batchIgnore() {
    if (this.selectedCount() === 0) {
      wx.showToast({
        title: '请先选择问题',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '批量忽略',
      content: `确定要忽略选中的 ${this.selectedCount()} 个问题吗？`,
      success: (res) => {
        if (res.confirm) {
          // 实际应该调用云函数忽略问题
          // 这里模拟忽略成功
          const { selectedIssues, issues } = this.data
          
          // 从警告列表中移除选中的问题
          const remainingWarnings = issues.warning.filter(
            item => !selectedIssues.includes(item.id)
          )
          
          // 从错误列表中移除选中的问题
          const remainingErrors = issues.error.filter(
            item => !selectedIssues.includes(item.id)
          )
          
          this.setData({
            'issues.warning': remainingWarnings,
            'issues.error': remainingErrors,
            'consistencyData.warnings': remainingWarnings.length,
            'consistencyData.errors': remainingErrors.length,
            'consistencyData.total': issues.good.length + remainingWarnings.length + remainingErrors.length,
            selectedIssues: []
          })
          
          wx.showToast({
            title: '问题已忽略',
            icon: 'success'
          })
        }
      }
    })
  },

  // 批量修复
  batchFix() {
    if (this.selectedCount() === 0) {
      wx.showToast({
        title: '请先选择问题',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '批量修复',
      content: `确定要修复选中的 ${this.selectedCount()} 个问题吗？`,
      success: (res) => {
        if (res.confirm) {
          // 实际应该调用云函数修复问题
          // 这里模拟修复成功
          const { selectedIssues, issues } = this.data
          
          // 将选中的警告和错误项移到通过项
          const selectedWarnings = issues.warning.filter(
            item => selectedIssues.includes(item.id)
          )
          const selectedErrors = issues.error.filter(
            item => selectedIssues.includes(item.id)
          )
          
          const fixedItems = [
            ...selectedWarnings.map(item => ({
              ...item,
              id: `fixed_${item.id}`,
              time: new Date().toISOString().slice(0, 16).replace('T', ' ')
            })),
            ...selectedErrors.map(item => ({
              ...item,
              id: `fixed_${item.id}`,
              time: new Date().toISOString().slice(0, 16).replace('T', ' ')
            }))
          ]
          
          const remainingWarnings = issues.warning.filter(
            item => !selectedIssues.includes(item.id)
          )
          const remainingErrors = issues.error.filter(
            item => !selectedIssues.includes(item.id)
          )
          
          this.setData({
            'issues.good': [...issues.good, ...fixedItems],
            'issues.warning': remainingWarnings,
            'issues.error': remainingErrors,
            'consistencyData.warnings': remainingWarnings.length,
            'consistencyData.errors': remainingErrors.length,
            'consistencyData.total': issues.good.length + fixedItems.length + remainingWarnings.length + remainingErrors.length,
            'consistencyData.passRate': Math.round(
              ((issues.good.length + fixedItems.length) / 
               (issues.good.length + fixedItems.length + remainingWarnings.length + remainingErrors.length)) * 100
            ),
            selectedIssues: []
          })
          
          wx.showToast({
            title: '问题已修复',
            icon: 'success'
          })
        }
      }
    })
  },

  // 重新检查
  recheck() {
    this.setData({ loading: true })
    
    // 模拟重新检查过程
    setTimeout(() => {
      // 随机更新通过率和问题数量
      const newPassRate = Math.min(100, this.data.consistencyData.passRate + Math.floor(Math.random() * 10))
      const newWarnings = Math.max(0, this.data.consistencyData.warnings - Math.floor(Math.random() * 2))
      
      this.setData({
        'consistencyData.passRate': newPassRate,
        'consistencyData.warnings': newWarnings,
        loading: false
      })
      
      wx.showToast({
        title: '检查完成',
        icon: 'success'
      })
    }, 1500)
  },

  // 查看帮助
  openHelp() {
    wx.showModal({
      title: '一致性检查帮助',
      content: '一致性检查确保视频中角色、场景、道具等元素在不同分镜中保持统一。警告表示建议优化，错误表示必须修复的问题。',
      showCancel: false
    })
  },

  // 导出报告
  exportReport() {
    const { consistencyData, issues } = this.data
    
    const report = {
      检查时间: new Date().toLocaleString(),
      通过率: `${consistencyData.passRate}%`,
      总检查项: consistencyData.total,
      警告数量: consistencyData.warnings,
      错误数量: consistencyData.errors,
      问题详情: {
        通过项: issues.good.map(item => ({
          标题: item.title,
          描述: item.description
        })),
        警告项: issues.warning.map(item => ({
          标题: item.title,
          描述: item.description,
          建议: item.suggestion
        })),
        错误项: issues.error.map(item => ({
          标题: item.title,
          描述: item.description,
          修复方案: item.fix
        }))
      }
    }
    
    const reportText = JSON.stringify(report, null, 2)
    
    wx.showModal({
      title: '导出报告',
      content: '一致性检查报告已生成，是否复制到剪贴板？',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: reportText,
            success: () => {
              wx.showToast({
                title: '已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  }
})