---
title: "CUDA、CUDNN 安装"
date: 2023-09-25T16:00:00.000Z
slug: cudacudnn-
categories: []
tags: []
summary: "安装 CUDA、cuDNN 1. CUDA CUDA 是 NVIDIA 发明的一种并行计算平台和编程模型。它通过利用图形处理器 (GPU) 的处理能力，可大幅提升计算性能。 官方地址 https://developer.nvidia.com/cuda-toolkit-archive 2. cuDNN NVIDIACUDA®深度神经网络库(cuDNN)是GPU加速的用于深度神经网络的原语库。 注意！..."
originUrl: "https://www.cnblogs.com/bigroc/p/17730892.html"
---

# 安装 CUDA、cuDNN

## 1\. CUDA

`CUDA 是 NVIDIA 发明的一种并行计算平台和编程模型。它通过利用图形处理器 (GPU) 的处理能力，可大幅提升计算性能。`  
官方地址 [https://developer.nvidia.com/cuda-toolkit-archive](https://developer.nvidia.com/cuda-toolkit-archive)  
![image](/images/posts/cudacudnn--1764044906287.png)

## 2\. cuDNN

`NVIDIACUDA®深度神经网络库(cuDNN)是GPU加速的用于深度神经网络的原语库。`

> 注意！一定要选择匹配的版本哦！  
> 比如：CUDA 12.x，cuDNN 8.9.4

官方地址 [https://developer.nvidia.com/rdp/cudnn-archive](https://developer.nvidia.com/rdp/cudnn-archive)

![image](/images/posts/cudacudnn--1764044906453.png)

## 3\. 复制 cuDNN 至 CUDA 安装目录

1.  解压 cuDNN
2.  复制 `bin、include、lib` 文件夹  
    ![image](/images/posts/cudacudnn--1764044906559.png)
3.  粘贴至 CUDA 安装目录  
    ![image](/images/posts/cudacudnn--1764044906649.png)

接下来可以愉快的玩起来咯