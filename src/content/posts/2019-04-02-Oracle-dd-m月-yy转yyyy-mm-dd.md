---
title: "Oracle dd-m月-yy转yyyy-mm-dd"
date: 2019-04-02T16:00:00.000Z
slug: Oracle-dd-m月-yy转yyyy-mm-dd
categories: []
tags: ["Oracle", "dd", "mm"]
summary: "表名称：TEST_LP&nbsp; 字段：PROD_DATE 1 SELECT '20' || SUBSTR(T.PROD_DATE, INSTR(T.PROD_DATE, '-', 1, 2) + 1, 2) || '-' || 2 DECODE(LENGTH(SUBSTR(T.PROD_DATE, 3 INSTR(T.PROD_DATE, '-', 1, 1) + 1, 4 LENGTH(SU..."
originUrl: "https://www.cnblogs.com/bigroc/p/10650657.html"
---

表名称：TEST\_LP 

字段：PROD\_DATE

 1 SELECT '20' || SUBSTR(T.PROD\_DATE, INSTR(T.PROD\_DATE, '\-', 1, 2) + 1, 2) || '\-' ||
 2        DECODE(LENGTH(SUBSTR(T.PROD\_DATE,
 3                             INSTR(T.PROD\_DATE, '\-', 1, 1) + 1,
 4                             LENGTH(SUBSTR(T.PROD\_DATE,
 5                                           INSTR(T.PROD\_DATE, '\-', 1, 1) + 1)) \-
 6                             LENGTH(SUBSTR(T.PROD\_DATE,
 7                                           INSTR(T.PROD\_DATE, '月', 1, 1))))),
 8               1,
 9               '0') ||
10 SUBSTR(T.PROD\_DATE,
11               INSTR(T.PROD\_DATE, '\-', 1, 1) + 1,
12               LENGTH(SUBSTR(T.PROD\_DATE, INSTR(T.PROD\_DATE, '\-', 1, 1) + 1)) \-
13               LENGTH(SUBSTR(T.PROD\_DATE, INSTR(T.PROD\_DATE, '月', 1, 1)))) || '\-' ||
14        SUBSTR(T.PROD\_DATE, 1, 2) AS PROD\_DATE
15   FROM TEST\_LP T

varchar2 类型 的 dd-m月-yy 亲测有效