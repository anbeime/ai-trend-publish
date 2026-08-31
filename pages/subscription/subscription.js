/**
 * 订阅管理页面
 * 处理会员购买、积分充值、订单查看等功能
 */

Page({
  data: {
    loading: false,
    userInfo: null,
    memberStatus: {
      isMember: false,
      remainingToday: 3,
      benefits: { name: '免费用户' }
    },
    membershipPlans: [],
    creditPackages: [],
    selectedPlan: 'quarterly', // 默认选中季卡
    selectedCredit: null,
    buyType: 'membership', // membership / credits
    currentPrice: 0,
    currentOrderId: '',
    orderList: [],
    showDevModal: false
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    this.loadMemberStatus()
  },

  /**
   * 初始化页面
   */
  async initPage() {
    wx.showLoading({ title: '加载中...' })

    try {
      await Promise.all([
        this.loadMemberStatus(),
        this.loadPlans(),
        this.loadOrderList()
      ])
      this.updateCurrentPrice()
    } catch (error) {
      console.error('初始化失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 加载会员状态
   */
  async loadMemberStatus() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'member-manager',
        data: { action: 'getStatus' }
      })

      if (res.result.success) {
        const data = res.result.data
        
        // 格式化过期时间
        if (data.memberInfo && data.memberInfo.expireTime) {
          data.memberInfo.expireTimeStr = this.formatDate(data.memberInfo.expireTime)
        }

        this.setData({
          memberStatus: data,
          userInfo: {
            nickName: '用户',
            avatarUrl: ''
          }
        })
      }
    } catch (error) {
      console.error('加载会员状态失败:', error)
    }
  },

  /**
   * 加载套餐列表
   */
  async loadPlans() {
    try {
      const [memberRes, creditRes] = await Promise.all([
        wx.cloud.callFunction({
          name: 'pay',
          data: { action: 'getMembershipPlans' }
        }),
        wx.cloud.callFunction({
          name: 'pay',
          data: { action: 'getCreditPackages' }
        })
      ])

      if (memberRes.result.success) {
        // 添加 id 字段到每个套餐
        const plans = memberRes.result.data.map(p => ({
          ...p,
          id: p.id || p.name
        }))
        this.setData({ membershipPlans: plans })
      }

      if (creditRes.result.success) {
        const packages = creditRes.result.data.map((p, i) => ({
          ...p,
          id: `pack${[10, 30, 50, 100][i]}`
        }))
        this.setData({ creditPackages: packages })
      }
    } catch (error) {
      console.error('加载套餐失败:', error)
    }
  },

  /**
   * 加载订单列表
   */
  async loadOrderList() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'pay',
        data: { action: 'getOrderList', limit: 10 }
      })

      if (res.result.success) {
        const orders = res.result.data.map(order => ({
          ...order,
          createTimeStr: this.formatDate(order.createTime)
        }))
        this.setData({ orderList: orders })
      }
    } catch (error) {
      console.error('加载订单失败:', error)
    }
  },

  /**
   * 选择会员套餐
   */
  selectPlan(e) {
    const planId = e.currentTarget.dataset.plan
    this.setData({
      selectedPlan: planId,
      selectedCredit: null,
      buyType: 'membership'
    })
    this.updateCurrentPrice()
  },

  /**
   * 选择积分套餐
   */
  selectCredit(e) {
    const creditId = e.currentTarget.dataset.credit
    this.setData({
      selectedCredit: creditId,
      selectedPlan: null,
      buyType: 'credits'
    })
    this.updateCurrentPrice()
  },

  /**
   * 更新当前价格
   */
  updateCurrentPrice() {
    const { buyType, selectedPlan, selectedCredit, membershipPlans, creditPackages } = this.data

    if (buyType === 'membership' && selectedPlan) {
      const plan = membershipPlans.find(p => p.id === selectedPlan)
      if (plan) {
        this.setData({ currentPrice: plan.price })
      }
    } else if (buyType === 'credits' && selectedCredit) {
      const credit = creditPackages.find(c => c.id === selectedCredit)
      if (credit) {
        this.setData({ currentPrice: credit.price })
      }
    }
  },

  /**
   * 处理购买
   */
  async handleBuy() {
    const { buyType, selectedPlan, selectedCredit, currentPrice } = this.data

    if (buyType === 'membership' && !selectedPlan) {
      wx.showToast({ title: '请选择会员套餐', icon: 'none' })
      return
    }

    if (buyType === 'credits' && !selectedCredit) {
      wx.showToast({ title: '请选择积分套餐', icon: 'none' })
      return
    }

    // 创建订单
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'pay',
        data: {
          action: 'createOrder',
          type: buyType,
          planId: buyType === 'membership' ? selectedPlan : selectedCredit
        }
      })

      if (res.result.success) {
        this.setData({
          currentOrderId: res.result.orderId,
          showDevModal: true
        })
      } else {
        wx.showToast({ title: res.result.message || '创建订单失败', icon: 'none' })
      }
    } catch (error) {
      console.error('创建订单失败:', error)
      wx.showToast({ title: '创建订单失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 关闭开发测试弹窗
   */
  closeDevModal() {
    this.setData({ showDevModal: false })
  },

  /**
   * 确认模拟支付（开发测试）
   */
  async confirmMockPay() {
    const { currentOrderId } = this.data

    this.setData({ loading: true, showDevModal: false })
    wx.showLoading({ title: '处理中...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'pay',
        data: {
          action: 'mockPay',
          orderId: currentOrderId
        }
      })

      if (res.result.success) {
        wx.showToast({ title: '支付成功', icon: 'success' })
        
        // 刷新数据
        await Promise.all([
          this.loadMemberStatus(),
          this.loadOrderList()
        ])
      } else {
        wx.showToast({ title: res.result.message || '支付失败', icon: 'none' })
      }
    } catch (error) {
      console.error('支付失败:', error)
      wx.showToast({ title: '支付失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
      wx.hideLoading()
    }
  },

  /**
   * 格式化日期
   */
  formatDate(date) {
    if (!date) return ''
    
    const d = new Date(date)
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    
    return `${year}-${month}-${day}`
  },

  /**
   * 下拉刷新
   */
  async onPullDownRefresh() {
    await this.initPage()
    wx.stopPullDownRefresh()
  },

  /**
   * 跳转到客服
   */
  goToCustomerService() {
    wx.showModal({
      title: '联系客服',
      content: '请添加客服微信：xxx',
      showCancel: false
    })
  }
})
