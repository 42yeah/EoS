---
layout: post
title: macOS Signing Problem
featured:
---

> not valid for use in process using Library Validation: mapped file has no cdhash, completely unsigned? Code has to be at least ad-hoc signed.

You develop using Xcode? Well, you've seen that, right?

Xcode, being part of macos, could be a PITA at times. But here comes the solution! (And it's relatively easy!)

Let's take OpenCV for an example:

```sh
cd /usr/local/lib # Just go to wherever the library you wanna sign
codesign -fs <identity> libopencv*
```

Replace \<identity> with whatever your developer name / username is. Mine is `apple`. Pretty straightforward, huh? If you really dunno, you can always observe what's on your top part of the code:

![Again, mine is apple.](/assets/dev.png)

Now you can use it to sign whatever you want, whichever you like. Let it be `GLFW` (newer version of GLFW seems to be signed, though. But that's not on Homebrew... Yet.) or `OpenCV`.

Have fun!
