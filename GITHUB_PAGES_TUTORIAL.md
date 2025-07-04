# GitHub Pages 部署详细教程

## 前提条件
- 拥有 GitHub 账号
- 项目代码已推送到 GitHub 仓库

## 步骤 1: 准备项目

### 1.1 确保项目结构正确
您的项目结构应该是：
```
webTest/
├── src/
├── public/
├── package.json
├── vite.config.ts
├── .github/workflows/deploy.yml  ← 已创建
└── index.html
```

### 1.2 检查 package.json
确保 `package.json` 中有正确的构建脚本：
```json
{
  "scripts": {
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

## 步骤 2: 推送代码到 GitHub

### 2.1 初始化 Git 仓库（如果还没有）
```bash
git init
git add .
git commit -m "Initial commit"
```

### 2.2 创建 GitHub 仓库
1. 访问 [GitHub.com](https://github.com)
2. 点击右上角的 "+" 号，选择 "New repository"
3. 输入仓库名称（例如：`web-test`）
4. 选择 "Public"（GitHub Pages 需要公开仓库）
5. 不要勾选 "Add a README file"（因为您已经有项目了）
6. 点击 "Create repository"

### 2.3 推送代码
```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

## 步骤 3: 配置 GitHub Pages

### 3.1 启用 GitHub Pages
1. 在您的 GitHub 仓库页面，点击 "Settings" 标签
2. 在左侧菜单中找到 "Pages"
3. 在 "Source" 部分，选择 "Deploy from a branch"
4. 在 "Branch" 下拉菜单中选择 "gh-pages"
5. 点击 "Save"

### 3.2 等待自动部署
- GitHub Actions 会自动运行部署流程
- 您可以在 "Actions" 标签页查看部署进度
- 部署完成后，您的网站将在 `https://你的用户名.github.io/仓库名` 上线

## 步骤 4: 验证部署

### 4.1 检查 Actions 状态
1. 在仓库页面点击 "Actions" 标签
2. 查看最新的工作流运行状态
3. 如果看到绿色勾号，说明部署成功

### 4.2 访问您的网站
- 部署成功后，等待几分钟让 DNS 生效
- 访问 `https://你的用户名.github.io/仓库名`
- 您的地图应用应该可以正常显示

## 步骤 5: 自定义域名（可选）

### 5.1 购买域名
如果您有自己的域名，可以设置自定义域名

### 5.2 配置自定义域名
1. 在仓库的 "Settings" → "Pages" 中
2. 在 "Custom domain" 部分输入您的域名
3. 点击 "Save"
4. 在您的域名提供商处添加 CNAME 记录，指向 `你的用户名.github.io`

## 常见问题解决

### 问题 1: 部署失败
**解决方案**：
1. 检查 "Actions" 标签页的错误信息
2. 确保所有依赖都正确安装
3. 检查构建脚本是否正确

### 问题 2: 网站显示 404
**解决方案**：
1. 确保选择了正确的分支（gh-pages）
2. 等待几分钟让部署完成
3. 检查 URL 是否正确

### 问题 3: 地图不显示
**解决方案**：
1. 检查浏览器控制台是否有错误
2. 确保 GeoJSON 文件路径正确
3. 检查是否有 CORS 问题

### 问题 4: 样式问题
**解决方案**：
1. 确保 CSS 文件正确加载
2. 检查 Vite 配置是否正确
3. 清除浏览器缓存

## 更新网站

每次您想要更新网站时：
1. 修改代码
2. 提交并推送到 GitHub：
   ```bash
   git add .
   git commit -m "Update website"
   git push
   ```
3. GitHub Actions 会自动重新部署

## 监控部署状态

- **Actions 标签页**: 查看部署进度和日志
- **Settings → Pages**: 查看部署状态和设置
- **仓库主页**: 查看最新的提交和分支

## 性能优化建议

1. **压缩图片**: 确保 GeoJSON 文件大小合理
2. **启用缓存**: 利用浏览器缓存提高加载速度
3. **CDN**: GitHub Pages 已经提供了全球 CDN

## 安全注意事项

1. **不要提交敏感信息**: 确保没有 API 密钥等敏感信息
2. **定期更新依赖**: 保持依赖包的最新版本
3. **监控访问日志**: 关注网站的访问情况

---

## 快速检查清单

- [ ] 代码已推送到 GitHub
- [ ] 仓库设置为 Public
- [ ] GitHub Pages 已启用
- [ ] 选择了 gh-pages 分支
- [ ] Actions 工作流运行成功
- [ ] 网站可以正常访问
- [ ] 地图功能正常工作

完成以上步骤后，您的网站就可以通过 `https://你的用户名.github.io/仓库名` 访问了！ 