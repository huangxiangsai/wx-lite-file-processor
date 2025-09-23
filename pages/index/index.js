// pages/index/index.js
const FileManager = require('../../utils/fileManager.js')

Page({
  data: {
    recentFiles: [],
    stats: null,
    loading: false,
    loadingText: '处理中...'
  },

  fileManager: null,

  onLoad() {
    this.fileManager = new FileManager()
    this.loadRecentFiles()
    this.loadStats()
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadRecentFiles()
    this.loadStats()
  },

  /**
   * 加载最近处理的文件
   */
  loadRecentFiles() {
    const allFiles = this.fileManager.getAllFiles()
    const recentFiles = allFiles
      .sort((a, b) => b.createTime - a.createTime)
      .slice(0, 5)
      .map(file => ({
        ...file,
        thumbnail: this.fileManager.isImage(file.type) ? file.path : this.fileManager.getFileIcon(file.type)
      }))
    
    this.setData({ recentFiles })
  },

  /**
   * 加载使用统计
   */
  loadStats() {
    const allFiles = this.fileManager.getAllFiles()
    const processHistory = wx.getStorageSync('fileSystem')?.processHistory || []
    
    const stats = {
      processedFiles: processHistory.length,
      savedSpace: this.calculateSavedSpace(processHistory)
    }
    
    this.setData({ stats })
  },

  /**
   * 计算节省的空间
   */
  calculateSavedSpace(processHistory) {
    let totalSaved = 0
    processHistory.forEach(record => {
      if (record.operation === 'compress' && record.originalSize && record.compressedSize) {
        totalSaved += (record.originalSize - record.compressedSize)
      }
    })
    return this.fileManager.formatFileSize(totalSaved)
  },

  /**
   * 从聊天记录选择文件
   */
  async selectFromChat() {
    try {
      this.setData({ 
        loading: true, 
        loadingText: '正在获取聊天文件...' 
      })

      const files = await this.fileManager.selectFileFromChat()
      
      if (files.length === 0) {
        wx.showToast({
          title: '未选择任何文件',
          icon: 'none'
        })
        return
      }

      // 保存文件到本地存储
      files.forEach(file => {
        this.fileManager.saveFileToStorage(file)
      })

      this.setData({ loading: false })

      // 如果只选择了一个文件，直接跳转到详情页
      if (files.length === 1) {
        wx.navigateTo({
          url: `/pages/file-detail/file-detail?fileId=${files[0].id}`
        })
      } else {
        // 多个文件跳转到文件列表页
        wx.switchTab({
          url: '/pages/file-list/file-list'
        })
      }

      // 刷新最近文件列表
      this.loadRecentFiles()

    } catch (error) {
      console.error('选择文件失败:', error)
      this.setData({ loading: false })
      
      if (error.errMsg && error.errMsg.includes('cancel')) {
        return // 用户取消选择
      }
      
      wx.showToast({
        title: '选择文件失败',
        icon: 'none'
      })
    }
  },

  /**
   * 从本地选择文件
   */
  async selectFromLocal() {
    try {
      this.setData({ 
        loading: true, 
        loadingText: '正在获取本地文件...' 
      })

      const files = await this.fileManager.selectLocalFile()
      
      if (files.length === 0) {
        wx.showToast({
          title: '未选择任何文件',
          icon: 'none'
        })
        return
      }

      // 保存文件到本地存储
      files.forEach(file => {
        this.fileManager.saveFileToStorage(file)
      })

      this.setData({ loading: false })

      // 如果只选择了一个文件，直接跳转到详情页
      if (files.length === 1) {
        wx.navigateTo({
          url: `/pages/file-detail/file-detail?fileId=${files[0].id}`
        })
      } else {
        // 多个文件跳转到文件列表页
        wx.switchTab({
          url: '/pages/file-list/file-list'
        })
      }

      // 刷新最近文件列表
      this.loadRecentFiles()

    } catch (error) {
      console.error('选择本地文件失败:', error)
      this.setData({ loading: false })
      
      if (error.errMsg && error.errMsg.includes('cancel')) {
        return // 用户取消选择
      }
      
      wx.showToast({
        title: '选择文件失败',
        icon: 'none'
      })
    }
  },

  /**
   * 打开最近文件
   */
  openFile(e) {
    const file = e.currentTarget.dataset.file
    wx.navigateTo({
      url: `/pages/file-detail/file-detail?fileId=${file.id}`
    })
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '文件处理工具 - 压缩、解压、格式转换',
      path: '/pages/index/index'
    }
  }
})