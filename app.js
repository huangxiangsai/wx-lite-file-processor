// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化文件管理系统
    this.initFileSystem()
  },

  initFileSystem() {
    // 初始化本地文件存储结构
    const fileSystem = wx.getStorageSync('fileSystem') || {
      files: [],
      folders: [],
      processHistory: []
    }
    wx.setStorageSync('fileSystem', fileSystem)
  },

  globalData: {
    userInfo: null,
    apiBaseUrl: 'https://your-api-domain.com/api', // 替换为实际API地址
    supportedFormats: {
      // 本地支持的格式
      local: ['jpg', 'jpeg', 'png', 'gif', 'txt', 'json'],
      // 需要远程处理的格式
      remote: ['rar', 'zip', '7z', 'pdf', 'docx', 'xlsx']
    }
  }
})