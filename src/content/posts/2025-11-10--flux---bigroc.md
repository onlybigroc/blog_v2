---
title: "学习如何创建 Flux 实例 - bigroc"
date: 2025-11-10T10:44:00.000Z
slug: -flux---bigroc
categories: []
tags: []
summary: "学习如何创建 Flux 实例 描述 AFlux&lt;T&gt;是一个响应式流Publisher，它增强了许多操作符，可用于生成、转换、编排 Flux 序列。 它可以发出 0 到n 个 &lt;T&gt;元素（onNext事件），然后完成或出错（onComplete以及onError终止事件）。如果没有触发终止事件，则循环Flux将无限进行。 Flux 上的静态工厂允许创建源，或从多个回调类型生成..."
originUrl: "https://www.cnblogs.com/bigroc/p/19207914"
---

# 学习如何创建 Flux 实例

## 描述

A`Flux<T>`是一个响应式流`Publisher`，它增强了许多操作符，可用于生成、转换、编排 Flux 序列。  
它可以发出 0 到n 个 `<T>`元素（`onNext`事件），然后完成或出错（`onComplete`以及`onError`终止事件）。如果没有触发终止事件，则循环`Flux`将无限进行。

*   Flux 上的静态工厂允许创建源，或从多个回调类型生成源。
*   实例方法（即运算符）允许您构建异步处理管道，该管道将生成异步序列。
*   每个`Flux#subscribe()`或多播操作（例如`Flux#publish`）`Flux#publishNext` 都会创建一个专用的管道实例，并触发其中的数据流。  
    请参阅此处的 [javadoc](https://projectreactor.io/docs/core/release/api/reactor/core/publisher/Flux.html)  
    ![image](/images/posts/-flux---bigroc-1764048217642.png)

## 实践

> ![tip](/images/posts/-flux---bigroc-1764048217876.png)  
> 提示：如果您想了解某个操作内部正在发生什么`Flux`，或者`Mono`在练习过程中即将返回某个操作，您可以`.log()`在返回之前随时向该操作添加参数。第 6 部分就用到了这一点。

```java
package com.qinrenjihe;

import org.jspecify.annotations.NonNull;
import reactor.core.publisher.Flux;

public class Main {
    // 创建一个空的 Flux
    static Flux<@NonNull String> emptyFlux() {
        return Flux.empty();
    }

    // 返回一个包含2个值“foo”和“bar”的Flux，而不使用数组或集合
    static Flux<@NonNull String> fooBarFluxFromValues() {
        return Flux.just("foo", "bar");
    }

    // fooBarFluxFromList 从包含两个值“foo”和“bar”的列表中创建一个Flux
    static Flux<@NonNull String> fooBarFluxFromList() {
        return Flux.fromIterable(
                java.util.Arrays.asList("foo", "bar")
        );
    }

    // errorFlux 创建一个发出IllegalStateException的Flux
    static Flux<@NonNull String> errorFlux() {
        return Flux.error(new IllegalStateException("Something went wrong"));
    }

    // 创建一个通量，每100ms发出从0到9的递增值
    static Flux<@NonNull Long> counter() {
        return Flux.interval(java.time.Duration.ofMillis(100)).take(10);
    }

    public static void main(String[] args) {
        // 1. 创建一个空的 Flux
        Main.emptyFlux().subscribe(System.out::println);
        // 2. 返回一个包含2个值“foo”和“bar”的Flux，而不使用数组或集合
        Main.fooBarFluxFromValues().subscribe(System.out::println);
        // 3. 从包含两个值“foo”和“bar”的列表中创建一个Flux
        Main.fooBarFluxFromList().subscribe(System.out::println);
        // 4. 创建一个发出 IllegalStateException 的 Flux
        // Main.errorFlux().subscribe(System.out::println,Throwable::printStackTrace);
        // 5. 创建一个通量，每100ms发出从0到9的递增值
        Long lastValue = Main.counter()//
                .doOnNext(System.out::println) // 在发出每个值时打印
                .doFinally(System.out::println) // 在完成时打印
                .blockLast(); // 等待完成
        System.out.println("Last value: " + lastValue);
    }
}
```

原文：[https://tech.io/playgrounds/929/reactive-programming-with-reactor-3/Flux](https://tech.io/playgrounds/929/reactive-programming-with-reactor-3/Flux)