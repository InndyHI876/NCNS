# GitHub Pages 部署指南

## 问题说明
您遇到的错误是因为GitHub Pages无法直接处理TypeScript文件（.tsx）。GitHub Pages需要的是编译后的静态文件。

## 解决方案

### 方法1：使用GitHub Actions自动部署（推荐）

1. **确保您的仓库设置正确**：
   - 进入仓库的 Settings > Pages
   - Source 选择 "GitHub Actions"

2. **推送代码到master分支**：
   ```bash
   git add .
   git commit -m "Add GitHub Actions deployment"
   git push origin master
   ```

3. **查看部署状态**：
   - 进入仓库的 Actions 标签页
   - 查看 "Deploy to GitHub Pages" 工作流是否成功运行

### 方法2：手动部署

1. **本地构建项目**：
   ```bash
   npm run build
   ```

2. **将构建文件推送到gh-pages分支**：
   ```bash
   # 安装gh-pages包
   npm install --save-dev gh-pages
   
   # 添加部署脚本到package.json
   # "deploy": "gh-pages -d dist"
   
   # 部署
   npm run deploy
   ```

## 配置说明

### vite.config.ts
- `base: '/NCNS/'` - 确保与您的仓库名称匹配
- 这个配置告诉Vite在构建时使用正确的base路径

### GitHub Actions工作流
- 自动在每次推送到master分支时构建和部署
- 使用最新的Node.js和GitHub Actions版本
- 包含适当的权限设置

## 常见问题

1. **页面仍然空白**：
   - 检查浏览器控制台是否有404错误
   - 确认base路径配置正确
   - 检查GitHub Actions是否成功完成

2. **资源加载失败**：
   - 确保所有静态资源路径都是相对路径
   - 检查CSS和JS文件是否正确加载

3. **部署后需要等待**：
   - GitHub Pages部署可能需要几分钟时间
   - 清除浏览器缓存后重试

## 验证部署

部署成功后，您应该能够访问：
`https://inndyhi876.github.io/NCNS/`

如果仍然有问题，请检查：
1. GitHub Actions日志
2. 浏览器开发者工具的网络和控制台标签
3. 确认所有文件都正确上传到gh-pages分支 