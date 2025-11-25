---
title: "东半球最好用的SSL证书续期工具 - bigroc"
date: 2024-09-27T07:48:00.000Z
slug: ssl---bigroc
categories: []
tags: []
summary: "申请SSL证书 打开 https://httpsok.com‍/?p=4f1h （这里夹带私货 4f1h 是我的邀请码！），登录后，点击【申请证书】 输入自己的域名（这里演示是 httpsok.xzy ）并且回车 此时，会提示检测中，我们需要再到DNS添加一条 CNAME 类型的解析记录。 添加成功后，如下图所示。 此时，再回到页面控制台，发现域名已经检测通过了。 点击【提交申请】，证书进入申请中..."
originUrl: "https://www.cnblogs.com/bigroc/p/18435895"
---

# 申请SSL证书

打开 [https://httpsok.com‍/?p=4f1h](https://httpsok.com/?p=4f1h) （这里夹带私货 `4f1h` 是我的邀请码！），登录后，点击【申请证书】

![image](/images/posts/ssl---bigroc-1764048949886.png)

输入自己的域名（这里演示是 httpsok.xzy ）并且回车  
![image](/images/posts/ssl---bigroc-1764048949893.png)  
此时，会提示检测中，我们需要再到DNS添加一条 CNAME 类型的解析记录。  
![image](/images/posts/ssl---bigroc-1764048949900.png)  
添加成功后，如下图所示。  
![image](/images/posts/ssl---bigroc-1764048949906.png)  
此时，再回到页面控制台，发现域名已经检测通过了。  
![image](/images/posts/ssl---bigroc-1764048949913.png)  
点击【提交申请】，证书进入申请中，等待1分钟左右，即可申请成功。  
![image](/images/posts/ssl---bigroc-1764048949920.png)

## 部署SSL证书

nginx配置https站点

### 配置指令（请将 httpsok.xyz 替换成自己的域名）

```nginx

server {
    listen  443 ssl;
    server_name httpsok.xyz;

    ssl_certificate certs/httpsok.xyz.pem;
    ssl_certificate_key certs/httpsok.xyz.key;

    ssl_session_timeout 5m;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    add_header Strict-Transport-Security "max-age=31536000";

    access_log /var/log/nginx/httpsok.xyz.https.log;

    location / {
        root /var/html/httpsok.xyz/;
        index index.html;
    }
}
```

### 增加nginx站点配置文件（最佳实践：域名.conf）

```
vim /etc/nginx/conf.d/httpsok.xyz.conf
```

## 安装 httpsok.sh并部署证书

回到控制台首页，点击按钮复制安装命令。  
![image](/images/posts/ssl---bigroc-1764048949928.png)  
到服务器，粘贴并执行刚刚复制的命令，此时 自动更新SSL证书，并且自动重载nginx。  
![image](/images/posts/ssl---bigroc-1764048949937.png)

## 通过HTTPS访问网站

点击小锁，可以看到证书详情。（提示：网站404是因为没有部署页面文件，部署之后就不会了）  
![image](/images/posts/ssl---bigroc-1764048949944.png)  
下面是谷歌浏览器查看证书方式  
![image](/images/posts/ssl---bigroc-1764048949949.png)

> 恭喜您，nginx安装完成，并且SSL证书也部署成功。是不是很简单、也很方便呢。
> 
> 如果遇到nginx部署或者SSL证书相关的问题，也欢迎随时咨询我们。
> 
> 觉得好用的话，也希望大家推荐我们的产品给好友。  
> ![image](/images/posts/ssl---bigroc-1764048949955.png)

文档：[https://httpsok.com‍/doc/](https://httpsok.com/doc/)  
原文：[【微信公众号】Nginx快速安装并部署SSL证书](https://mp.weixin.qq.com/s/EY3ARrUaSkANoxdveEiKMw)