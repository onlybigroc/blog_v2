---
title: "StepVerifier-步骤验证器及其使用方法 - bigroc"
date: 2025-11-11T03:14:00.000Z
slug: stepverifier----bigroc
categories: []
tags: []
summary: "StepVerifier 描述 到目前为止，你对每个练习的解答都是通过将 Publisher 你定义的答案传递给一个测试用例来检查的 StepVerifier。 该工件中的此类 reactor-test 能够订阅任何 Publisher （例如，Flux Akka Stream 或 A 流……），然后断言一组关于该序列的用户定义期望。 如果触发的任何事件与当前预期不符，则会 StepVerifie..."
originUrl: "https://www.cnblogs.com/bigroc/p/19209475"
---

# StepVerifier

## 描述

到目前为止，你对每个练习的解答都是通过将 `Publisher` 你定义的答案传递给一个测试用例来检查的 `StepVerifier`。  
该工件中的此类 `reactor-test` 能够订阅任何 `Publisher` （例如，Flux Akka Stream 或 A 流……），然后断言一组关于该序列的用户定义期望。  
如果触发的任何事件与当前预期不符，则会 `StepVerifier` 产生一个 `AssertionError`。

`StepVerifier` 您可以从静态工厂获取一个实例 `create`。它提供了一个 DSL，用于设置数据部分的预期，并以单个终端预期（完成、错误、取消……）结束。

请注意，您必须始终调用该 `verify()` 方法或结合终端期望和验证的快捷方式之一，例如 `.verifyErrorMessage(String)`。否则，它将 `StepVerifier` 不会订阅您的序列，也不会断言任何内容。

```
StepVerifier.create(T<Publisher>).{expectations...}.verify()
```

有很多可能的预期，请参阅 [参考文档](https://projectreactor.io/docs/core/release/reference/aboutDoc.html) 和 [javadoc](https://javadoc.io/page/io.projectreactor.addons/reactor-test/3.0/reactor/test/StepVerifier.Step.html)。

## 实践

在这些练习中，方法会接收一个 `Flux` 或者 `Mono` 对象作为参数，你需要测试它的行为。你应该创建一个StepVerifier使用该 Flux/Mono 对象的测试用例，描述对它的预期并进行验证。

```

public class Part03StepVerifier {

    /**
     * Learn how to use StepVerifier to test Mono, Flux or any other kind of Reactive Streams Publisher.
     *
     * @author Sebastien Deleuze
     * @see <a href="https://projectreactor.io/docs/test/release/api/reactor/test/StepVerifier.html">StepVerifier Javadoc</a>
     */

//========================================================================================

    // TODO Use StepVerifier to check that the flux parameter emits "foo" and "bar" elements then completes successfully.
    public void expectFooBarComplete(Flux<@NonNull String> flux) {
        StepVerifier.create(flux)
                .expectNext("foo")
                .expectNext("bar")
                .expectComplete()
                .verify();
    }

//========================================================================================

    // TODO Use StepVerifier to check that the flux parameter emits "foo" and "bar" elements then a RuntimeException error.
    public void expectFooBarError(Flux<@NonNull String> flux) {
        StepVerifier.create(flux)
                .expectNext("foo")
                .expectNext("bar")
                .expectError(RuntimeException.class)
                .verify();
    }

//========================================================================================

    // TODO Use StepVerifier to check that the flux parameter emits a User with "swhite"username
    // and another one with "jpinkman" then completes successfully.
    public void expectSkylerJesseComplete(Flux<@NonNull User> flux) {
        StepVerifier.create(flux)
                .expectNextMatches(user -> "swhite".equals(user.getUsername()))
                .expectNextMatches(user -> "jpinkman".equals(user.getUsername()))
                .expectComplete()
                .verify();
    }

//========================================================================================

    // TODO Expect 10 elements then complete and notice how long the test takes.
    public void expect10Elements(Flux<@NonNull Long> flux) {
        StepVerifier.create(flux)
                .expectNextCount(10)
                .expectComplete()
                .verify();
    }

//========================================================================================

    // TODO Expect 3600 elements at intervals of 1 second, and verify quicker than 3600s
    // by manipulating virtual time thanks to StepVerifier#withVirtualTime, notice how long the test takes
    public void expect3600Elements(Supplier<Flux<@NonNull Long>> supplier) {
        StepVerifier.withVirtualTime(supplier)
                .expectSubscription()
                .thenAwait(Duration.ofSeconds(3600))
                .expectNextCount(3600)
                .expectComplete()
                .verify();
    }

}

```

```java
    @Test
    public void TestStepVerifier(){
        Part03StepVerifier pt3 = new Part03StepVerifier();
        pt3.expectFooBarComplete(Flux.just("foo", "bar"));
        // pt3.expectFooBarError(Flux.just("","foo", "bar"));
        pt3.expectSkylerJesseComplete(Flux.just(User.SKYLER, User.JESSE));

        Flux<@NonNull Long> fluxWith10Elements = Flux.interval(Duration.ofMillis(100)).take(10);
        pt3.expect10Elements(fluxWith10Elements);

        Supplier<Flux<@NonNull Long>> supplier = () -> Flux.interval(Duration.ofSeconds(1))
                .take(3600)
                .map(i -> i + 1);
        pt3.expect3600Elements(supplier);
    }
```