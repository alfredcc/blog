---
title: Advanced Swift 学习笔记
author: racechao
date: 2020-11-16
tag:
  - swift
---

## if let
if let 解包的一个 value type 的时候要注意解包后的值只是一份copy，改变的时候不影响原来的值
```swift
let originInt: Int? = 2
if var new = originInt {
    new += 1 // 3
}

originInt   // 2
```

## flatMap 展平操作
flatMap 可以把结果展平为单个可选值
```swift
let value = ["1","2","3"].first.flatMap{ Int($0) } // Optional(1)
// 等价于
if let first = ["1","2","3"].first, let value = Int(first) {
    print(value) // 1
}
```

## 隐式可选值行为
在 iOS 编程的世界中我们经常会看到 `@IBOutlet var contentView: UIView!` 这样的代码，这是因为 ViewController 会延迟创建 view。这里有两个阶段:
 1. 创建 ViewController 自身 
 2. 加载 outlet view。在这两个阶段之间 outlet 引用还未被创建。

另外一个场景：因为我们的代码有时候会桥接 OC/C 的方法，OC 方法很久以前还没有引入可选值，但我们都知道 OC 的对象其实是一个引用（ptr指针），有时候这个引用会返回空。但大多数情况下都是有值的，所以为了书写方便就实现了隐式隐式可选值。

## 闭包的定义
> “在编程术语里，一个函数和它所捕获的变量环境组合起来被称为闭包”

## inout
1. inout 在 Swift 中其实不是引用传递，而是值传递，在函数结束的时候把新值 copy 回去。
> “一个 inout 参数持有一个传递给函数的值，函数可以改变这个值，然后从函数中传出并替换掉原来的值。”

1. 在闭包中不能让 inout 参数逃离（原因如上）
