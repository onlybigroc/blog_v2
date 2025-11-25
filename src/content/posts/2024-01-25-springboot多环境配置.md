---
title: "springboot多环境配置"
date: 2024-01-25T16:00:00.000Z
slug: springboot多环境配置
categories: []
tags: ["Spring", "SpringBoot", "Maven", "springboot多环境配置"]
summary: "springboot多环境配置 maven profile application.yml # Spring配置 spring: profiles: active: @profile.active@ pom.xml profile &lt;profiles&gt; &lt;profile&gt; &lt;id&gt;dev&lt;/id&gt; &lt;properties&gt; &lt;pro..."
originUrl: "https://www.cnblogs.com/bigroc/p/17988462"
---

# springboot多环境配置 maven profile

## application.yml

```yml
# Spring配置
spring:
  profiles:
    active: @profile.active@
```

## pom.xml profile

```xml
<profiles>
    <profile>
        <id>dev</id>
        <properties>
            <profile.active>dev</profile.active>
        </properties>
        <activation>
            <!-- 默认 -->
            <activeByDefault>true</activeByDefault>
        </activation>
    </profile>
    <profile>
        <id>prod</id>
        <properties>
            <profile.active>prod</profile.active>
        </properties>
    </profile>
</profiles>
```

## pom.xml resources

```xml
<build>
    <resources>
        <resource>
            <directory>src/main/resources</directory>
            <!--先排除所有的配置文件-->
            <excludes>
                <exclude>application*.yml</exclude>
            </excludes>
        </resource>
        <resource>
            <directory>src/main/resources</directory>
            <!--引入所需环境的配置文件-->
            <filtering>true</filtering>
            <includes>
                <include>application.yml</include>
                <include>application-${profile.active}.yml</include>
            </includes>
        </resource>
    </resources>
</build>
```

## 刷新Maven

![image](/images/posts/ce9ea936f963df84958d91f114f20068.png)

## 可选择对应的启动环境

![image](/images/posts/cc44a0549309159e6d87912579e386b8.png)

## 如果出现以下错错误，clean 后刷新 maven 再试！！！

```log
found character '@' that cannot start any token. (Do not use @ for indentation) in 'reader', line 51, column 13: active: @profiles.active@ ^
```