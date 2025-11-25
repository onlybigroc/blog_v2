---
title: "Ubuntu如何卸载mysql"
date: 2021-08-29T16:00:00.000Z
slug: Ubuntu如何卸载mysql
categories: []
tags: ["Ubuntu", "MySQL", "Ubuntu如何卸载mysql"]
summary: "首先在终端中查看MySQL的依赖项：dpkg --list|grep mysql 卸载： sudo apt-get remove mysql-common 卸载：sudo apt-get autoremove --purge mysql-server-5.7 清除残留数据：dpkg -l|grep ^rc|awk '{print$2}'|sudo xargs dpkg -P 再次查看MySQL的剩..."
originUrl: "https://www.cnblogs.com/bigroc/p/15205944.html"
---

### 首先在终端中查看MySQL的依赖项：dpkg --list|grep mysql

### 卸载： sudo apt-get remove mysql-common

### 卸载：sudo apt-get autoremove --purge mysql-server-5.7

### 清除残留数据：dpkg -l|grep ^rc|awk '{print$2}'|sudo xargs dpkg -P

### 再次查看MySQL的剩余依赖项：dpkg --list|grep mysql

### 继续删除剩余依赖项，如：sudo apt-get autoremove --purge mysql-apt-config