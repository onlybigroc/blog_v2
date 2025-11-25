---
title: "JavaScript 获取数组对象中某一值封装为数组"
date: 2019-01-25T16:00:00.000Z
slug: JavaScript-获取数组对象中某一值封装为数组
categories: []
tags: ["JavaScript", "HTTPS", "获取数组对象中某一值封装为数组"]
summary: "1、获取数组对象中某一值封装为数组（一） data = \"2000-06-05\",116,\"2000-06-06\",129; var dateList = data.map(function (item) { return item0; }); console.log(dateList); ==&gt;\"2000-06-05\",\"2000-06-06\" &nbsp; 2、获取数..."
originUrl: "https://www.cnblogs.com/bigroc/p/10322606.html"
---

1、获取数组对象中某一值封装为数组（一）

data = \[\["2000-06-05",116\],\["2000-06-06",129\]\];
var dateList = data.map(function (item) {
    return item\[0\];
});
console.log(dateList);

\==>\["2000-06-05","2000-06-06"\]

2、获取数组对象中某一值封装为数组（二）

data=\[{"prodDate": "2018-01-02","oilProdDaily": 1.68},{"prodDate": "2018-01-03","oilProdDaily": 1.68}\];   
  
var prodData=data.map(function (item) {　　　　 return item\['prodDate'\];   
});   
console.log(prodData); \==>\["2018-01-02","2018-01-03",...\]

 原文：[https://www.cnblogs.com/bigroc/p/10322606.html](https://www.cnblogs.com/bigroc/p/10322606.html)