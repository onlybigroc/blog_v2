---
title: "ubuntu 中 docker 每次都输入 sudo 命令"
date: 2022-12-28T16:00:00.000Z
slug: ubuntu-中-docker-每次都输入-sudo-命令
categories: []
tags: ["Docker", "Ubuntu", "HTTPS", "ubuntu", "docker", "每次都输入", "sudo", "命令"]
summary: "查看用户组及成员 sudo cat /etc/group | grep docker 可以添加docker组 sudo groupadd docker 添加用户到docker组 sudo gpasswd -a ${USER} docker 增加读写权限（这个需要执行，因为这个文件的权限不对） sudo chmod a+rw /var/run/docker.sock 重启docker sudo sy..."
originUrl: "https://www.cnblogs.com/bigroc/p/17012379.html"
---

# 查看用户组及成员

`sudo cat /etc/group | grep docker`

# 可以添加docker组

`sudo groupadd docker`

# 添加用户到docker组

`sudo gpasswd -a ${USER} docker`

# 增加读写权限（这个需要执行，因为这个文件的权限不对）

`sudo chmod a+rw /var/run/docker.sock`

# 重启docker

`sudo systemctl restart docker`  
或  
`sudo service docker restart`

参考：[https://www.cnblogs.com/jzcn/p/16591083.html](https://www.cnblogs.com/jzcn/p/16591083.html "https://www.cnblogs.com/jzcn/p/16591083.html")