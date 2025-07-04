# GitHub Pages 快速部署指南

## 🚀 立即开始部署

### 步骤 1: 创建 GitHub 仓库

1. 访问 [GitHub.com](https://github.com) 并登录
2. 点击右上角的 "+" 号，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `web-test` (或您喜欢的名称)
   - **Description**: `Map visualization web application`
   - **Visibility**: 选择 **Public** (GitHub Pages 需要公开仓库)
   - **不要**勾选 "Add a README file"
4. 点击 "Create repository"

### 步骤 2: 推送代码到 GitHub

在您的项目目录中运行以下命令：

```bash
# 添加远程仓库（替换为您的实际仓库地址）
git remote add origin https://github.com/您的用户名/仓库名.git

# 推送代码到 GitHub
git push -u origin master
```

### 步骤 3: 启用 GitHub Pages

1. 在您的 GitHub 仓库页面，点击 "Settings" 标签
2. 在左侧菜单中找到 "Pages"
3. 在 "Source" 部分：
   - 选择 "Deploy from a branch"
   - Branch 选择 "gh-pages"
   - 点击 "Save"

### 步骤 4: 等待自动部署

- GitHub Actions 会自动运行部署流程
- 您可以在 "Actions" 标签页查看进度
- 部署完成后，您的网站将在 `https://您的用户名.github.io/仓库名` 上线

## 📋 具体操作命令

### 如果您还没有创建 GitHub 仓库：

```bash
# 1. 确保所有文件已提交
git add .
git commit -m "Add deployment configuration"

# 2. 添加远程仓库（替换为您的实际仓库地址）
git remote add origin https://github.com/您的用户名/仓库名.git

# 3. 推送代码
git push -u origin master
```

### 如果您已经创建了 GitHub 仓库：

```bash
# 1. 添加远程仓库
git remote add origin https://github.com/您的用户名/仓库名.git

# 2. 推送代码
git push -u origin master
```

## 🔍 验证部署

1. **检查 Actions**: 在仓库页面点击 "Actions" 标签，查看部署状态
2. **访问网站**: 部署成功后访问 `https://您的用户名.github.io/仓库名`
3. **测试功能**: 确保地图和所有功能正常工作

## 🛠️ 故障排除

### 如果推送失败：
```bash
# 检查远程仓库配置
git remote -v

# 如果配置错误，重新设置
git remote remove origin
git remote add origin https://github.com/您的用户名/仓库名.git
```

### 如果部署失败：
1. 检查 "Actions" 标签页的错误信息
2. 确保仓库设置为 Public
3. 确保选择了正确的分支（gh-pages）

## 📞 需要帮助？

如果遇到问题，请检查：
- [ ] GitHub 仓库是否创建成功
- [ ] 仓库是否设置为 Public
- [ ] 远程仓库地址是否正确
- [ ] GitHub Pages 是否已启用
- [ ] Actions 工作流是否运行成功

---

**您的网站地址将是**: `https://您的用户名.github.io/仓库名`

例如：如果您的用户名是 `john`，仓库名是 `web-test`，那么地址就是：
`https://john.github.io/web-test` 