---
title: "postgresql表结构查询sql"
date: 2021-12-23T16:00:00.000Z
slug: postgresqlsql
categories: []
tags: []
summary: "数据库表结构查询sql SELECT t1.attnum as \"序号\", t1.attname as \"字段名\", concat_ws ( '', t2.typname, SUBSTRING ( format_type ( t1.atttypid, t1.atttypmod ) FROM '\(.*\)' ) ) AS \"数据类型\" , t3.description AS \"注释\" -- (ca..."
originUrl: "https://www.cnblogs.com/bigroc/p/15728872.html"
---

# 数据库表结构查询sql

```sql
SELECT
    t1.attnum as "序号",
    t1.attname as "字段名",
    concat_ws ( '', t2.typname, SUBSTRING ( format_type ( t1.atttypid, t1.atttypmod ) FROM '\(.*\)' ) ) AS "数据类型" ,
    t3.description AS "注释" 
    -- (case t1.attnotnull WHEN 'f' THEN '否' ELSE '是' end )AS "必填",
    -- t1.attnotnull as "不是null"
FROM
    pg_attribute t1
    LEFT JOIN pg_type t2 ON t1.atttypid = t2.oid
    LEFT JOIN pg_description t3 ON t3.objoid = t1.attrelid  AND t3.objsubid = t1.attnum 
    LEFT JOIN pg_class t4 ON t1.attrelid = t4.oid
WHERE
    t1.attnum > 0 
    AND t4.relname = 'order'; -- 数据库名称
```