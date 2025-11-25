---
title: "PostgreSQL数据库的序列"
date: 2024-07-11T09:43:00.000Z
slug: PostgreSQL数据库的序列
categories: []
tags: ["PostgreSQL", "SQL", "PostgreSQL数据库的序列"]
summary: "PostgreSQL数据库的序列 一、创建序列 执行以下 sql 创建序列并定义起始序列为 1，也可以自定义为其他值 CREATE SEQUENCE test_tables_id_seq START 1; 二、序列重置 第一种方式 执行以下 sql 修改起始序列为 1，也可以自定义为其他值 ALTER SEQUENCE test_tables_id_seq RESTART WITH 1; ALTE..."
originUrl: "https://www.cnblogs.com/bigroc/p/18296793"
---

# PostgreSQL数据库的序列

## 一、创建序列

> 执行以下 sql 创建序列并定义起始序列为 1，也可以自定义为其他值

```
CREATE SEQUENCE test_tables_id_seq START 1;
```

## 二、序列重置

### 第一种方式

> 执行以下 sql 修改起始序列为 1，也可以自定义为其他值

```sql
ALTER SEQUENCE test_tables_id_seq RESTART WITH 1;
ALTER SEQUENCE test_tables_id_seq RESTART WITH 100;
```

### 第二种方式

> 如表中已存在数据一般采用 MAX(id) 来做自适应，避免冲突报错

```sql
SELECT setval('test_tables_id_seq', (SELECT MAX(id) FROM test_tables));
```

## 三、查看序列值

### 当前值

```sql
SELECT currval('test_tables_id_seq')
```

> 例外一：如果你刚建表，且一条数据都没有插入，那么这时执行 select currval('test\_id\_seq') 会报错：  
> `ERROR: currval of sequence "test_tables_id_seq" is not yet defined in this session`  
> 例外二：如果你使用第一种方式`ALTER SEQUENCE test_tables_id_seq RESTART WITH 1;`刚重置完成序列，且没有执行插入操作，那么这是执行 select currval('test\_id\_seq') 依然是之前的值

### 下一个值

> 会导致序列 +1 哦

```sql
SELECT nextval('test_tables_id_seq')
```

## 四、怎么查看表关联的序列

### 第一种方式

> 通过表定义查看序列

```
CREATE TABLE "public"."test_tables" (
  "id" int8 NOT NULL DEFAULT nextval('test_tables_id_seq'::regclass)
)
```

### 第二种方式

> 使用 SQL 查询 pg\_catalog 或 information\_schema\*\*：编写 SQL 查询来从 pg\_catalog 或 information\_schema 模式中检索表的定义

```sql
SELECT
  "column_name",
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM
  information_schema."columns"
WHERE
  "table_name" = 'test_tables'
  AND table_schema = 'public';
```

结果  
![image](/images/posts/51f59f22a97c355cd136501bf4c5202a.png)

## 问题

1.  如果表中没有数据不能使用 `SELECT setval('test_tables_id_seq', (SELECT MAX(id) FROM test_tables));`方式没有生效。这种情况推荐使用 `ALTER SEQUENCE test_tables_id_seq RESTART WITH 1;`来进行重置

## 参考

[15\. 序列操作函数 CREATE SEQUENCE - postgres.cn](http://postgres.cn/docs/15/sql-createsequence.html)  
[15\. 序列操作函数 ALTER SEQUENCE - postgres.cn](http://postgres.cn/docs/15/functions-sequence.html)  
[15\. 序列操作函数 DROP SEQUENCE - postgres.cn](http://postgres.cn/docs/15/sql-dropsequence.html)