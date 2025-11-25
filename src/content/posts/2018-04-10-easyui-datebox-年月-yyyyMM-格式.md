---
title: "easyui datebox 年月 yyyyMM 格式"
date: 2018-04-10T16:00:00.000Z
slug: easyui-datebox-年月-yyyyMM-格式
categories: []
tags: ["easyui", "datebox", "年月", "yyyyMM", "格式"]
summary: "//js日期重写ny为 function formatTime(ny){ var p = ny.datebox('panel'), //日期选择对象 tds = false, //日期选择对象中月份 span = p.find('div.calendar-title span'); //显示月份层的触发控件 ny.datebox({ onShowPanel: function () { curre..."
originUrl: "https://www.cnblogs.com/bigroc/p/8793905.html"
---

//js日期重写ny为
function formatTime(ny){
    
    var p = ny.datebox('panel'), //日期选择对象
    tds = false, //日期选择对象中月份
    span = p.find('div.calendar-title span'); //显示月份层的触发控件
    ny.datebox({
                onShowPanel: function () {
                    currentText\='';
                    //显示日趋选择对象后再触发弹出月份层的事件，初始化时没有生成月份层
                    //触发click事件弹出月份层
                    span.trigger('click'); 
                    if (p.find('div.calendar-menu').is(':hidden')) p.find('div.calendar-menu').show();
                    if (!tds) 
                        setTimeout(function () {
                            //延时触发获取月份对象，因为上面的事件触发和对象生成有时间间隔
                            tds = p.find('div.calendar-menu-month-inner td');
                            tds.click(function (e) {
                                //禁止冒泡执行easyui给月份绑定的事件
                                e.stopPropagation();
                                //得到年份
                                var year = /\\d{4}/.exec(span.html())\[0\],
                                //月份，这里不需要+1
                                month = parseInt($(this).attr('abbr'), 10);
                                month\=month<parseInt('10')?("0"+month):month;
                                ny.datebox('hidePanel')//隐藏日期对象
                            .datebox('setValue', year + '' + month); //设置日期的值(''里面可以添加'-'等格式)
                        });
                    }, 0);
                },
                /\*parser : function(s) {// 配置parser，返回选择的日期    
                    if (!s)    
                        return new Date();    
                    var arr = s.split('-');    
                    return new Date(parseInt(arr\[0\], 10), parseInt(arr\[1\], 10) - 1, 1);    
                },\*/    
                formatter: function (date) {
                    var a = parseInt(date.getMonth())<parseInt('9')?"0"+(parseInt(date.getMonth()+ 1)):date.getMonth() + 1;
                    return date.getFullYear() + '' +a; 
                }
      });
    
}  

略有bug，之后修复