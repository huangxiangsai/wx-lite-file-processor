// 文件管理工具类
class FileManager {
  constructor() {
    this.apiBaseUrl = getApp().globalData.apiBaseUrl
    this.supportedFormats = getApp().globalData.supportedFormats
  }

  /**
   * 从聊天记录中选择文件
   */
  async selectFileFromChat() {
    return new Promise((resolve, reject) => {
      wx.chooseMessageFile({
        count: 10,
        type: 'all',
        success: (res) => {
          const files = res.tempFiles.map(file => ({
            id: this.generateFileId(),
            name: file.name,
            size: file.size,
            type: this.getFileType(file.name),
            path: file.path,
            source: 'chat',
            createTime: Date.now(),
            status: 'ready'
          }))
          resolve(files)
        },
        fail: reject
      })
    })
  }

  /**
   * 选择本地文件
   */
  async selectLocalFile() {
    return new Promise((resolve, reject) => {
      wx.chooseMedia({
        count: 9,
        mediaType: ['image', 'video'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const files = res.tempFiles.map(file => ({
            id: this.generateFileId(),
            name: `media_${Date.now()}.${this.getExtension(file.tempFilePath)}`,
            size: file.size,
            type: this.getFileType(file.tempFilePath),
            path: file.tempFilePath,
            source: 'local',
            createTime: Date.now(),
            status: 'ready'
          }))
          resolve(files)
        },
        fail: reject
      })
    })
  }

  /**
   * 保存文件到本地存储
   */
  saveFileToStorage(file) {
    const fileSystem = wx.getStorageSync('fileSystem') || { files: [], folders: [], processHistory: [] }
    fileSystem.files.push(file)
    wx.setStorageSync('fileSystem', fileSystem)
    return file
  }

  /**
   * 获取所有文件
   */
  getAllFiles() {
    const fileSystem = wx.getStorageSync('fileSystem') || { files: [], folders: [], processHistory: [] }
    return fileSystem.files
  }

  /**
   * 删除文件
   */
  deleteFile(fileId) {
    const fileSystem = wx.getStorageSync('fileSystem') || { files: [], folders: [], processHistory: [] }
    fileSystem.files = fileSystem.files.filter(file => file.id !== fileId)
    wx.setStorageSync('fileSystem', fileSystem)
  }

  /**
   * 判断文件是否需要远程处理
   */
  needsRemoteProcessing(fileType) {
    return this.supportedFormats.remote.includes(fileType.toLowerCase())
  }

  /**
   * 本地图片压缩
   */
  async compressImage(filePath, quality = 0.8) {
    return new Promise((resolve, reject) => {
      wx.compressImage({
        src: filePath,
        quality: quality * 100,
        success: resolve,
        fail: reject
      })
    })
  }

  /**
   * 远程文件处理
   */
  async processFileRemotely(file, operation) {
    const uploadResult = await this.uploadFile(file)
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.apiBaseUrl}/process`,
        method: 'POST',
        data: {
          fileId: uploadResult.fileId,
          operation: operation,
          fileName: file.name,
          fileType: file.type
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(new Error('处理失败'))
          }
        },
        fail: reject
      })
    })
  }

  /**
   * 上传文件到服务器
   */
  async uploadFile(file) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${this.apiBaseUrl}/upload`,
        filePath: file.path,
        name: 'file',
        formData: {
          fileName: file.name,
          fileType: file.type
        },
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.success) {
            resolve(data)
          } else {
            reject(new Error(data.message))
          }
        },
        fail: reject
      })
    })
  }

  /**
   * 下载处理后的文件
   */
  async downloadProcessedFile(fileId, fileName) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: `${this.apiBaseUrl}/download/${fileId}`,
        success: (res) => {
          if (res.statusCode === 200) {
            // 保存到本地临时文件
            const savedFile = {
              id: this.generateFileId(),
              name: fileName,
              path: res.tempFilePath,
              type: this.getFileType(fileName),
              source: 'processed',
              createTime: Date.now(),
              status: 'ready'
            }
            resolve(savedFile)
          } else {
            reject(new Error('下载失败'))
          }
        },
        fail: reject
      })
    })
  }

  /**
   * 分享文件到聊天
   */
  async shareToChat(file) {
    return new Promise((resolve, reject) => {
      wx.shareFileMessage({
        filePath: file.path,
        fileName: file.name,
        success: resolve,
        fail: reject
      })
    })
  }

  /**
   * 保存图片到相册
   */
  async saveImageToAlbum(imagePath) {
    return new Promise((resolve, reject) => {
      wx.saveImageToPhotosAlbum({
        filePath: imagePath,
        success: resolve,
        fail: reject
      })
    })
  }

  /**
   * 预览文件
   */
  previewFile(file) {
    if (this.isImage(file.type)) {
      wx.previewImage({
        urls: [file.path],
        current: file.path
      })
    } else {
      wx.openDocument({
        filePath: file.path,
        fileType: file.type,
        success: () => {
          console.log('文档打开成功')
        },
        fail: (err) => {
          wx.showToast({
            title: '无法预览此文件',
            icon: 'none'
          })
        }
      })
    }
  }

  // 工具方法
  generateFileId() {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  getFileType(fileName) {
    const extension = this.getExtension(fileName)
    return extension.toLowerCase()
  }

  getExtension(fileName) {
    return fileName.split('.').pop() || ''
  }

  isImage(fileType) {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType.toLowerCase())
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  getFileIcon(fileType) {
    const iconMap = {
      'pdf': '/images/icons/pdf.png',
      'doc': '/images/icons/doc.png',
      'docx': '/images/icons/doc.png',
      'xls': '/images/icons/xls.png',
      'xlsx': '/images/icons/xls.png',
      'zip': '/images/icons/zip.png',
      'rar': '/images/icons/zip.png',
      '7z': '/images/icons/zip.png',
      'jpg': '/images/icons/image.png',
      'jpeg': '/images/icons/image.png',
      'png': '/images/icons/image.png',
      'gif': '/images/icons/image.png',
      'txt': '/images/icons/txt.png',
      'default': '/images/icons/file.png'
    }
    return iconMap[fileType.toLowerCase()] || iconMap.default
  }
}

module.exports = FileManager