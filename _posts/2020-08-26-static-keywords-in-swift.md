---
title: 讲讲 static 关键字在 Swift 中的作用
author: racechao
date: 2020-08-26
tag:
  - swift static
---
今天和群里小伙伴讨论到 `static` ，发现自己并没有特别了解 `static` 这个关键字。
我有两个疑问：
1. 在 Swift 中的 `static` 究竟是什么?
2. 修饰了 `static` 的 property *初始化*是否线程安全?

#### 在 Swift 中的 `static` 究竟是什么

我们经常看到有的 Swift 中有的 `property` 和 `func` 会用 static 修饰，他们其实有个官方的叫法是 `Type Property` 和 `Type func`。字面上理解就是属于 Type 的属性和方法（Swift 中 class 和 struct 都属于 Type）。
>You can also define properties that belong to the type itself, not to any one instance of that type.  
-- by Apple Document

那么 `Type Property` 和 `Instance Property` 究竟有什么区别呢?看看官方文档的解释

>Instance properties are properties that belong to an instance of a particular type. Every time you create a new instance of that type, it has its own set of property values, separate from any other instance.

意思就是 `Instance properties` 是和具体的实例相关的，你创建了多少个实例就会有多少个不同的 `properties`.而 `Type Property` 就不一样了，他是 `one copy` 的，简单理解就是只会有一份内存拷贝，在类型之间是共享的。另外有个特性就是`惰性赋值`，在第一次被访问的时候才会初始化。

#### 修饰了 `static` 的 property *初始化*是否线程安全？

结论很简单，是线程安全的，因为上面的提到的修饰 static 的 Property 都是 `one copy` 的。
不信看代码：我们看到堆栈里面有个 `swift_once` 的方法，他保证了我们的 `Type Property` 不管是用 `let` 还是 `var` 修饰的都只会被初始化一次。所以大家也就明白 Swift 中的单列为啥可以这么写了：`static let shared = SharedClass()` 
![img](/assets/img/static-in-swift-01.png)

#### 总结

1. 被 static 修饰的 property 叫做 Type Property（也叫 Stored type properties）
2. 不管用 let 还是 var 修饰的 Type Property *初始化*都是线程安全的。修饰了 static 的 property（Type Property）都会调用 swift_once 函数，确保只初始化一次 (文档里叫 one copy)。
   

参考文档：https://docs.swift.org/swift-book/LanguageGuide/Properties.html
