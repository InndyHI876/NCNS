# 快速解决GitHub Pages空白页面问题

## 立即解决步骤

### 1. 安装依赖并构建
```bash
npm install
npm run build
```

### 2. 推送代码到GitHub
```bash
git add .
git commit -m "Fix GitHub Pages deployment"
git push origin master
```

### 3. 配置GitHub Pages
1. 进入您的GitHub仓库
2. 点击 Settings > Pages
3. Source 选择 "GitHub Actions"
4. 保存设置

### 4. 等待自动部署
- GitHub Actions会自动构建和部署您的项目
- 查看 Actions 标签页确认部署成功
- 等待几分钟后访问：`https://inndyhi876.github.io/NCNS/`

## 如果仍然有问题

### 检查构建输出
```bash
# 本地测试构建结果
npm run build
npm run preview
```

### 手动部署（备选方案）
```bash
npm install gh-pages --save-dev
npm run deploy
```

## 关键配置检查

确保以下文件配置正确：

1. **vite.config.ts** - base路径设置为 `/NCNS/`
2. **package.json** - 包含构建和部署脚本
3. **.github/workflows/deploy.yml** - GitHub Actions工作流

## 常见错误解决

- **MIME类型错误**：这是因为GitHub Pages无法处理.tsx文件，需要先构建
- **404错误**：检查base路径配置
- **资源加载失败**：确保所有路径都是相对路径

## 验证成功

部署成功后，您应该看到：
- GitHub Actions显示绿色勾号
- 页面正常加载，没有控制台错误
- 地图和所有功能正常工作 