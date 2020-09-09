---
title: Swift 中关于 Memberwise Initializer 的一个小技巧
author: racechao
date: 2020-09-09
tag:
  - github actions
---
我们都知道在 Swift 的 Struct 中，如果我们不实现 init 方法，compile 会默认帮我们生成，官方文档把这叫作 `memberwise initializer`。当我的 model 中有很多 property 这就很方便了，不用写一长串的 init() 函数。但是当我们自定义了一个初始化方法，这个“默认的”初始化方法就不能用了。

![img](/assets/img/memberwise.png)

如果我们要同事保留两个方法，只要把自定义初始化方法放到 Extension 即可。

```swift
struct Foo {
  let bar: Int
}

extension Foo {
  init(customInit bar: Int) {
    self.bar = bar
  }
}

Foo(bar: 1)
```

![img](/assets/img/yellow.gif)
当然 `memberwise initializer` 也有很多其他限制, [swift forums](https://forums.swift.org/t/state-of-the-memberwise-initializer/17168) 论坛有提到过。大概有一下几点

1. Defining a custom init in a struct disables the memberwise initializer, and there is no easy way to get it back.
2. Access control + the memberwise init often requires you to implement it yourself.
3. We don’t get memberwise inits for classes.
4. var properties with default initializers should have their parameter to the synthesized initializer defaulted.
5. lazy properties with memberwise initializers have problems (the memberwise init eagerly touches it).

详细内容可以在上面的链接看到，有具体的代码可以看，更容易理解。
当然有些约束和限制并不是缺点，反而正因为这些限制使得我们可以写出更加安全的代码。