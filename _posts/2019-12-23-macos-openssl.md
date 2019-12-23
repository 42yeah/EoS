---
layout: post
title: Solving -lssl Not Found Problem Under macOS Catalina
featured: /assets/james-lee-tn85IH-sbhw-unsplash.jpg
---

Catalina sucks. macOS sucks. It updates and updates and makes things obselete almost everyday. Yet we love it and we use it. So here we are, trying to figure out the mysterious disappearance of `-lssl`!

## Before Catalina

If you are still using Mojave or something, the solution is straightforward. Just

```sh
xcode-select --install
```

And you are done!

Of course, you need to have `Xcode` installed first. Or do you? Just joking! Haha! `xcode-select` doesn't require `xcode` installed. macOS is __that__ fun.

## After Catalina

With this great update, the `openssl` library as we know seems to be gone forever from the default Xcode toolkit. But that's OK! We will just get it from `brew`. You must've installed that, right? Otherwise, you can get it from [here](https://brew.sh/).

After that, you could just 

```sh
brew install openssl
```

And after that's done,

```sh
export LIBRARY_PATH=$LIBRARY_PATH:/usr/local/Cellar/openssl/1.0.2t/lib
```

The directory above might vary. I am just pointing it to the newest version in the time of the writing. But after this, you could continue to build your project! Have fun!

Of course, this is a temporary solution. There might be a more permanent solution such as creating a symbolic link & add the `export` statement into your `.bashrc` or `.zshrc`, however they might not be very elegant. But at least the library now works as we know it, right?
