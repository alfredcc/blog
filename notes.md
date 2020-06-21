---
title: Notes
permalink: /notes/
layout: page
excerpt: Catatan Public agar enggak usah pusing-pusing mengingat.
comments: false
---

#### 如何获取最上层的 UIViewController/ 展示 alert

```swift
let vc = UIViewController()
let topVC = sequence(first: vc, next: { $0.presentedViewController }).reversed().first
```
- [stackoverflow](https://stackoverflow.com/questions/26554894/how-to-present-uialertcontroller-when-not-in-a-view-controller)
- [twitter](https://twitter.com/lihenghsu/status/1258390956304285697)

#### Read in a File
Reading a file into an array of lines is not possible through an easy built-in like in other languages but we can create something short that doesn't need a for using a combination of `split` and `map`:

```swift
let path = NSBundle.mainBundle().pathForResource("test", ofType: "txt")
let lines = try? String(contentsOfFile: path!).characters.split{$0 == "\n"}.map(String.init)
if let lines=lines {
    lines[0] // O! for a Muse of fire, that would ascend
    lines[1] // The brightest heaven of invention!
    lines[2] // A kingdom for a stage, princes to act
    lines[3] // And monarchs to behold the swelling scene.
}
```

---
