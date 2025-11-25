---
title: "fatal: unable to access ' ': Failed to connect to github.com port 443 after 123 ms: Couldn't connect to server - bigroc"
date: 2025-10-30T01:33:00.000Z
slug: fatal-unable-to-access-failed-to-connect-to-github
categories: []
tags: []
summary: "fatal: unable to access ' ': Failed to connect to github.com port 443 after 123 ms: Couldn't connect to server 问题描述 最近在使用 Git 拉取或推送代码到 GitHub 时，经常会遇到以下错误： fatal: unable to access 'https://github.com/...."
originUrl: "https://www.cnblogs.com/bigroc/p/19175937"
---

# fatal: unable to access ' ': Failed to connect to github.com port 443 after 123 ms: Couldn't connect to server

## 问题描述

最近在使用 Git 拉取或推送代码到 GitHub 时，经常会遇到以下错误：

> fatal: unable to access '[https://github.com/.../...git/](https://github.com/.../...git/)': Failed to connect to github.com port 443 after 21055 ms: Couldn't connect to server

翻译为中文：

> 致命错误：无法访问“[https://github.com/.../.../”：连接到](https://github.com/.../.../%E2%80%9D%EF%BC%9A%E8%BF%9E%E6%8E%A5%E5%88%B0) github.com 端口 443 失败，耗时 21055 毫秒：无法连接到服务器。

这个错误表明 Git 客户端无法通过 HTTPS 协议（默认端口 443）连接到 GitHub 服务器。

## 可能的原因

**网络连接问题：** 本地网络不稳定或无法访问 GitHub  
**代理设置问题：** 如果使用 VPN/代理，Git 可能没有正确配置代理  
**防火墙限制：** 本地防火墙或公司网络可能阻止了对 GitHub 的访问  
**GitHub 服务中断：** 极少数情况下可能是 GitHub 自身的问题

## 解决方案

### 方案一：如果您使用 VPN，可以尝试执行

如果您正在使用代理软件，需要为 Git 配置相应的代理设置：

```
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy https://127.0.0.1:7890
```

注意：将 7890 替换为您 VPN/代理软件的实际端口号。

针对单个项目配置

```
git config http.proxy http://127.0.0.1:7890
```

### 方案二：如果您不使用 VPN/代理

```
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### 方案三：检查网络连接

尝试 ping github.com 看是否能连通

```
ping github.com
```

检查是否能通过浏览器访问 GitHub  
尝试更换网络环境（如从 WiFi 切换到移动热点）

### 方案四：使用 SSH 替代 HTTPS

如果 HTTPS 连接持续有问题，可以考虑使用 SSH 协议：

生成 SSH 密钥（如果还没有）：

```
ssh-keygen -t ed25519 -C "your_email@example.com"
```

将公钥添加到 GitHub 账户  
将远程仓库 URL 从 HTTPS 改为 SSH：

```
git remote set-url origin git@github.com:username/repo.git
```

## 其他建议

*   检查 Git 版本是否为最新
*   尝试重启网络设备或计算机
*   如果是公司网络，可能需要联系 IT 部门

## 总结

Git 连接 GitHub 443 端口失败通常与网络环境或代理设置有关。通过正确配置或清除代理设置，大多数情况下可以解决此问题。如果问题持续存在，考虑使用 SSH 协议或检查更深层次的网络配置。

希望这篇文章能帮助您解决 Git 连接 GitHub 的问题！

## 本文参考资料

**官方文档**  
\[Git Documentation\] Pro Git Book. Git-SCM. [https://git-scm.com/docs/git-config](https://git-scm.com/docs/git-config)  
**技术社区**  
\[Stack Overflow\] "Failed to connect to github.com port 443" discussion. 2023. [https://stackoverflow.com/questions/76191061/](https://stackoverflow.com/questions/76191061/) (Accessed 2023-11-20)