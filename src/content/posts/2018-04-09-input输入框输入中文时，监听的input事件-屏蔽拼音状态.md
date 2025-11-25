---
title: "input输入框输入中文时，监听的input事件 屏蔽拼音状态"
date: 2018-04-09T16:00:00.000Z
slug: input输入框输入中文时，监听的input事件-屏蔽拼音状态
categories: []
tags: ["input输入框输入中文时", "监听的input事件", "屏蔽拼音状态"]
summary: "$(function () { $('#jh').off().on({ //中文输入开始 compositionstart: function () { cpLock = false; }, //中文输入结束 compositionend: function () { cpLock = true; }, //input框中的值发生变化 input: function () { if (cpLock..."
originUrl: "https://www.cnblogs.com/bigroc/p/8781316.html"
---

$(function () {
        
        $('#jh').off().on({
            //中文输入开始
            compositionstart: function () {
                cpLock \= false;
            },
            //中文输入结束
            compositionend: function () {
                cpLock \= true;
            },
            //input框中的值发生变化
            input: function () {
                if (cpLock){
                    //这里处理中文输入结束的操作
                }
            }
        })
    });

实际测试中发现 输入中文完成后需要 一个空格或者其他非中文的字符触发事件