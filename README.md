# 微信小程序文件处理工具

一个功能强大的微信小程序，支持文件压缩、解压、格式转换等多种文件处理功能。

## 功能特性

### 📁 文件管理
- 支持从聊天记录选择文件
- 支持从本地相册/文件选择
- 文件列表管理和搜索
- 文件预览和分享功能

### 🔧 文件处理
- **图片压缩**: 本地图片压缩，可调节压缩质量
- **解压缩**: 支持ZIP、RAR、7Z等格式解压（需要后端API）
- **PDF转图片**: 将PDF按页转换为图片（需要后端API）
- **格式转换**: 支持多种文件格式转换

### 💾 数据管理
- 本地文件存储和管理
- 处理历史记录
- 使用统计和存储管理

### ⚙️ 设置功能
- 压缩质量调节
- API服务器配置
- 数据清理和管理

## 项目结构

```
wx-lite-file-processor/
├── app.js                 # 应用入口
├── app.json              # 应用配置
├── app.wxss              # 全局样式
├── utils/
│   └── fileManager.js    # 文件管理工具类
├── pages/
│   ├── index/            # 首页
│   ├── file-list/        # 文件列表页
│   ├── file-detail/      # 文件详情页
│   └── settings/         # 设置页
├── images/               # 图片资源
├── project.config.json   # 项目配置
└── sitemap.json         # 站点地图
```

## 开发指南

### 本地开发
1. 使用微信开发者工具打开项目
2. 配置AppID（在project.config.json中）
3. 启动开发服务器

### API配置
小程序需要配置后端API服务器来处理复杂的文件操作：

```javascript
// app.js 中配置API地址
globalData: {
  apiBaseUrl: 'https://your-api-domain.com/api'
}
```

### 支持的API接口

#### 1. 健康检查
```
GET /health
Response: { "status": "ok" }
```

#### 2. 文件上传
```
POST /upload
Content-Type: multipart/form-data
Body: file (文件), fileName (文件名), fileType (文件类型)
Response: { "success": true, "fileId": "xxx", "message": "上传成功" }
```

#### 3. 文件处理
```
POST /process
Body: {
  "fileId": "xxx",
  "operation": "extract|pdf2images|convert_xxx",
  "fileName": "xxx",
  "fileType": "xxx"
}
Response: { 
  "success": true, 
  "files": [...] | "images": [...],
  "message": "处理完成" 
}
```

#### 4. 文件下载
```
GET /download/:fileId
Response: 文件流
```

### 后端API示例（Node.js + Express）

```javascript
const express = require('express');
const multer = require('multer');
const app = express();

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 文件上传
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('file'), (req, res) => {
  const fileId = Date.now().toString();
  // 保存文件信息到数据库
  res.json({ 
    success: true, 
    fileId: fileId,
    message: '上传成功' 
  });
});

// 文件处理
app.post('/process', (req, res) => {
  const { fileId, operation } = req.body;
  
  switch(operation) {
    case 'extract':
      // 解压缩逻辑
      break;
    case 'pdf2images':
      // PDF转图片逻辑
      break;
    default:
      // 其他处理逻辑
  }
  
  res.json({ success: true, files: [] });
});

// 文件下载
app.get('/download/:fileId', (req, res) => {
  // 返回文件流
});
```

## 部署说明

### 小程序部署
1. 在微信开发者工具中点击"上传"
2. 填写版本号和项目备注
3. 在微信公众平台提交审核

### API服务器部署
1. 部署后端API服务器
2. 配置HTTPS证书（小程序要求）
3. 在小程序中更新API地址

## 开发注意事项

### 权限配置
确保在app.json中配置了必要的权限：
```json
{
  "permission": {
    "scope.writePhotosAlbum": {
      "desc": "保存图片到相册"
    }
  }
}
```

### 文件格式支持
- **本地处理**: JPG, JPEG, PNG, GIF, TXT, JSON
- **远程处理**: RAR, ZIP, 7Z, PDF, DOCX, XLSX

### 存储管理
- 使用wx.getStorageSync/wx.setStorageSync进行数据持久化
- 定期清理临时文件和缓存
- 监控存储空间使用情况

## 常见问题

### Q: 为什么某些文件格式无法处理？
A: 复杂的文件格式（如RAR、PDF）需要后端API支持，请确保API服务器正常运行。

### Q: 如何自定义压缩质量？
A: 在设置页面可以调节图片压缩质量，范围为10%-100%。

### Q: 文件处理失败怎么办？
A: 检查网络连接和API服务器状态，查看处理历史中的错误信息。

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持基本文件管理功能
- 实现图片压缩和文件分享
- 添加设置和统计功能

## 许可证

MIT License

## 联系方式

- 开发者：Your Name
- 邮箱：your-email@example.com
- 微信：your-wechat-id