# 部署指南

## 免费部署平台推荐

### 1. Vercel (推荐)
**最适合您的 React + Vite 项目**

#### 部署步骤：
1. 访问 [vercel.com](https://vercel.com) 并注册账号
2. 点击 "New Project"
3. 连接您的 GitHub 仓库
4. Vercel 会自动检测到这是一个 Vite 项目
5. 点击 "Deploy" 即可

#### 优势：
- 自动 HTTPS
- 全球 CDN
- 自动部署（每次 push 到 GitHub 都会重新部署）
- 每月 100GB 免费带宽
- 专门为 React 应用优化

### 2. Netlify
**简单易用的替代方案**

#### 部署步骤：
1. 访问 [netlify.com](https://netlify.com) 并注册
2. 点击 "New site from Git"
3. 连接 GitHub 仓库
4. 设置构建命令：`npm run build`
5. 设置发布目录：`dist`
6. 点击 "Deploy site"

### 3. GitHub Pages
**完全免费的方案**

#### 部署步骤：
1. 在项目根目录创建 `.github/workflows/deploy.yml` 文件
2. 推送代码到 GitHub
3. 在仓库设置中启用 GitHub Pages

## 本地测试部署

在部署之前，建议先在本地测试构建：

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 注意事项

1. **数据文件**: 您的 GeoJSON 文件在 `public/data/` 目录下，这些文件会被自动包含在构建中
2. **环境变量**: 如果使用了任何 API 密钥，请确保在部署平台中设置环境变量
3. **CORS**: 如果您的应用需要访问外部 API，确保目标服务器允许跨域请求

## 推荐部署流程

1. 首先将代码推送到 GitHub
2. 使用 Vercel 进行部署（最简单）
3. 获得一个类似 `https://your-project.vercel.app` 的链接
4. 可以设置自定义域名（可选）

## 故障排除

如果部署失败，请检查：
- `package.json` 中的构建脚本是否正确
- 所有依赖是否都已安装
- 构建日志中的错误信息 