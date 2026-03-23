---
title: "用 OpenClaw 搭建飞书 AI 机器人：从零到上线的完整指南"
date: 2026-03-23T06:50:00.000Z
slug: openclaw-feishu-bot
categories: ["技术"]
tags: ["OpenClaw", "飞书", "AI", "机器人"]
summary: "在飞书里直接跟一个 AI 助手聊天，让它帮你写代码、查资料、管理文件？OpenClaw 就是干这个的——一个开源自托管的 AI 网关，把你的聊天应用和 AI Agent 连起来。本文记录从零部署到飞书机器人上线的全过程。"
originUrl: "https://bigroc.cn/posts/openclaw-feishu-bot"
draft: false
---

> 你有没有想过，在飞书里直接跟一个 AI 助手聊天，让它帮你写代码、查资料、管理文件？OpenClaw 就是干这个的——一个开源自托管的 AI 网关，把你的聊天应用和 AI Agent 连起来。本文记录我从零部署到飞书机器人上线的全过程。

## 什么是 OpenClaw？

[OpenClaw](https://github.com/openclaw/openclaw) 是一个 **自托管的 AI 网关**，核心思路很简单：

- 你在自己的机器上跑一个 Gateway 服务
- 它连接你的聊天应用（飞书、Telegram、Discord、WhatsApp 等）
- 背后对接 AI 模型（OpenRouter、OpenAI、Anthropic 等）
- 你在飞书发消息 → Gateway 转发给 AI → AI 回复到飞书

**关键特性：**

- 🏠 **自托管**：数据在你手里，不依赖第三方服务
- 🔌 **多通道**：一个 Gateway 同时服务飞书、Telegram、Discord 等
- 🤖 **Agent 原生**：支持工具调用、会话管理、多 Agent 路由
- 📖 **开源 MIT**：完全免费，社区驱动

## 前置条件

- **Node.js 24**（推荐）或 Node.js 22 LTS（22.16+）
- 一个 AI 模型的 API Key（推荐 [OpenRouter](https://openrouter.ai)，一个 Key 通吃各种模型）
- 一台能长期运行的机器（电脑、服务器、树莓派都行）

## 第一步：安装 OpenClaw

### macOS / Linux

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Windows (PowerShell)

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

或者直接 npm 全局安装：

```bash
npm install -g openclaw@latest
```

安装完成后验证：

```bash
openclaw --version
```

## 第二步：创建飞书应用

这一步在 [飞书开放平台](https://open.feishu.cn/app) 上操作。

### 1. 创建企业自建应用

进入飞书开放平台 → 点击 **创建企业自建应用** → 填写应用名称和描述 → 选个图标。

### 2. 获取凭证

进入 **凭证与基础信息**，记下：

- **App ID**（格式：`cli_xxx`）
- **App Secret**（⚠️ 保密！）

### 3. 配置权限

进入 **权限管理** → 点击 **批量开通**，粘贴以下 JSON：

```json
{
  "scopes": {
    "tenant": [
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource",
      "im:chat.members:bot_access",
      "im:chat.access_event.bot_p2p_chat:read"
    ],
    "user": [
      "im:chat.access_event.bot_p2p_chat:read"
    ]
  }
}
```

> 这些权限覆盖了收发消息、读取群成员等基本能力。如果需要更多功能（如读写文档），可以按需添加。

### 4. 开启机器人能力

进入 **应用能力** → **机器人** → 开启 → 设置机器人名称。

### 5. 配置事件订阅（关键！）

进入 **事件与回调**：

1. 选择 **使用长连接接收事件**（WebSocket 模式，不需要公网 URL）
2. 添加事件：`im.message.receive_v1`

> ⚠️ **注意：** 配置这一步之前，先确保 OpenClaw 的 Gateway 已经启动。飞书会验证长连接，如果 Gateway 没跑起来会保存失败。

### 6. 发布应用

进入 **版本管理与发布** → 创建版本 → 提交审核 → 等待管理员审批。

## 第三步：配置 OpenClaw 飞书通道

### 方式一：向导配置（推荐）

```bash
openclaw channels add
```

选择 **Feishu**，输入 App ID 和 App Secret 即可。

### 方式二：手动编辑配置文件

编辑 `~/.openclaw/openclaw.json`，添加飞书配置：

```json5
{
  "channels": {
    "feishu": {
      "enabled": true,
      "dmPolicy": "pairing",
      "accounts": {
        "main": {
          "appId": "cli_xxx",
          "appSecret": "你的App Secret",
          "botName": "我的AI助手"
        }
      }
    }
  }
}
```

### 方式三：环境变量

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

## 第四步：配置 AI 模型

OpenClaw 通过 Provider 对接 AI 模型。最简单的方式是用 OpenRouter（一个 API Key 访问几乎所有模型）：

```bash
openclaw configure --section providers
```

或者在配置文件中添加：

```json5
{
  "providers": {
    "openrouter": {
      "apiKey": "sk-or-xxx"
    }
  }
}
```

## 第五步：启动 Gateway 并测试

### 启动 Gateway

```bash
openclaw gateway start
```

或者前台运行（方便调试）：

```bash
openclaw gateway --port 18789
```

### 检查状态

```bash
openclaw gateway status
openclaw logs --follow
```

看到日志里出现飞书 WebSocket 连接成功，就说明通道通了。

### 测试

1. 在飞书中找到你的机器人
2. 发送一条消息
3. 机器人会回复一个 **配对码（pairing code）**

### 批准配对

```bash
openclaw pairing approve feishu <配对码>
```

配对完成后，就可以正常聊天了 🎉

## 群聊配置（可选）

### 允许所有群聊

```json5
{
  "channels": {
    "feishu": {
      "groupPolicy": "open"
    }
  }
}
```

### 只允许特定群

```json5
{
  "channels": {
    "feishu": {
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["oc_xxx", "oc_yyy"]
    }
  }
}
```

### 群内是否需要 @机器人

默认需要 @。如果想让机器人响应所有消息：

```json5
{
  "channels": {
    "feishu": {
      "groups": {
        "oc_xxx": {
          "requireMention": false
        }
      }
    }
  }
}
```

> 💡 **获取群 ID 的方法：** 在群里 @机器人 发消息，然后看 `openclaw logs --follow` 的日志，里面会有 `chat_id`。

## 进阶玩法

### 流式输出

飞书支持通过交互卡片实现流式打字效果（默认开启）：

```json5
{
  "channels": {
    "feishu": {
      "streaming": true,
      "blockStreaming": true
    }
  }
}
```

### 多 Agent 路由

不同的人或群可以路由到不同的 Agent：

```json5
{
  "bindings": [
    {
      "agentId": "main",
      "match": {
        "channel": "feishu",
        "peer": { "kind": "direct", "id": "ou_xxx" }
      }
    },
    {
      "agentId": "coding-agent",
      "match": {
        "channel": "feishu",
        "peer": { "kind": "group", "id": "oc_yyy" }
      }
    }
  ]
}
```

### 常用命令

在飞书中发送：

- `/status` — 查看机器人状态
- `/reset` — 重置当前会话
- `/model` — 查看/切换模型

## 常见问题

### 机器人不回复

1. 检查应用是否已发布并审批通过
2. 检查事件订阅是否包含 `im.message.receive_v1`
3. 确认使用的是 **长连接模式**
4. 确认权限完整
5. 检查 Gateway 是否在运行：`openclaw gateway status`
6. 查看日志：`openclaw logs --follow`

### 群聊不工作

1. 确认机器人已加入群聊
2. 确认已经 @了机器人（默认要求）
3. 检查 `groupPolicy` 没有设为 `"disabled"`

### App Secret 泄露

1. 在飞书开放平台重置 App Secret
2. 更新配置文件中的 Secret
3. 重启 Gateway

## 总结

整个流程梳理一下：

1. **安装 OpenClaw** → `npm install -g openclaw`
2. **创建飞书应用** → 拿到 App ID + App Secret
3. **配置权限和事件** → 开启机器人、订阅消息事件
4. **配置 OpenClaw 通道** → `openclaw channels add`
5. **配置 AI 模型** → OpenRouter 一个 Key 搞定
6. **启动 Gateway** → `openclaw gateway start`
7. **测试** → 飞书发消息，批准配对，开聊

整个过程大概 15-30 分钟，不需要公网 IP，不需要域名，不需要反向代理。飞书的长连接模式让部署变得非常简单。

---

**相关链接：**

- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw 文档](https://docs.openclaw.ai)
- [飞书开放平台](https://open.feishu.cn/app)
- [OpenRouter](https://openrouter.ai)
