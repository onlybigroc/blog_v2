---
title: "远程桌面连接（出现身份验证错误。要求的函数不支持）这可能由于CredSSP加密Oracle修正。"
date: 2018-08-20T16:00:00.000Z
slug: credssporacle
categories: []
tags: []
summary: "家庭版解决方案&nbsp; 在进行远程桌面时会遇到这种情况。对于Windows 10家庭版用户，是不支持组策略功能的。本文根据官方文档采用修改注册表的方式达到相同的目的。 1.打开注册表&nbsp;&nbsp; win + R&nbsp; 键入&nbsp; regedit&nbsp; 打开注册表 2.找到目录 HKEY_LOCAL_MACHINE\Software\Microsoft\Window..."
originUrl: "https://www.cnblogs.com/bigroc/p/9512324.html"
---

# 家庭版解决方案 

在进行远程桌面时会遇到这种情况。对于**Windows 10家庭版**用户，是不支持组策略功能的。本文根据官方文档采用**修改注册表**的方式达到相同的目的。

![](/images/posts/credssporacle-1764045037307.png)

**1.打开注册表**  

win + R  键入  regedit  打开注册表

**2.找到目录**

HKEY\_LOCAL\_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\\CredSSP\\Parameters，修改AllowEncryptionOracle的值为2。

注：如果目录不存在，手动新增目录，修改值。

目录：HKEY\_LOCAL\_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\\CredSSP\\Parameters 

值：AllowEncryptionOracle

数据类型：DWORD

注册表值：2

**\*以下是官方文档提供**

“加密 Oracle 修正组策略”支持以下三个选项，应将这些选项应用于客户端和服务器：

策略设置

注册表值

客户端行为

服务器行为

强制更新的客户端

0

使用 CredSSP 的客户端应用程序将无法回退到不安全的版本。

使用 CredSSP 的服务将不接受未修补的客户端。注意 在所有 Windows 和第三方 CredSSP 客户端支持最新的 CredSSP 版本之前，不应部署此设置。

缓解

1

使用 CredSSP 的客户端应用程序将无法回退到不安全的版本。

使用 CredSSP 的服务将接受未修补的客户端。

易受攻击

2

使用 CredSSP 的客户端应用程序将通过支持回退到不安全的版本使远程服务器遭受攻击。

使用 CredSSP 的服务将接受未修补的客户端。

注册表路径

HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\\CredSSP\\Parameters

值

AllowEncryptionOracle

数据类型

DWORD

是否需要重启？

是