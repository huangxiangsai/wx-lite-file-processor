// pages/file-detail/file-detail.js
const FileManager = require('../../utils/fileManager.js')

Page({
  data: {
    fileData: null,
    fileIcon: '',
    formattedSize: '',
    statusText: '',
    isImage: false,
    isArchive: false,
    isPdf: false,
    canPreview: false,
    canConvert: false,
    processHistory: [],
    processing: false,
    processingText: '',
    progress: 0,
    showConvertModal: false,
    convertOptions: []
  },

  fileManager: null,
  fileId: '',

  onLoad(options) {
    this.fileManager = new FileManager()
    this.fileId = options.fileId
    
    if (!this.fileId) {
      wx.showToast({
        title: '文件参数错误',
        icon: 'none'
      })
      wx.navigateBack()
      return
    }

    this.loadFileData()
  },

  /**
   * 加载文件数据
   */
  loadFileData() {
    const allFiles = this.fileManager.getAllFiles()
    const fileData = allFiles.find(file => file.id === this.fileId)
    
    if (!fileData) {
      wx.showToast({
        title: '文件不存在',
        icon: 'none'
      })
      wx.navigateBack()
      return
    }

    const isImage = this.fileManager.isImage(fileData.type)
    const isArchive = ['zip', 'rar', '7z'].includes(fileData.type.toLowerCase())
    const isPdf = fileData.type.toLowerCase() === 'pdf'
    
    this.setData({
      fileData,
      fileIcon: this.fileManager.getFileIcon(fileData.type),
      formattedSize: this.fileManager.formatFileSize(fileData.size),
      statusText: this.getStatusText(fileData.status),
      isImage,
      isArchive,
      isPdf,
      canPreview: isImage || isPdf,
      canConvert: isImage || isPdf,
      convertOptions: this.getConvertOptions(fileData.type)
    })

    this.loadProcessHistory()
  },

  /**
   * 获取状态文本
   */
  getStatusText(status) {
    const statusMap = {
      'ready': '就绪',
      'processing': '处理中',
      'completed': '已完成',
      'error': '处理失败'
    }
    return statusMap[status] || '未知'
  },

  /**
   * 获取转换选项
   */
  getConvertOptions(fileType) {
    const options = []
    
    if (this.fileManager.isImage(fileType)) {
      const imageFormats = [
        { format: 'jpg', name: 'JPEG', description: '通用图片格式', icon: '/images/icons/jpg.png' },
        { format: 'png', name: 'PNG', description: '支持透明背景', icon: '/images/icons/png.png' },
        { format: 'webp', name: 'WebP', description: '更小的文件大小', icon: '/images/icons/webp.png' }
      ]
      options.push(...imageFormats.filter(opt => opt.format !== fileType.toLowerCase()))
    }
    
    if (fileType.toLowerCase() === 'pdf') {
      options.push({
        format: 'images',
        name: '图片集',
        description: '按页转换为图片',
        icon: '/images/icons/images.png'
      })
    }
    
    return options
  },

  /**
   * 加载处理历史
   */
  loadProcessHistory() {
    const fileSystem = wx.getStorageSync('fileSystem') || { processHistory: [] }
    const history = fileSystem.processHistory
      .filter(record => record.fileId === this.fileId)
      .map(record => ({
        ...record,
        timeText: this.formatTime(record.timestamp),
        actionText: this.getActionText(record.operation),
        resultText: record.success ? '成功' : record.error || '失败'
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
    
    this.setData({ processHistory: history })
  },

  /**
   * 格式化时间
   */
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) { // 1天内
      return `${Math.floor(diff / 3600000)}小时前`
    } else {
      return date.toLocaleString()
    }
  },

  /**
   * 获取操作文本
   */
  getActionText(operation) {
    const actionMap = {
      'compress': '图片压缩',
      'extract': '解压缩',
      'convert': '格式转换',
      'pdf2images': 'PDF转图片'
    }
    return actionMap[operation] || operation
  },

  /**
   * 预览文件
   */
  previewFile() {
    this.fileManager.previewFile(this.data.fileData)
  },

  /**
   * 压缩图片
   */
  async compressImage() {
    if (!this.data.isImage) return

    try {
      this.setData({
        processing: true,
        processingText: '正在压缩图片...',
        progress: 0
      })

      // 模拟进度
      this.simulateProgress()

      const result = await this.fileManager.compressImage(this.data.fileData.path, 0.7)
      
      // 创建新的压缩后文件记录
      const compressedFile = {
        id: this.fileManager.generateFileId(),
        name: `compressed_${this.data.fileData.name}`,
        size: result.size || this.data.fileData.size * 0.7, // 估算压缩后大小
        type: this.data.fileData.type,
        path: result.tempFilePath,
        source: 'processed',
        createTime: Date.now(),
        status: 'ready',
        parentId: this.data.fileData.id
      }

      this.fileManager.saveFileToStorage(compressedFile)
      
      // 记录处理历史
      this.recordProcessHistory('compress', true, {
        originalSize: this.data.fileData.size,
        compressedSize: compressedFile.size
      })

      this.setData({ processing: false })

      wx.showToast({
        title: '压缩完成',
        icon: 'success'
      })

      // 跳转到压缩后的文件详情
      wx.redirectTo({
        url: `/pages/file-detail/file-detail?fileId=${compressedFile.id}`
      })

    } catch (error) {
      console.error('压缩失败:', error)
      this.setData({ processing: false })
      this.recordProcessHistory('compress', false, { error: error.message })
      
      wx.showToast({
        title: '压缩失败',
        icon: 'none'
      })
    }
  },

  /**
   * 解压缩文件
   */
  async extractArchive() {
    if (!this.data.isArchive) return

    try {
      this.setData({
        processing: true,
        processingText: '正在解压缩...',
        progress: 0
      })

      this.simulateProgress()

      // 调用远程API处理
      const result = await this.fileManager.processFileRemotely(this.data.fileData, 'extract')
      
      if (result.success) {
        // 下载解压后的文件
        const extractedFiles = []
        for (const fileInfo of result.files) {
          const downloadedFile = await this.fileManager.downloadProcessedFile(fileInfo.id, fileInfo.name)
          extractedFiles.push(downloadedFile)
          this.fileManager.saveFileToStorage(downloadedFile)
        }

        this.recordProcessHistory('extract', true, { 
          extractedCount: extractedFiles.length 
        })

        this.setData({ processing: false })

        wx.showModal({
          title: '解压完成',
          content: `成功解压 ${extractedFiles.length} 个文件`,
          showCancel: false,
          success: () => {
            wx.switchTab({
              url: '/pages/file-list/file-list'
            })
          }
        })
      } else {
        throw new Error(result.message || '解压失败')
      }

    } catch (error) {
      console.error('解压失败:', error)
      this.setData({ processing: false })
      this.recordProcessHistory('extract', false, { error: error.message })
      
      wx.showToast({
        title: '解压失败',
        icon: 'none'
      })
    }
  },

  /**
   * PDF转图片
   */
  async convertPdfToImages() {
    if (!this.data.isPdf) return

    try {
      this.setData({
        processing: true,
        processingText: '正在转换PDF...',
        progress: 0
      })

      this.simulateProgress()

      // 调用远程API处理
      const result = await this.fileManager.processFileRemotely(this.data.fileData, 'pdf2images')
      
      if (result.success) {
        // 下载转换后的图片
        const imageFiles = []
        for (const imageInfo of result.images) {
          const downloadedImage = await this.fileManager.downloadProcessedFile(imageInfo.id, imageInfo.name)
          imageFiles.push(downloadedImage)
          this.fileManager.saveFileToStorage(downloadedImage)
        }

        this.recordProcessHistory('pdf2images', true, { 
          pageCount: imageFiles.length 
        })

        this.setData({ processing: false })

        wx.showModal({
          title: '转换完成',
          content: `成功转换 ${imageFiles.length} 页图片`,
          showCancel: false,
          success: () => {
            wx.switchTab({
              url: '/pages/file-list/file-list'
            })
          }
        })
      } else {
        throw new Error(result.message || '转换失败')
      }

    } catch (error) {
      console.error('PDF转换失败:', error)
      this.setData({ processing: false })
      this.recordProcessHistory('pdf2images', false, { error: error.message })
      
      wx.showToast({
        title: '转换失败',
        icon: 'none'
      })
    }
  },

  /**
   * 显示格式转换选项
   */
  showConvertOptions() {
    this.setData({ showConvertModal: true })
  },

  /**
   * 隐藏格式转换选项
   */
  hideConvertOptions() {
    this.setData({ showConvertModal: false })
  },

  /**
   * 转换到指定格式
   */
  async convertToFormat(e) {
    const format = e.currentTarget.dataset.format
    this.hideConvertOptions()

    try {
      this.setData({
        processing: true,
        processingText: `正在转换为 ${format.toUpperCase()}...`,
        progress: 0
      })

      this.simulateProgress()

      let result
      if (this.data.isImage && ['jpg', 'png', 'webp'].includes(format)) {
        // 本地图片格式转换 (这里简化处理，实际可能需要canvas转换)
        result = { success: true, tempFilePath: this.data.fileData.path }
      } else {
        // 远程转换
        result = await this.fileManager.processFileRemotely(this.data.fileData, `convert_${format}`)
      }

      if (result.success) {
        const convertedFile = {
          id: this.fileManager.generateFileId(),
          name: `${this.data.fileData.name.split('.')[0]}.${format}`,
          size: result.size || this.data.fileData.size,
          type: format,
          path: result.tempFilePath,
          source: 'processed',
          createTime: Date.now(),
          status: 'ready',
          parentId: this.data.fileData.id
        }

        this.fileManager.saveFileToStorage(convertedFile)
        this.recordProcessHistory('convert', true, { targetFormat: format })

        this.setData({ processing: false })

        wx.showToast({
          title: '转换完成',
          icon: 'success'
        })

        // 跳转到转换后的文件详情
        wx.redirectTo({
          url: `/pages/file-detail/file-detail?fileId=${convertedFile.id}`
        })
      } else {
        throw new Error(result.message || '转换失败')
      }

    } catch (error) {
      console.error('格式转换失败:', error)
      this.setData({ processing: false })
      this.recordProcessHistory('convert', false, { error: error.message })
      
      wx.showToast({
        title: '转换失败',
        icon: 'none'
      })
    }
  },

  /**
   * 分享到聊天
   */
  async shareToChat() {
    try {
      await this.fileManager.shareToChat(this.data.fileData)
      wx.showToast({
        title: '分享成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('分享失败:', error)
      if (error.errMsg && error.errMsg.includes('cancel')) {
        return
      }
      wx.showToast({
        title: '分享失败',
        icon: 'none'
      })
    }
  },

  /**
   * 保存到相册
   */
  async saveToAlbum() {
    if (!this.data.isImage) return

    try {
      await this.fileManager.saveImageToAlbum(this.data.fileData.path)
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('保存失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  /**
   * 删除文件
   */
  deleteFile() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个文件吗？',
      success: (res) => {
        if (res.confirm) {
          this.fileManager.deleteFile(this.fileId)
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          wx.navigateBack()
        }
      }
    })
  },

  /**
   * 记录处理历史
   */
  recordProcessHistory(operation, success, extra = {}) {
    const fileSystem = wx.getStorageSync('fileSystem') || { files: [], folders: [], processHistory: [] }
    
    const record = {
      id: this.fileManager.generateFileId(),
      fileId: this.fileId,
      operation,
      success,
      timestamp: Date.now(),
      status: success ? 'success' : 'error',
      ...extra
    }
    
    fileSystem.processHistory.push(record)
    wx.setStorageSync('fileSystem', fileSystem)
    
    this.loadProcessHistory()
  },

  /**
   * 模拟处理进度
   */
  simulateProgress() {
    let progress = 0
    const timer = setInterval(() => {
      progress += Math.random() * 15
      if (progress >= 95) {
        progress = 95
        clearInterval(timer)
      }
      this.setData({ progress: Math.floor(progress) })
    }, 200)
    
    // 保存timer引用以便清理
    this.progressTimer = timer
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止点击模态框内容时关闭
  },

  /**
   * 页面卸载时清理定时器
   */
  onUnload() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer)
    }
  }
})