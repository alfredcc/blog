---
title: Advanced Swift 学习笔记
author: racechao
date: 2020-11-16
tag:
  - swift
---

一个优秀的程序员往往对技术层面的边界非常清楚，对这些边界的认知可以让我们知道什么技术用来解决什么问题。

在学习语言的过程中也是一样，只有清楚认识到各种语法以及编程语言语意上的不同之处及边界，才能让我们写出更好的代码。学习《Advanced Swift》这本书，希望可以提升自己对 swift 这门语言在这方面的认知，写出更好的代码。在读书的时候，虽然当我们遇到新的知识点会豁然开朗的感觉，但随着时间的流逝很多当时觉得耳目一新的知识点往往会被忘记，只有反复阅读才能慢慢吸收变成自己的知识。这也是我记录笔记的原因。

> 如果文章内容有侵权的地方，请联系我

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

## autoclosure
在编程语言中 && 操作符的右边是延迟执行的，只有左边满足条件才会调用右边。因为 swift 函数是一等公民，我们可以用闭包（匿名函数）来实现这个“延迟执行”的功能，如下：
```swift
func and(_ l: Bool, _ r: () -> Bool) -> Bool {
  guard l else { return false }
  return r()
}
```
但是在调用的时候就比较麻烦，需要在调用参数上加"{}"，比较好的是 swfit 加入了 `@autoclosure` 的语法糖，使得我们可以省略{}的写法。另外因为 closure 延迟的特性，我们的“参数方法”不一定会被执行到，我们应当谨慎使用。

## struct 
struct 相比 class 更加轻量，没有继承，不能共享内存，也没有引用计数，但 struct 副作用很小，我们不用担心循环引用的问题，这样我们使得我们的程序更容易维护。
当 struct 内部持有一个引用类型：这个时候这个 struct 赋值的时候，他内部这个引用类型的属性并不会完全拷贝一份，而仅仅只是复制了指针，此时的 struct 并不是完全意义上的 `value type`。

## 写时复制
我们都知道值类型在 swift 往往具有写时复制的特性，但不是所有值类型都具有“写时复制”的特性，在 swift 中大多数值类型都具有这个特性，那是因为 Foundation 帮我们实现来这个功能。但为了实现“写时复制”这个功能我们会依赖内部的一个引用计数，维护这份引用计数并不是那么“轻量”，因为我们要保证这个引用计数的线程安全，不能避免锁的开销（Swift 已经有 Atomic 相关的提案了，不知道未来是不是可以通过这个特性来优化）。

copy on write 内部实现是用了一个 private 的 class 来存储这个值类型的变量，然后通过变量 get set 的方式将内部class 的属性暴露出去。在 set 方法中调用 `copy()` 来实现 copy on write。要注意的时候我们需要检查内部这个 class 的 storage 的引用是不是唯一的，因为如果是同一个引用，我们没必要在每次修改的时候都进行复制操作，那是一种资源的浪费。

## indirect

![img](/assets/img/struct-recursively.png)
我们在用 `struct` 的时候如果属性包含了自己，会遇到 `Value type 'A' cannot have a stored property that recursively contains it` 的错误。那是因为编译器对于值类型需要能够计算他内存布局的大小，这个大小是一个固定的有限的尺寸。假设我们可以包含自身，那就可能出现无限递归，编译器就不能确定大小了。

在枚举中我们可以用 `indirect` 修饰，但仅适用于枚举。`indirect` 可以用来告诉编译器将我们递归的成员作为一个引用（因为引用的大小是确定的，在64位的系统上是 8 个字节）。

```swift
// 类似实现
final class Box<A> {
  var unbox: A
  init(_ value: A) {self.unbox = value }
}
```
## existential
一般来讲在 Swift 中我们不能把协议作为一个具体的类型，他们只能用来当作约束范型.

```swift
// 编译器会帮为协议生成一个 container：existential container
// 下面代码类似：let type: Any<SomeProtocol>
let type: SomeProtocol
```

## protocol 和 generic
```swift
func encode1(x: Encodable) {}
func encode2<x: Encodable>(x: E) {}
```
这两个函数看起都是传入了一个 `Encodable` 的参数。但它们不同但是对于 encode1 函数编译器会把参数放到一个 existential container 容器中，会带来一定开销。
而对于范型函数编译器会为参数生成一个特定的版本，性能和我们手动重载这个函数差不多。但缺点是会带来更长但编译时间和更大二进制程序。不过大多数情况下，我们可以忽略 existential contarner 带来但性能差异。

## 类型消除器(type erasure) 和 Opaque Return
这两者适合结合起来学习，相关的资料有很多，内容很多到时候可以另开一篇文章讲讲。
talks: 
- [Keep Calm and Type Erase On - Gwendolyn Weston](https://academy.realm.io/posts/tryswift-gwendolyn-weston-type-erasure/)
- [Protocols with Associated Types - Alexis Gallagher](https://www.youtube.com/watch?v=XWoNjiSPqI8)
articles:
- [Understanding Opaque Return Types in Swift](https://www.alfianlosari.com/posts/understanding-opaque-return-type/)

## 序列
一个序列(Sequence)代表一组相同类型的值，满足 Sequence 协议的类型我们可以对其进行 for 循环等遍历操作。
```swift
public protocol Sequence {
    /// A type representing the sequence's elements.
    associatedtype Element where Self.Element == Self.Iterator.Element
    /// A type that provides the sequence's iteration interface and
    /// encapsulates its iteration state.
    associatedtype Iterator : IteratorProtocol
    /// Returns an iterator over the elements of this sequence.
    func makeIterator() -> Self.Iterator
    // ...
}
```

## 编码和解码

我们都知道标准库的很多基本类型都已经实现了 `Codable` ( Codable 是 Decodable 和 Encodebale 的 组合)。如果要让一个类或者结构体实现 `Codable` 我们只要保证他们内部的数据都分别实现 `Codable` 即可。这部分工作是编译器帮我实现的，他和标准库的默认实现不一样。假设我们要把这部分指责迁移到标准库中，这就需要 Swift 具有强大的反射能力（类似 OC 的一些运行时的能力，但这样做往往会产生一些而外的开销）。另外 Swift 很多其他语言特效都是这样做的，比如自动实现的 `Equatable` 和 `Hashable` 这也是编译 Swift 比 OC 慢很多的主要原因。

> Tips: Swift 目前不能在类型定义之外自动合成实现 `Encodable`, 也就是说不能通过 extension 实现 Encodable。（要让 Swift 自动合成协议实现代码需要在将协议添加在类型定义的地方或者加载同文件下的 extension 中）

在这里苹果工程师的建议是：*当你想要扩展别人的类型使其满足 `Encodable` 或者 `Decodable` 时，我们应该靠考虑用一个结构体封装起来，除非我们确定这个类型以后自己不会遵循这些协议。*$$