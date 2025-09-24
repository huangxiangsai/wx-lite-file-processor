// pages/settings/settings.js
const FileManager = require('../../utils/fileManager.js')

Page({
  data: {
    storageInfo: {
      fileCount: 0,
      totalSize: '0 B',
      historyCount: 0
    },
    compressionQuality: 80,
    autoSave: true,
    vibrationEnabled: true,
    apiBaseUrl: '',
    apiStatus: 'unknown',
    apiStatusText: '未知',
    appVersion: '1.0.0',
    showStats: false,
    stats: {
      totalProcessed: 0,
      totalSaved: '0 B',
      usageDays: 0
    },
    showApiUrlModal: false,
    editingApiUrl: '',
    loading: false,
    loadingText: ''
  },

  fileManager: null,

  onLoad() {
    this.fileManager = new FileManager()
    this.loadSettings()
    this.loadStorageInfo()
    this.loadStats()
  },

  onShow() {
    this.loadStorageInfo()
    this.loadStats()
  },

  /**
   * 加载设置
   */
  loadSettings() {
    const settings = wx.getStorageSync('appSettings') || {}
    const app = getApp()
    
    this.setData({
      compressionQuality: settings.compressionQuality || 80,
      autoSave: settings.autoSave !== false,
      vibrationEnabled: settings.vibrationEnabled !== false,
      apiBaseUrl: app.globalData.apiBaseUrl || '',
      showStats: settings.showStats !== false
    })
  },

  /**
   * 保存设置
   */
  saveSettings() {
    const settings = {
      compressionQuality: this.data.compressionQuality,
      autoSave: this.data.autoSave,
      vibrationEnabled: this.data.vibrationEnabled,
      showStats: this.data.showStats
    }
    wx.setStorageSync('appSettings', settings)
  },

  /**
   * 加载存储信息
   */
  loadStorageInfo() {
    const fileSystem = wx.getStorageSync('fileSystem') || { files: [], processHistory: [] }
    const files = fileSystem.files || []
    const history = fileSystem.processHistory || []
    
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0)
    
    this.setData({
      storageInfo: {
        fileCount: files.length,
        totalSize: this.fileManager.formatFileSize(totalSize),
        historyCount: history.length
      }
    })
  },

  /**
   * 加载统计信息
   */
  loadStats() {
    const fileSystem = wx.getStorageSync('fileSystem') || { processHistory: [] }
    const history = fileSystem.processHistory || []
    const firstUseTime = wx.getStorageSync('firstUseTime') || Date.now()
    
    // 计算节省的空间
    let totalSaved = 0
    let processedCount = 0
    
    history.forEach(record => {
      if (record.success) {
        processedCount++
        if (record.operation === 'compress' && record.originalSize && record.compressedSize) {
          totalSaved += (record.originalSize - record.compressedSize)
        }
      }
    })
    
    const usageDays = Math.ceil((Date.now() - firstUseTime) / (24 * 60 * 60 * 1000))
    
    this.setData({
      stats: {
        totalProcessed: processedCount,
        totalSaved: this.fileManager.formatFileSize(totalSaved),
        usageDays: Math.max(1, usageDays)
      }
    })
  },

  /**
   * 图片压缩质量改变
   */
  onCompressionQualityChange(e) {
    this.setData({ compressionQuality: e.detail.value })
    this.saveSettings()
  },

  /**
   * 自动保存开关
   */
  onAutoSaveChange(e) {
    this.setData({ autoSave: e.detail.value })
    this.saveSettings()
  },

  /**
   * 震动提醒开关
   */
  onVibrationChange(e) {
    this.setData({ vibrationEnabled: e.detail.value })
    this.saveSettings()
  },

  /**
   * 清理历史记录
   */
  clearHistory() {
    wx.showModal({
      title: '确认清理',
      content: '确定要清理所有处理历史记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          const fileSystem = wx.getStorageSync('fileSystem') || {}
          fileSystem.processHistory = []
          wx.setStorageSync('fileSystem', fileSystem)
          
          wx.showToast({
            title: '清理完成',
            icon: 'success'
          })
          
          this.loadStorageInfo()
          this.loadStats()
        }
      }
    })
  },

  /**
   * 清空所有数据
   */
  clearAllData() {
    wx.showModal({
      title: '危险操作',
      content: '确定要清空所有数据吗？包括文件记录和处理历史，此操作不可恢复！',
      confirmColor: '#fa5151',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '最后确认',
            content: '真的要删除所有数据吗？',
            confirmColor: '#fa5151',
            success: (res2) => {
              if (res2.confirm) {
                // 清空文件系统数据
                wx.setStorageSync('fileSystem', { files: [], folders: [], processHistory: [] })
                
                wx.showToast({
                  title: '数据已清空',
                  icon: 'success'
                })
                
                this.loadStorageInfo()
                this.loadStats()
              }
            }
          })
        }
      }
    })
  },

  /**
   * 编辑API地址
   */
  editApiUrl() {
    this.setData({
      showApiUrlModal: true,
      editingApiUrl: this.data.apiBaseUrl
    })
  },

  /**
   * 隐藏API地址编辑弹窗
   */
  hideApiUrlModal() {
    this.setData({ showApiUrlModal: false })
  },

  /**
   * API地址输入
   */
  onApiUrlInput(e) {
    this.setData({ editingApiUrl: e.detail.value })
  },

  /**
   * 保存API地址
   */
  saveApiUrl() {
    const newUrl = this.data.editingApiUrl.trim()
    
    if (!newUrl) {
      wx.showToast({
        title: 'API地址不能为空',
        icon: 'none'
      })
      return
    }
    
    // 简单的URL格式验证
    if (!/^https?:\/\/.+/.test(newUrl)) {
      wx.showToast({
        title: 'API地址格式不正确',
        icon: 'none'
      })
      return
    }
    
    // 更新全局配置
    const app = getApp()
    app.globalData.apiBaseUrl = newUrl.replace(/\/$/, '') // 移除末尾斜杠
    
    // 保存到本地存储
    wx.setStorageSync('apiBaseUrl', app.globalData.apiBaseUrl)
    
    this.setData({
      apiBaseUrl: app.globalData.apiBaseUrl,
      showApiUrlModal: false,
      apiStatus: 'unknown',
      apiStatusText: '未知'
    })
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
  },

  /**
   * 测试API连接
   */
  async testApiConnection() {
    if (!this.data.apiBaseUrl) {
      wx.showToast({
        title: '请先设置API地址',
        icon: 'none'
      })
      return
    }

    this.setData({
      loading: true,
      loadingText: '正在测试连接...'
    })

    try {
      // 使用FileManager的API状态检查方法
      const fileManager = new (require('../../utils/fileManager.js'))()
      const result = await fileManager.checkApiStatus()

      this.setData({ loading: false })

      if (result && result.data) {
        this.setData({
          apiStatus: 'connected',
          apiStatusText: '连接正常'
        })
        
        const { supportedFormats, limits } = result.data
        let statusInfo = 'API连接正常\n'
        if (supportedFormats) {
          statusInfo += `支持格式: ${supportedFormats.extract?.join(', ') || ''} | ${supportedFormats.convert?.join(', ') || ''}\n`
        }
        if (limits) {
          statusInfo += `文件限制: ${limits.maxFileSize || '50MB'}`
        }
        
        wx.showModal({
          title: 'API连接测试',
          content: statusInfo,
          showCancel: false
        })
      } else {
        throw new Error('API响应格式错误')
      }
    } catch (error) {
      console.error('API连接测试失败:', error)
      this.setData({
        loading: false,
        apiStatus: 'error',
        apiStatusText: '连接失败'
      })
      
      let errorMessage = '连接测试失败'
      if (error.message.includes('timeout')) {
        errorMessage = '连接超时，请检查网络或API地址'
      } else if (error.message.includes('网络')) {
        errorMessage = '网络连接失败，请检查网络设置'
      } else if (error.message.includes('404')) {
        errorMessage = 'API地址不正确，请检查URL'
      }
      
      wx.showModal({
        title: 'API连接失败',
        content: errorMessage,
        showCancel: false
      })
    }
  },

  /**
   * 显示隐私政策
   */
  showPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '本应用严格保护用户隐私，不会收集、存储或传输用户的个人信息。所有文件处理都在本地或用户指定的服务器上进行。',
      showCancel: false
    })
  },

  /**
   * 显示用户协议
   */
  showUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '使用本应用即表示您同意遵守相关法律法规，不得使用本应用进行违法活动。本应用仅提供文件处理功能，不对处理结果承担责任。',
      showCancel: false
    })
  },

  /**
   * 联系客服
   */
  contactSupport() {
    wx.showModal({
      title: '联系客服',
      content: '如需帮助或反馈问题，请通过以下方式联系我们：\n\n微信：your-wechat-id\n邮箱：support@yourapp.com',
      showCancel: false,
      confirmText: '复制微信号',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'your-wechat-id',
            success: () => {
              wx.showToast({
                title: '微信号已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止点击模态框内容时关闭
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '文件处理工具 - 功能强大的文件处理助手',
      path: '/pages/index/index'
    }
  }
})