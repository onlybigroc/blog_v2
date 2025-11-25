---
title: "自然周算法-javascript实现"
date: 2021-06-15T16:00:00.000Z
slug: -javascript
categories: []
tags: []
summary: "获取自然周 js获取自然周 本文作者：bigroc 本文链接：https://www.cnblogs.com/bigroc/p/14888550.html 代码 function getWeeks() { // 当年的年份 let year = new Date().getFullYear(); let data = [] let d = new Date(year, 0, 1); while (..."
originUrl: "https://www.cnblogs.com/bigroc/p/14888550.html"
---

# 获取自然周

*   js获取自然周
*   本文作者：bigroc
*   本文链接：https://www.cnblogs.com/bigroc/p/14888550.html

## 代码

```javascript
function getWeeks() {
    // 当年的年份
    let year = new Date().getFullYear();
    let data = []
    let d = new Date(year, 0, 1);
    while (d.getDay() !== 1) {
        // 以第一个星期一为开始日期
        d.setDate(d.getDate() + 1);
    }
    let to = new Date(year, 11, 31);
    while (to.getDay() !== 0) {
        // 以星期日为结束日期
        to.setDate(to.getDate() + 1);
    }
    let i = 1;
    for (let from = d; from < to;) {
    // 可按照要求重构下面代码
    // 重构时注意“浅拷贝”问题 拼接方式虽然较为搓
    // 但可以避“浅拷贝”导致的数据出错的问题
    // 可以自己实现“深拷贝”方法或者使用三方实现
        let str = '';
        str = str + (i < 10 ? '0' + i : i) + "(周)" + year + "-" + ((from.getMonth() + 1) <= 9 ? ('0' + (from.getMonth() + 1)) : (from.getMonth() + 1)) + "-" + (from.getDate() <= 9 ? ('0' + from.getDate()) : from.getDate()) + " 至 ";
        from.setDate(from.getDate() + 6);
        if (from < to) {
            str = str + year + "-" + ((from.getMonth() + 1) <= 9 ? ('0' + (from.getMonth() + 1)) : (from.getMonth() + 1)) + "-" + (from.getDate() <= 9 ? ('0' + from.getDate()) : from.getDate());
            from.setDate(from.getDate() + 1);
        } else {
            str = str + year + "-" + ((to.getMonth() + 1) <= 9 ? ('0' + (to.getMonth() + 1)) : (to.getMonth() + 1)) + "-" + (to.getDate() <= 9 ? ('0' + to.getDate()) : to.getDate());
        }
        let obj = {
            sun: i,
            week: year + "-" + str.split("(周)")[0],
            weekName: year + "-" + str.split("(周)")[0] + "(周)",
            startDate: str.split("(周)")[1].split(" 至 ")[0],
            entData: str.split("(周)")[1].split(" 至 ")[1]
        }
        data.push(obj)
        i++;
    }
    return data;
}
```

## 结果

![image](/images/posts/-javascript-1764044989471.png)

*   参考博文：[获取当年的所有自然周+获取当前是第几自然周+JS获取指定日期的前一天，后一天](https://www.cnblogs.com/wu2020/p/12956946.html "获取当年的所有自然周+获取当前是第几自然周+JS获取指定日期的前一天，后一天")