---
title: "CUDA、CUDNN 安装"
date: 2023-09-25T16:00:00.000Z
slug: CUDA、CUDNN-安装
categories: []
tags: ["HTTPS", "CUDA", "CUDNN", "安装"]
summary: "安装 CUDA、cuDNN 1. CUDA CUDA 是 NVIDIA 发明的一种并行计算平台和编程模型。它通过利用图形处理器 (GPU) 的处理能力，可大幅提升计算性能。 官方地址 https://developer.nvidia.com/cuda-toolkit-archive 2. cuDNN NVIDIACUDA®深度神经网络库(cuDNN)是GPU加速的用于深度神经网络的原语库。 注意！..."
originUrl: "https://www.cnblogs.com/bigroc/p/17730892.html"
---

# 安装 CUDA、cuDNN

## 1\. CUDA

`CUDA 是 NVIDIA 发明的一种并行计算平台和编程模型。它通过利用图形处理器 (GPU) 的处理能力，可大幅提升计算性能。`  
官方地址 [https://developer.nvidia.com/cuda-toolkit-archive](https://developer.nvidia.com/cuda-toolkit-archive)  
![image](/images/posts/6fd4c5ed1a3f59999fe44a350171ca41.png)

## 2\. cuDNN

`NVIDIACUDA®深度神经网络库(cuDNN)是GPU加速的用于深度神经网络的原语库。`

> 注意！一定要选择匹配的版本哦！  
> 比如：CUDA 12.x，cuDNN 8.9.4

官方地址 [https://developer.nvidia.com/rdp/cudnn-archive](https://developer.nvidia.com/rdp/cudnn-archive)

![image](/images/posts/ca8e6cb785fe412241acc672e74c35e7.png)

## 3\. 复制 cuDNN 至 CUDA 安装目录

1.  解压 cuDNN
2.  复制 `bin、include、lib` 文件夹  
    ![image](/images/posts/91c1a1d365019add46fbd03492acfd60.png)
3.  粘贴至 CUDA 安装目录  
    ![image](/images/posts/e4337c7b6b667c49d0434110407887d9.png)

接下来可以愉快的玩起来咯