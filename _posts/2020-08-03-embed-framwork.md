---
title: Not Embed/Embed & Sign/Embed Without Sign in Xcode
author: racechao
date: 2020-08-26
tag:
  - Xcode
---

在 Xcode11 后 Apple 改了 Framwork 集成配置选项，把 Framwork Embed 方式分成了 3 种：`Do Not Embed`,`Embed & Sign` 以及 `Embed Without Sign`
Xcode11 出来之前一直没留意这里的配置是什么意思，所以刚好是自己的知识盲区，其实稍微了解下就明白这些配置是什么意思了。直接说下我的理解吧。

1. 静态库不需要 Embed 是因为已经 link 好了
2. 动态库需要 Embed & Sign 是因为 link 发生在 runtime, 需要把库加载进来（需要用 Embedding 把 framework 打进 bundle 里）。
3. 系统的动态库不要 Emabed 是因为系统会 share 这些动态库， app 在 runtime 的时候直接 link 系统的就行了


另外发现 Carthage 打出来的库不用 Embed With Sign，所以去翻了下 Github [代码](https://github.com/Carthage/Carthage/blob/fc0166b4827736bac2c804fc928797f1a742c455/Source/carthage/CopyFrameworks.swift#L49)发现大概流程是在 Copy File 后会对 framwork 后对其 codesign。
顺别解决了以前在使用 Carthage 的时候对于为什么要配置 input Files 和 output Files 的困惑。
所以 Carthage 打出来的包不选 Embed & Sign 而是选 Not Embed（上面所诉的方式进行了 Copy 和 Sign 操作）
而这些签名后的 Framwork 就可以使用 Embed without sign 了。

另外群里小伙伴提到 “这个 input 和 output 貌似可以优化 build 时间，里面有个 copy resource 的过程，会从这个 files 里面搜有没有命中的 path”
关与 Carthage 为什么要使用`copy framworks` 而不止直接使用 Xcode 自带的功能比如`xcfilelist`，可以看写这 [issue](https://github.com/Carthage/Carthage/issues/2477)
我的理解这么做相当于加了一个中间层，Carthage 可以在过程中做很多优化比如下面提到的：
```
One advantage of the "Input Files"/"Output Files" mechanism built in to Xcode is that it will check timestamps of the input and output files and do nothing if the output file is already up-to-date. Ideally a tool that automatically sets the SCRIPT_INPUT_FILE_... and SCRIPT_OUTPUT_FILE_... environment variables could similarly check the timestamps and omit frameworks that are already up-to-date.
```

