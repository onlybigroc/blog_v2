---
title: "Java使用QRCode.jar生成与解析二维码"
date: 2017-09-08T16:00:00.000Z
slug: javaqrcodejar
categories: []
tags: []
summary: "原文：https://www.cnblogs.com/bigroc/p/7496995.html 正题：Java使用QRCode.jar生成与解析二维码demo 欢迎新手共勉，大神监督指正 注意：创建二维码之前的工作 去下面给出的地址下载QRCode.jar包，此jar包已经包括 生成与解析 。官网下载到的jar包是没有解析的，这里给出我打好的包&nbsp;https://files.cnblog..."
originUrl: "https://www.cnblogs.com/bigroc/p/7496995.html"
---

# 原文：[https://www.cnblogs.com/bigroc/p/7496995.html](https://www.cnblogs.com/bigroc/p/7496995.html)

# **正题：Java使用QRCode.jar生成与解析二维码demo**

### 欢迎新手共勉，大神监督指正

## **注意：创建二维码之前的工作**

**去下面给出的地址下载QRCode.jar包，此jar包已经包括 生成与解析 。****官网下载到的jar包是没有解析的，这里给出我打好的包** **[https://files.cnblogs.com/files/bigroc/QRCode.zip](https://files.cnblogs.com/files/bigroc/QRCode.zip "下载QRCode")**

## 第一部分：生成二维码  

import com.swetake.util.Qrcode;

import javax.imageio.ImageIO;
import java.awt.\*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

/\*\*
 \* Created by BigRoc on 2017/9/8.
 \*/
public class CreateQRCode {
    public static void main(String\[\] args) throws IOException {

        //计算二维码图片的高宽比
        // API文档规定计算图片宽高的方式 ，v是本次测试的版本号
        int v =6;
        int width = 67 + 12 \* (v - 1);
        int height = 67 + 12 \* (v - 1);


        Qrcode x \= new Qrcode();
        /\*\*
         \* 纠错等级分为
         \* level L : 最大 7% 的错误能够被纠正；
         \* level M : 最大 15% 的错误能够被纠正；
         \* level Q : 最大 25% 的错误能够被纠正；
         \* level H : 最大 30% 的错误能够被纠正；
         \*/
        x.setQrcodeErrorCorrect('L');
        x.setQrcodeEncodeMode('B');//注意版本信息 N代表数字 、A代表 a-z,A-Z、B代表 其他)
        x.setQrcodeVersion(v);//版本号  1-40
        String qrData = "https://www.bigroc.cn";//内容信息

        byte\[\] d = qrData.getBytes("utf-8");//汉字转格式需要抛出异常

        //缓冲区
        BufferedImage bufferedImage = new BufferedImage(width, height, BufferedImage.TYPE\_INT\_BGR);

        //绘图
        Graphics2D gs = bufferedImage.createGraphics();

        gs.setBackground(Color.WHITE);
        gs.setColor(Color.BLACK);
        gs.clearRect(0, 0, width, height);

        //偏移量
        int pixoff = 2;


        /\*\*
         \* 容易踩坑的地方
         \* 1.注意for循环里面的i，j的顺序，
         \*   s\[j\]\[i\]二维数组的j，i的顺序要与这个方法中的 gs.fillRect(j\*3+pixoff,i\*3+pixoff, 3, 3);
         \*   顺序匹配，否则会出现解析图片是一串数字
         \* 2.注意此判断if (d.length > 0 && d.length < 120)
         \*   是否会引起字符串长度大于120导致生成代码不执行，二维码空白
         \*   根据自己的字符串大小来设置此配置
         \*/
        if (d.length > 0 && d.length < 120) {
            boolean\[\]\[\] s = x.calQrcode(d);

            for (int i = 0; i < s.length; i++) {
                for (int j = 0; j < s.length; j++) {
                    if (s\[j\]\[i\]) {
                        gs.fillRect(j \* 3 + pixoff, i \* 3 + pixoff, 3, 3);
                    }
                }
            }
        }
        gs.dispose();
        bufferedImage.flush();
        //设置图片格式，与输出的路径
        ImageIO.write(bufferedImage, "png", new File("D:/qrcode.png"));
        System.out.println("二维码生成完毕");
    }
}

## 第二部分：解析二维码（注意：其中需要实现QRCodeImage接口）

package com.bigroc.qrcode;

import jp.sourceforge.qrcode.QRCodeDecoder;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

/\*\*
 \* Created by BigRoc on 2017/9/8.
 \*/
public class ReadQRCode {
    public static void main(String\[\] args) throws IOException {
        //图片路径
        File file = new File("D:/qrcode.png");
        //读取图片到缓冲区
        BufferedImage bufferedImage = ImageIO.read(file);
        //QRCode解码器
        QRCodeDecoder codeDecoder = new QRCodeDecoder();
        /\*\*
         \*codeDecoder.decode(new MyQRCodeImage())
         \*这里需要实现QRCodeImage接口，移步最后一段代码
         \*/
        //通过解析二维码获得信息
        String result = new String(codeDecoder.decode(new MyQRCodeImage(bufferedImage)), "utf-8");
        System.out.println(result);
    }
}

## 第三部分：实现QRCodeImage接口

package com.bigroc.qrcode;

import jp.sourceforge.qrcode.data.QRCodeImage;

import java.awt.image.BufferedImage;

/\*\*
 \* 实现QRCodeImage接口，
 \* 设置解码的图片信息
 \* 告诉codeDecoder.decode()将要解析的图片类型
 \* Created by BigRoc on 2017/9/9.
 \*/
public class MyQRCodeImage implements QRCodeImage{


    BufferedImage bufferedImage;

    public MyQRCodeImage(BufferedImage bufferedImage){
        this.bufferedImage=bufferedImage;
    }

    //宽
    @Override
    public int getWidth() {
        return bufferedImage.getWidth();
    }

    //高
    @Override
    public int getHeight() {
        return bufferedImage.getHeight();
    }

    //像素还是颜色
    @Override
    public int getPixel(int i, int j) {
        return bufferedImage.getRGB(i,j);
    }
}

##### 重要！！非常重要的部分！！！

##### 在开发中遇到的问题都在代码中做出了解释说明，

##### 如有园友在测试中还有其他问题欢迎通过评论来提出意见或者问题！

原文链接（转载请标明）：[http://www.cnblogs.com/bigroc/p/7496995.html](http://www.cnblogs.com/bigroc/p/7496995.html)