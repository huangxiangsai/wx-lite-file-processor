// pages/file-list/file-list.js
const FileManager = require('../../utils/fileManager.js')

Page({
  data: {
    allFiles: [],
    filteredFiles: [],
    selectedFiles: [],
    searchKeyword: '',
    currentFilter: 'all',
    filterOptions: [],
    showActionMenu: false,
    showFilterModal: false,
    showRenameModal: false,
    currentFile: null,
    renameValue: '',
    
    // 筛选条件
    typeFilter: 'all',
    sourceFilter: 'all',
    sortIndex: 0,
    
    // 筛选选项
    fileTypes: [],
    sortOptions: [
      { value: 'time_desc', label: '按时间降序' },
      { value: 'time_asc', label: '按时间升序' },
      { value: 'name_asc', label: '按名称升序' },
      { value: 'name_desc', label: '按名称降序' },
      { value: 'size_desc', label: '按大小降序' },
      { value: 'size_asc', label: '按大小升序' }
    ],
    
    // 空状态
    emptyStateTitle: '暂无文件',
    emptyStateDesc: '点击下方按钮添加文件开始使用'
  },

  fileManager: null,

  onLoad() {
    this.fileManager = new FileManager()
  },

  onShow() {
    this.loadFileList()
  },

  /**
   * 加载文件列表
   */
  loadFileList() {
    const files = this.fileManager.getAllFiles()
    
    // 处理文件数据，添加展示需要的字段
    const processedFiles = files.map(file => ({
      ...file,
      icon: this.fileManager.getFileIcon(file.type),
      formattedSize: this.fileManager.formatFileSize(file.size),
      timeText: this.formatTime(file.createTime),
      sourceText: this.getSourceText(file.source),
      statusText: this.getStatusText(file.status)
    }))

    // 获取文件类型列表
    const fileTypes = [...new Set(files.map(file => file.type.toLowerCase()))]
    
    // 生成筛选选项
    const filterOptions = this.generateFilterOptions(processedFiles)

    this.setData({
      allFiles: processedFiles,
      fileTypes,
      filterOptions
    })

    this.applyFilters()
  },

  /**
   * 生成筛选选项
   */
  generateFilterOptions(files) {
    const typeCount = {}
    const sourceCount = {}
    
    files.forEach(file => {
      const type = file.type.toLowerCase()
      const source = file.source
      
      typeCount[type] = (typeCount[type] || 0) + 1
      sourceCount[source] = (sourceCount[source] || 0) + 1
    })

    const options = []
    
    // 按类型筛选
    Object.entries(typeCount).forEach(([type, count]) => {
      options.push({
        value: `type_${type}`,
        label: type.toUpperCase(),
        count
      })
    })
    
    // 按来源筛选
    const sourceLabels = {
      'chat': '聊天记录',
      'local': '本地选择',
      'processed': '处理结果'
    }
    
    Object.entries(sourceCount).forEach(([source, count]) => {
      options.push({
        value: `source_${source}`,
        label: sourceLabels[source] || source,
        count
      })
    })

    return options
  },

  /**
   * 格式化时间
   */
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) {
      return '刚刚'
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`
    } else if (diff < 2592000000) {
      return `${Math.floor(diff / 86400000)}天前`
    } else {
      return date.toLocaleDateString()
    }
  },

  /**
   * 获取来源文本
   */
  getSourceText(source) {
    const sourceMap = {
      'chat': '聊天记录',
      'local': '本地选择',
      'processed': '处理结果'
    }
    return sourceMap[source] || source
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
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    this.applyFilters()
  },

  /**
   * 设置筛选条件
   */
  setFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ currentFilter: filter })
    this.applyFilters()
  },

  /**
   * 应用筛选条件
   */
  applyFilters() {
    let filtered = [...this.data.allFiles]
    
    // 搜索筛选
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase()
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(keyword)
      )
    }
    
    // 类型筛选
    if (this.data.typeFilter !== 'all') {
      filtered = filtered.filter(file => 
        file.type.toLowerCase() === this.data.typeFilter
      )
    }
    
    // 来源筛选
    if (this.data.sourceFilter !== 'all') {
      filtered = filtered.filter(file => 
        file.source === this.data.sourceFilter
      )
    }
    
    // 通用筛选
    if (this.data.currentFilter !== 'all') {
      if (this.data.currentFilter.startsWith('type_')) {
        const type = this.data.currentFilter.replace('type_', '')
        filtered = filtered.filter(file => file.type.toLowerCase() === type)
      } else if (this.data.currentFilter.startsWith('source_')) {
        const source = this.data.currentFilter.replace('source_', '')
        filtered = filtered.filter(file => file.source === source)
      }
    }
    
    // 排序
    const sortOption = this.data.sortOptions[this.data.sortIndex]
    filtered.sort((a, b) => {
      switch (sortOption.value) {
        case 'time_desc':
          return b.createTime - a.createTime
        case 'time_asc':
          return a.createTime - b.createTime
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'name_desc':
          return b.name.localeCompare(a.name)
        case 'size_desc':
          return b.size - a.size
        case 'size_asc':
          return a.size - b.size
        default:
          return 0
      }
    })

    // 更新空状态信息
    let emptyStateTitle = '暂无文件'
    let emptyStateDesc = '点击下方按钮添加文件开始使用'
    
    if (this.data.searchKeyword) {
      emptyStateTitle = '未找到相关文件'
      emptyStateDesc = `没有找到包含"${this.data.searchKeyword}"的文件`
    } else if (this.data.currentFilter !== 'all') {
      emptyStateTitle = '暂无此类文件'
      emptyStateDesc = '尝试切换其他筛选条件'
    }

    this.setData({
      filteredFiles: filtered,
      emptyStateTitle,
      emptyStateDesc
    })
  },

  /**
   * 打开文件详情
   */
  openFile(e) {
    const file = e.currentTarget.dataset.file
    wx.navigateTo({
      url: `/pages/file-detail/file-detail?fileId=${file.id}`
    })
  },

  /**
   * 添加文件
   */
  addFiles() {
    wx.showActionSheet({
      itemList: ['从聊天记录选择', '从本地选择'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.selectFromChat()
        } else if (res.tapIndex === 1) {
          this.selectFromLocal()
        }
      }
    })
  },

  /**
   * 从聊天记录选择文件
   */
  async selectFromChat() {
    try {
      const files = await this.fileManager.selectFileFromChat()
      files.forEach(file => {
        this.fileManager.saveFileToStorage(file)
      })
      
      if (files.length > 0) {
        wx.showToast({
          title: `已添加 ${files.length} 个文件`,
          icon: 'success'
        })
        this.loadFileList()
      }
    } catch (error) {
      console.error('选择文件失败:', error)
      if (!error.errMsg || !error.errMsg.includes('cancel')) {
        wx.showToast({
          title: '选择文件失败',
          icon: 'none'
        })
      }
    }
  },

  /**
   * 从本地选择文件
   */
  async selectFromLocal() {
    try {
      const files = await this.fileManager.selectLocalFile()
      files.forEach(file => {
        this.fileManager.saveFileToStorage(file)
      })
      
      if (files.length > 0) {
        wx.showToast({
          title: `已添加 ${files.length} 个文件`,
          icon: 'success'
        })
        this.loadFileList()
      }
    } catch (error) {
      console.error('选择本地文件失败:', error)
      if (!error.errMsg || !error.errMsg.includes('cancel')) {
        wx.showToast({
          title: '选择文件失败',
          icon: 'none'
        })
      }
    }
  },

  /**
   * 显示操作菜单
   */
  showActionMenu(e) {
    const file = e.currentTarget.dataset.file
    this.setData({
      showActionMenu: true,
      currentFile: file
    })
  },

  /**
   * 隐藏操作菜单
   */
  hideActionMenu() {
    this.setData({ showActionMenu: false })
  },

  /**
   * 预览文件
   */
  previewFile() {
    this.fileManager.previewFile(this.data.currentFile)
    this.hideActionMenu()
  },

  /**
   * 分享文件
   */
  async shareFile() {
    try {
      await this.fileManager.shareToChat(this.data.currentFile)
      wx.showToast({
        title: '分享成功',
        icon: 'success'
      })
    } catch (error) {
      if (!error.errMsg || !error.errMsg.includes('cancel')) {
        wx.showToast({
          title: '分享失败',
          icon: 'none'
        })
      }
    }
    this.hideActionMenu()
  },

  /**
   * 重命名文件
   */
  renameFile() {
    const fileName = this.data.currentFile.name
    const nameWithoutExt = fileName.includes('.') 
      ? fileName.substring(0, fileName.lastIndexOf('.'))
      : fileName
      
    this.setData({
      showRenameModal: true,
      renameValue: nameWithoutExt
    })
    this.hideActionMenu()
  },

  /**
   * 删除文件
   */
  deleteFile() {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除文件"${this.data.currentFile.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.fileManager.deleteFile(this.data.currentFile.id)
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          this.loadFileList()
        }
      }
    })
    this.hideActionMenu()
  },

  /**
   * 显示筛选选项
   */
  showFilterOptions() {
    this.setData({ showFilterModal: true })
  },

  /**
   * 隐藏筛选选项
   */
  hideFilterOptions() {
    this.setData({ showFilterModal: false })
  },

  /**
   * 设置类型筛选
   */
  setTypeFilter(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ typeFilter: type })
  },

  /**
   * 设置来源筛选
   */
  setSourceFilter(e) {
    const source = e.currentTarget.dataset.source
    this.setData({ sourceFilter: source })
  },

  /**
   * 设置排序选项
   */
  setSortOption(e) {
    this.setData({ sortIndex: e.detail.value })
  },

  /**
   * 重置筛选条件
   */
  resetFilters() {
    this.setData({
      typeFilter: 'all',
      sourceFilter: 'all',
      sortIndex: 0
    })
  },

  /**
   * 应用筛选条件
   */
  applyFilters() {
    this.hideFilterOptions()
    this.applyFilters()
  },

  /**
   * 重命名输入
   */
  onRenameInput(e) {
    this.setData({ renameValue: e.detail.value })
  },

  /**
   * 确认重命名
   */
  confirmRename() {
    const newName = this.data.renameValue.trim()
    if (!newName) {
      wx.showToast({
        title: '文件名不能为空',
        icon: 'none'
      })
      return
    }

    // 添加原文件扩展名
    const currentFile = this.data.currentFile
    const extension = currentFile.name.includes('.') 
      ? currentFile.name.substring(currentFile.name.lastIndexOf('.'))
      : ''
    const fullNewName = newName + extension

    // 更新文件名
    const fileSystem = wx.getStorageSync('fileSystem') || { files: [] }
    const fileIndex = fileSystem.files.findIndex(f => f.id === currentFile.id)
    if (fileIndex !== -1) {
      fileSystem.files[fileIndex].name = fullNewName
      wx.setStorageSync('fileSystem', fileSystem)
      
      wx.showToast({
        title: '重命名成功',
        icon: 'success'
      })
      
      this.loadFileList()
    }

    this.hideRenameModal()
  },

  /**
   * 隐藏重命名弹窗
   */
  hideRenameModal() {
    this.setData({ showRenameModal: false })
  },

  /**
   * 批量删除
   */
  batchDelete() {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${this.data.selectedFiles.length} 个文件吗？`,
      success: (res) => {
        if (res.confirm) {
          this.data.selectedFiles.forEach(fileId => {
            this.fileManager.deleteFile(fileId)
          })
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          
          this.setData({ selectedFiles: [] })
          this.loadFileList()
        }
      }
    })
  },

  /**
   * 批量分享
   */
  batchShare() {
    wx.showToast({
      title: '批量分享功能开发中',
      icon: 'none'
    })
  },

  /**
   * 清除选择
   */
  clearSelection() {
    this.setData({ selectedFiles: [] })
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止点击模态框内容时关闭
  }
})