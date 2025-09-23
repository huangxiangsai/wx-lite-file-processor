# wx-lite-file-processor

微信小程序文件处理工具，支持文件压缩、解压、格式转换等功能。

## 开发命令

### 微信开发者工具
- 使用微信开发者工具打开项目进行开发和调试
- 项目配置文件：`project.config.json`
- AppID需要在project.config.json中配置

### 本地开发
```bash
# 在微信开发者工具中：
# 1. 打开项目目录
# 2. 选择小程序项目
# 3. 填入AppID或选择测试号
# 4. 点击确定开始开发
```

## 项目架构

### 核心文件结构
```
├── app.js                 # 应用入口，全局配置和初始化
├── app.json              # 应用配置，页面路由和权限
├── app.wxss              # 全局样式
├── utils/fileManager.js  # 文件管理核心类
└── pages/                # 页面目录
    ├── index/            # 首页 - 文件选择和快速操作
    ├── file-list/        # 文件管理 - 文件列表和批量操作  
    ├── file-detail/      # 文件详情 - 单文件处理操作
    └── settings/         # 设置 - 配置和数据管理
```

### 数据存储架构
使用微信小程序本地存储：
- `fileSystem`: 主要数据结构，包含files、folders、processHistory
- `appSettings`: 应用设置，压缩质量、API配置等
- `apiBaseUrl`: API服务器地址
- `firstUseTime`: 首次使用时间，用于统计

### 文件处理流程
1. **文件选择**: 通过`wx.chooseMessageFile`或`wx.chooseMedia`选择文件
2. **本地处理**: 图片压缩等简单操作直接在小程序内完成
3. **远程处理**: RAR解压、PDF转图片等复杂操作调用后端API
4. **结果管理**: 处理结果保存到本地存储，支持预览、分享、再处理

### API集成
后端API需要提供以下接口：
- `GET /health` - 健康检查
- `POST /upload` - 文件上传
- `POST /process` - 文件处理（解压、转换等）
- `GET /download/:fileId` - 处理结果下载

## 开发要点

### 文件类型支持
- **本地处理**: jpg, jpeg, png, gif, txt, json
- **远程处理**: rar, zip, 7z, pdf, docx, xlsx

### 权限配置
确保app.json中包含必要权限：
- `scope.writePhotosAlbum`: 保存图片到相册

### 错误处理
- 所有异步操作都有try-catch包装
- 用户取消操作不显示错误提示
- 网络错误和API错误分别处理

### 性能优化
- 大文件处理显示进度条
- 文件列表支持搜索和筛选
- 使用wx.getStorageSync进行数据持久化

### 关键组件
- `FileManager类`: 核心文件管理功能，包括选择、处理、存储
- `处理历史`: 记录所有文件操作，支持统计和回溯
- `设置管理`: API配置、压缩质量、数据清理等

## API服务器部署
需要部署支持HTTPS的后端服务，处理复杂文件操作。参考README.md中的API接口文档和示例代码。