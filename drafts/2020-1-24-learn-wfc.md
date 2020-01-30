---
layout: post
title: Learning WFC
featured: /assets/wfc/wfc-rooms.png
---

According to the [Official documentation](https://github.com/mxgmn/WaveFunctionCollapse), this should be how WaveFunctionCollapse works: 

![Comic draft](/assets/wfc/draft.jpeg)

I know, I know, my draft is ugly. Also it really doesn't cover everything. Such as this NxN pattern thing: how does that relate to the output? Since in output every __point__ should be one pixel, right? However a pattern is more than one pixel. Yet the wave only record the states of the pattern.

Well, not to worry. Today I am going to take a thorough look at this mother and write this down at the mean time! Yeeeeeeeaaaaah!

## Let's get STARTED!

![The meta procedure (randomly*)](/assets/wfc/meta-procedure.jpg)

The thing I wanted to know most is the overlapping model. So according to ExUtumo, [this](https://github.com/heyx3/easywfc) should be a readable code repository. And according to its README, "EasyWFC/Generator" should be where the "actual meat lies" (not sarcasm). 

According to the `GeneratorWindow.xaml.cs`, the algorithm class is `Generator.State`. It's usage is:

```c#
state = new Generator.State(new Generator.Input(inputPixelGrid,
                                                new Vector2i(patternSizeX, patternSizeY),
                                                periodicInputX, periodicInputY,
                                                inputPatternRotations,
                                                inputPatternReflections),
                            new Vector2i(outputWidth, outputHeight),
                            Check_PeriodicOutputX.IsChecked.Value,
                            Check_PeriodicOutputY.IsChecked.Value,
                            HashSeed(seed));
var status = state.Iterate(ref failPoses);
```

So it is one input, one output, together with a few parameters, and seed. And using it would be using `Iterate`. Let's dive into it!

### Input

The very first thing would be input.

## Initialization

The `State` constructor does nothing particularly interesting; however it does invoke `Reset` at the end. `Reset is another method which accpets a output size and a seed. It resets the RNG, and reinitializes the output pixels. All output pixels' `ApplicableColorFrequencies` cleared & become all of `Input`'s `ColorFrequenceies`. So I guess that's fancy word for state. So that means at this time, the `Input` has already been processed; which means we should dive into `Input` next.
