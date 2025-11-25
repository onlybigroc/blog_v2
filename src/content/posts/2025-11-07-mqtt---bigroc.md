---
title: "开源MQTT协议记录 - bigroc"
date: 2025-11-07T03:31:00.000Z
slug: mqtt---bigroc
categories: []
tags: []
summary: "JetLinks 分组 topic 上下行 说明 属性上报 /{productId:产品ID}/{deviceId:设备ID}/properties/report 上行 上报物模型属性数据 读取属性 /{productId:产品ID}/{deviceId:设备ID}/properties/read 下行 平台下发读取物模型属性数据指令 /{productId:产品ID}/{deviceId:设备I..."
originUrl: "https://www.cnblogs.com/bigroc/p/19199192"
---

# JetLinks

分组

topic

上下行

说明

属性上报

/{productId:产品ID}/{deviceId:设备ID}/properties/report

上行

上报物模型属性数据

读取属性

/{productId:产品ID}/{deviceId:设备ID}/properties/read

下行

平台下发读取物模型属性数据指令

/{productId:产品ID}/{deviceId:设备ID}/properties/read/reply

上行

对平台下发的读取属性指令进行响应

修改属性

/{productId:产品ID}/{deviceId:设备ID}/properties/write

下行

平台下发修改物模型属性数据指令

/{productId:产品ID}/{deviceId:设备ID}/properties/write/reply

上行

对平台下发的修改属性指令进行响应

事件上报

/{productId:产品ID}/{deviceId:设备ID}/event/{eventId:事件ID}

上行

上报物模型事件数据

调用功能

/{productId:产品ID}/{deviceId:设备ID}/function/invoke

下行

平台下发功能调用指令

/{productId:产品ID}/{deviceId:设备ID}/function/invoke/reply

上行

设备响应平台下发的功能调用指令

子设备消息

/{productId:产品ID}/{deviceId:设备ID}/child/{childDeviceId:子设备ID}/{#:子设备相应操作的topic}

上行,下行

网关上报或者平台下发子设备消息

/{productId:产品ID}/{deviceId:设备ID}/child-reply/{childDeviceId:子设备ID}/{#:子设备相应操作的topic}

上行,下行

网关回复平台下发给子设备的指令结果

更新标签

/{productId:产品ID}/{deviceId:设备ID}/tags

上行

更新标签数据

状态管理

/{productId:产品ID}/{deviceId:设备ID}/online

上行

设备上线

/{productId:产品ID}/{deviceId:设备ID}/offline

上行

设备离线