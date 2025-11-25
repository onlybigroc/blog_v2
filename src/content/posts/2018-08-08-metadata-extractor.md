---
title: "使用metadata-extractor获取照片中的位置、曝光度、大小..."
date: 2018-08-08T16:00:00.000Z
slug: metadata-extractor
categories: []
tags: []
summary: "使用metadata-extractor实现获取图片中的属性信息 官网：https://drewnoakes.com/code/exif/ 简介：metadata-extractor允许您通过简单的API访问数字图像和视频中的元数据。 支持的图像文件类型： JPEG PNG WebP GIF ICO BMP TIFF PSD PCX RAW CRW CR2 NEF ORF RAF RW2 RWL ..."
originUrl: "https://www.cnblogs.com/bigroc/p/9450138.html"
---

# 使用_metadata-extractor实现获取图片中的属性信息_

## 官网：[https://drewnoakes.com/code/exif/](https://drewnoakes.com/code/exif/)

## _简介：metadata-extractor_允许您通过简单的API访问数字图像和视频中的元数据。

## 支持的图像文件类型：

JPEG PNG WebP GIF ICO BMP TIFF PSD PCX RAW CRW CR2 NEF ORF RAF RW2 RWL SRW ARW DNG X3F heic

## 支持的视频文件类型：

MOV MP4 M4V 3G2 3GP 3GP

## 元数据格式：

Exif IPTC XMP JFIF JFXX ICC 8BIM

## maven坐标（请使用最新版本）：

<!-- https://mvnrepository.com/artifact/com.drewnoakes/metadata-extractor \-->
<dependency\>
    <groupId\>com.drewnoakes</groupId\>
    <artifactId\>metadata-extractor</artifactId\>
    <version\>2.18.0</version\>
</dependency\>

Java Code：

public static void main(String\[\] args) throws ImageProcessingException,IOException{
        File jpegFile \= new File("C:/Users/bigroc/Desktop/pic/1.jpeg");
        Metadata metadata \= ImageMetadataReader.readMetadata(jpegFile);
        for (Directory directory : metadata.getDirectories()) {
            for (Tag tag : directory.getTags()) {
                //格式化输出\[directory.getName()\] - tag.getTagName() = tag.getDescription()
                System.out.format("\[%s\] - %s = %s\\n",
                        directory.getName(), tag.getTagName(), tag.getDescription());
            }
            if (directory.hasErrors()) {
                for (String error : directory.getErrors()) {
                    System.err.format("ERROR: %s", error);
                }
            }
        }
    }