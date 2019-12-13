---
layout: post
title: Solving Interesting Numbers
featured: /assets/marvin-ronsdorf-sX9_SHIqH4w-unsplash.jpg
---

Numbers are not interesting. Yet, __someone__ think that it is interesting to put a definition on __everything__. Today, let's take a look at this slightly annoying _Interesting Number_ puzzle.

## The puzzle

Here comes the definition: numbers are considered interesting if and only if:

- It only consists of 0, 1, 2, and 3
- 0 must come before 1
- 2 must come before 3
- 0 must __not__ be the first digit

2013, for example, is considered interesting. Of course, when there are only four digits, there are other equally interesting numbers: 2301 and 2031.

And this raises us the question: given $$n$$ as the number of digits, please count the number of interesting numbers $$i$$. That means when $$n = 4$$, $$i = 3$$.

## CodePad!

Well, feel free to play around in this spoiler-free area:

{% include codepad.html %}

## Spoiler-free image

Also, before you accidentally peek into the answer, please take a look at this beautiful flamingo:

![Flamingo!](/assets/mathew-schwartz-hQTa-4sCanA-unsplash.jpg)

## And here comes the __REAL__ blog!

Alright. Now that you've tried (did ya?) and appreciated the flamingo (yeah you did), you must be eager to know the answer! Well me too! This puzzle is said to be easier if you know about [Dynamic Programming](https://en.wikipedia.org/wiki/Dynamic_programming) (aka DP). As Wikipedia said, it is both a mathematical optimization method and a computer programming method. It works by simplifying a complicated problem by breaking it down into simpler sub-problems in a recursive manner. Our puzzle could also be solved in this way.

## But how?


