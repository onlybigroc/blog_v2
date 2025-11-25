---
title: "windows下的批处理bat文件和Linux下的shell文件的含义"
date: 2022-04-07T16:00:00.000Z
slug: windowsbatlinuxshell
categories: []
tags: []
summary: "原文：https://www.cnblogs.com/caiguodong/p/10308255.html shell（Linux、Solaris） bat（windows） 含义 # rem 注释行 /【directory】/【directory】/.../【directory】/ 【disk】:\【directory】\【directory】\...\【directory】\ path 【变量..."
originUrl: "https://www.cnblogs.com/bigroc/p/16118044.html"
---

原文：https://www.cnblogs.com/caiguodong/p/10308255.html

shell（Linux、Solaris）

bat（windows）

含义

#

rem

注释行

/【directory】/【directory】/.../【directory】/

【disk】:\\【directory】\\【directory】\\...\\【directory】\\

path

【变量】=【文件名】,LBSAM

set 【变量】=【文件名】,BSAM

把文件名赋值给变量

【变量】=【设定值】

【变量】="【设定值】"

【变量】='【设定值】'

【变量】=【设定值】; export 【变量】

export 【变量】=【设定值】

set 【变量】=【设定值】

变量的赋值

unset 【变量】

set 【变量】=

变量的初始化

${【变量】}

$【变量】

%【变量】%

变量的引用

※如果变量在if语句和for循环中被赋值了的话，

在引用的时候需要用!【变量】!。

※如果使用!【变量】!，要添加（延迟环境变量）

setlocal enabledelayedexpansion

$【数字】

${【数字】}

%【数字】

shell/bat启动的时候，传入的第【数字】个参数

$1/%1 →启动时传入的第一个参数

【变量】=\`basename $0 .sh\`

set 【变量】=%~n0

本shell/bat的文件名字赋值给变量

test1.sh/test.bat → 变量=test

【变量】=\`dirname 【文件】\`

for %%i in ("【文件】") do (set 【变量】=%%~dpi)

取得所在文件路径赋值给变量

例 ：

**shell:**

path1=\`dirname /home/dir1/dir2/test.txt\`

**↓**

path1=/home/dir1/dir2

**bat  ：**

for %%i in ("D:\\dir1\\dir2\\test.txt") do (

  set path2=%%~dpi

)

**↓**

path2=D:\\dir1\\dir2

【变量】=\`basename 【文件】\`

for %%i in ("【文件】") do (set 【变量】=%%~nxi)

取得所在文件路径赋值给变量

例 ：

**shell:**

filename1=\`dirname /home/dir1/dir2/test.txt\`

**↓**

filename1=test.txt

**bat  ：**

for %%i in ("D:\\dir1\\dir2\\test.txt") do (

  set filename2=%%~dpi

)

**↓**

filename2=test.txt

【变量】=$?

 set 【变量】=%errorlevel%

上一个命令执行的结果赋值给变量

if \[ 【条件】 \]; then  
    【处理1】  
else  
    【处理2】  
fi

if 【条件】 (  
    【处理1】  
) else (  
    【处理2】  
)

※shell里面的if语句（if test 【条件】）和

（if \[ 【条件】 \]）意思一样

 if \[ $【变量】 -eq 【数值】 \]; then

 if %【变量】% equ 【数值】 (

 等于

 if \[ $【变量】 -ne 【数值】 \]; then

 if %【变量】% neq 【数值】 (

 不等于

 if \[ $【变量】 -lt 【数值】 \]; then

 if %【变量】% lss 【数值】 (

 小于

 if \[ $【变量】 -le 【数值】 \]; then

 if %【变量】% leq 【数值】 (

 小于等于

 if \[ $【变量】 -gt 【数值】 \]; then

 if %【变量】% gtr 【数值】 (

 大于

 if \[ $【变量】 -ge 【数值】 \]; then

 if %【变量】% geq 【数值】 (

 大于等于

 if \[ $【变量】 = "【字符串】" \]; then

 if %【变量】%==【文字列】 (

 等于

 if \[ $【变量】 != "【字符串】" \]; then

 if not %【变量】%==【文字列】 (

 不等于

 if \[ -e 【文件 or 文件夹】 \]; then

 if exist 【文件 or 文件夹】 (

 文件或文件夹存在

 if \[ ! -e 【文件or 文件夹】 \]; then

 if not exist 【文件 or 文件夹】 (

 文件或文件夹不存在

 if \[ -f 【对象】 \]; then

 for %%A in ("【对象】") do (set 【变量】=%%~aA)  
 if  "%【变量】:~0,1%"=="-" (

 对象是文件

※shell里面如果是if \[ ! -f 【对象】 \]; then的时候，对应的bat是

if  not "%【变量】:~0,1%"=="-" (

意思是判断对象是否是文件以外

 if \[ -d 【对象】 \]; then

 for %%A in ("【对象】") do (set 【变量】=%%~aA)  
 if  "%【变量】:~0,1%"=="d" (

 对象是文件夹

 if \[ -s 【文件】 \]; then

 for %%A in ("【文件】") do (set 【变量】=%%~zA)  
 if  %【变量】% gtr 0 (

 文件的size大于0

 \`date '+%Y%m%d'\`

 %date:~0,4%%date:~5,2%%date:~8,2%

 2018/9/30 → 20180930

 find 【路径】 -mtime +【数字】 -name "\*" -type f -exec rm -f {} \\;

 PowerShell -Command "Get-ChildItem '【路径】'

\-force | Where-Object {($\_.Mode.Substring(0,1)

\-ne 'd') -and ($\_.LastWriteTime -lt (Get-Date).

AddDays(-【数字+1】))} | Remove-Item  -force"

将指定路径下更新日期在【数字+1】天以前的文件删除

例如：把路径下更新日期在7天之前的文件删除

shell： find 【路径】 -mtime +6 -name "\*" -type f -exec rm -f {} \\;

bat：PowerShell -Command "Get-ChildItem '【路径】' -force |

Where-Object {($\_.Mode.Substring(0,1) -ne 'd') -and (

$\_.LastWriteTime -lt (Get-Date).AddDays(-7))} | Remove-Item  -force"

 source 【\*\*\*\*.sh】

【\*\*\*\*.sh】

 call 【\*\*\*\*.bat】

 调用其它文件

 \`date '+%Y/%m/%d %H:%M:%S'\`

 %date% %time:~0,8%

 2018/8/24 8:45:30 → 2018/08/24 08:45:30

 rm 【文件】

 del /f /q 【文件】

 删除

 rm -f 【文件】

 del /f /q 【文件】

 删除

 rm -r 【文件名 or 文件夹】

rm -rf 【文件名 or 文件夹】

 ※文件的时候  
del /f /q 【文件】  
※文件夹的时候  
rmdir /s /q 【文件夹】

 删除

 【命令】 | tee -a 【log文件】

 DEL 【临时文件】  
命令> 【临时文件】 2>&1  
TYPE 【临时文件】  
TYPE 【临时文件】 >>【log文件】