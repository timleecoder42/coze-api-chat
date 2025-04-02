# 扣子 API 聊天演示

一个简单而功能完整的扣子 API 聊天应用，支持实时对话、消息流式传输和会话历史记录。

## 功能特点

- 🚀 基于 Next.js 构建的现代化 Web 应用
- 💬 支持与扣子智能体进行实时对话
- 📝 流式响应显示，实时查看 AI 回复
- 🔄 自动保存会话历史，支持继续之前的对话
- 🔒 安全存储 API 凭据，无需每次重新输入
- 📱 响应式设计，适配各种设备屏幕
- 🌐 支持静态导出，可部署到任何静态网站托管服务

## 安装指南

### 前提条件

- Node.js 18.0.0 或更高版本
- 扣子平台账号和 API 密钥

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/timleecoder42/coze-api-chat.git
cd coze-api-chat
```

2. 安装依赖

```shellscript
pnpm install
```

3. 启动开发服务器

```shellscript
pnpm dev
```

4. 构建静态网站

```shellscript
pnpm build
```

构建完成后，静态文件将生成在 `out` 目录中，可以部署到任何静态网站托管服务。

## 配置指南

首次使用时，您需要配置扣子 API 凭据：

1. 在扣子开发者平台获取 API 密钥
   1. 访问 [扣子开发者平台](https://www.coze.cn)
   2. 登录您的账号
   3. 在开发者设置中创建 API 密钥
2. 获取智能体 ID
   1. 在扣子平台创建或选择一个智能体
   2. 智能体 ID 可以在智能体的 URL 中找到
3. 确保 API 密钥具有以下权限：
   1. Bot 管理
   2. 会话管理
   3. 对话
   4. 消息

## 使用说明

1. 打开应用后，点击右上角的"配置"按钮
2. 输入您的 API 密钥和智能体 ID
3. 保存配置后，即可开始聊天
4. 在底部输入框中输入消息，按回车键或点击发送按钮发送
5. AI 回复将实时显示在聊天窗口中
6. 会话历史将自动保存，下次打开应用时可以继续对话
7. 如需刷新历史消息，可以点击右上角的刷新按钮

## API 详情

本应用使用以下扣子 API 端点：

- `https://api.coze.cn/v3/chat` - 发送消息并接收流式响应
- `https://api.coze.cn/v1/conversation/retrieve` - 获取会话信息
- `https://api.coze.cn/v1/conversation/message/list` - 获取会话历史消息

详细的 API 文档可以在[扣子开发者文档](https://www.coze.cn/docs)中找到。

## 常见问题

### 无法连接到扣子 API

- 检查您的 API 密钥是否正确
- 确认您的 API 密钥具有必要的权限
- 检查网络连接是否正常

### 消息发送失败

- 确认智能体 ID 是否正确
- 检查智能体是否处于活跃状态
- 确认您的 API 密钥未过期

### 历史消息无法加载

- 确认您的 API 密钥具有会话管理和消息权限
- 检查会话 ID 是否有效
- 尝试刷新页面或重新配置 API 凭据

## 技术栈

- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Lucide React](https://lucide.dev/) - 图标库

## 许可证

MIT
