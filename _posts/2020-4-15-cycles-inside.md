---
layout: post
title: Cycles Inside Yada Yada Yada, Building Could Produce Unreliable Results
featured: /assets/tine-ivanic-u2d0BPZFXOY-unsplash.jpg
---

I don't know if anyone else has this issue, but lately (2~3 months maybe?) when I was using Xcode, I am getting this error, and it has been very, very annoying. It has become such a PITA now, that I actually have to find a way to solve it! Can you believe it?

## Introduction

```
Cycle inside blah; . This usually can be resolved by moving the target's Headers build phase before Compile Sources.  
Cycle details:  
→ Target 'blah' has copy command from 'yada' to 'ugh'  
○ Target 'blah' has link command with output 'yada'
```

Well, everything was nice and comfy before I upgraded my Xcode to the latest version. Then it becomes to barf out errors like this! And almost __every__ single one of my applications using more than one library provides this warning when I am trying to build it. So, what's the solution?

## Solution

Well, I've found multiple ways to solve it. Let's see one by one.

### 1. Procastinate

Problems __might__ go away if you procastinate. However, this isn't that effective in computing. One way to procastinate this effect is by __saving a source file__. Yep, just hop to any one of the target's source file, and hit ⌘S to save it. The file doesn't need to be changed! Now you can build your project! The only problem is everytime when you are trying to run the project __unsaved__, the error will just pop out again.

### 2. Change Back to Legacy Build System

Go to Xcode, select File → Project Settings, and change the build system back to legacy build system:

![Legacy](/assets/legacy.png)

It will then work out. Unless you hate old stuffs!

### 3. Change The Build Phase

Finally, just go to project settings, and drag the _Compile Sources_ phase to the bottom:

![Drag](/assets/drag.gif)

... And you are good to go!

## Conclusion

There aren't that much conclusion here I guess? Just don't procastinate. You gotta face it one day.

## References

1. [Cycle inside ; building could produce unreliable results: Xcode 10 Error, Stack Overflow](https://stackoverflow.com/questions/50709330/cycle-inside-building-could-produce-unreliable-results-xcode-10-error)
2. [If your project has a target dependency cycle, Xcode Help](https://help.apple.com/xcode/mac/current/#/dev621201fb0)
