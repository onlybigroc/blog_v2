---
title: "postgresql 命令"
date: 2021-11-07T16:00:00.000Z
slug: postgresql-
categories: []
tags: []
summary: "常用命令 导入sql 在安装目录\bin下使用 数据库:database_name 用户名:user_name .\psql -d database_name -U user_name -f C:\Users\admin\Desktop\db-2021-11-8.sql 创建用户 create user test_user with password 'test_user_pwd'; 创建数据库 ..."
originUrl: "https://www.cnblogs.com/bigroc/p/15523901.html"
---

# 常用命令

## 导入sql

在安装目录\\bin下使用 数据库:**database\_name** 用户名:**user\_name**

```shell
.\psql -d database_name -U user_name -f C:\Users\admin\Desktop\db-2021-11-8.sql
```

## 创建用户

```sql
create user test_user with password 'test_user_pwd';
```

## 创建数据库

```sql
create database "test-database" owner test_user;
```

## 授权

```sql
grant all privileges on database "test-database" to test_user;
```