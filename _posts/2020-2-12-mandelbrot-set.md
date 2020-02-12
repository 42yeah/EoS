---
layout: post
title: Mandelbrot Set
featured: /assets/mandelbrot/mandelbrot.png
---

Mandelbrot! The "Hello world" of GFX programming. I don't know why I am not learning it until now. And as the tutorials are a little bit scarce, this actually took more time than I thought, and it is also easier than I thought! Featured image by myself (yay!).

## Introduction

As we all know, Mandelbrot Set belongs to a category named "fractal"; and as Grant from 3Blue1Brown explained, [Fractals are typically not self similar](https://www.youtube.com/watch?v=gB9n2gHsHN4). A fractal is just a shape with non-integer dimension, and it won't be smooth, even if you zoom in __forever__.

## Julia Set

Now before everything, we should learn about Julia set. Why? You will know a little bit later.

![Julia set](/assets/mandelbrot/julia.png)

Now, this is not so worse than the Mandelbrot set, right? Bear with me, and we will first start with a teeny tiny concept. First, we get an empty canvas:

![Canvas](/assets/worley/canvas.jpg)

Then, for every pixel on this canvas, we normalize its position to (-1, 1), then __transfer its position to the complex plane__. After the transformation, (0.3, 0.3) should be 0.3 + 0.3i, and (0.1, -0.5) should be 0.1 - 0.5i. That isn't hard at all, right? Now that every pixel's position was transformed to its complex plane number, we will name this complex plane variable _z_, and perform the following, easy peasy maths to it:

$$z = z^2$$

lots of times. What does that mean? Well, let's pick a pixel position at random, say (0.1, 0.1). After the complex plane transformation, the pixel position should now be 0.1 + 0.1i. And after this simple computation, the new _z_ should be

$$
\begin{align}
0.1^2 + 0.1i^2 + 2\times 0.1 \times 0.1i\\
= 0.01 - 0.01 + 0.02i\\
= 0.02i
\end{align}
$$

Well, that's good and all, but let's perform another $$z = z ^ 2$$ on it, OK? And another $$z = z ^ 2$$? And another $$z = z ^ 2$$? And another $$z = z ^ 2$$? ......

After enough $$z = z ^ 2$$, we will find out numbers will have two different results:

1. Sprialing to infinity
2. Loop forever, or spiraling to zero... (aka __not__ spiraling to infinity)

Now let's color the points which spirals to infinity to black, & others to white. And as this is a per-pixel iteration process which requires a lot of computation, of course we are gonna use GLSL. As GLSL doesn't really support complex number computation, we can fake it with

$$
p = (p_x^2 - p_y^2, 2p_x p_y)
$$

Think about it. As we treat the y coordinate as complex number, that means $$y^2 = -1$$, right? OK, GLSL time!

```glsl
float julia(vec2 uv) {
    int i;
    for (i = 0; i < 100; i++) {
        uv = vec2(uv.x * uv.x - uv.y * uv.y,
                  2.0 * uv.x * uv.y);
        if (length(uv) > 100.0) {
            break; // Spiraling to infinity; stop
        }
    }
    return float(i) / 100.0;
}
```

Let's take a look at this function before appreciating the result. We can guess that in this huge amount of loop, the uv might be bouncing all around _(condition 1)_; and when uv is getting too far, we can treat it as approaching infinity already, and thus cutting the loop off. In other words, when the $$z$$ transformation was stuck in loop forever, then even after 100 loops the uv won't get very big _(condition 2)_. 

Thus if i is 100, that means it might be stuck in a loop; or it takes so much calculation it doesn't really get to infinity yet. In either case, we are just gonna pretend that it is, indeed, stuck. And if i is less than 100, that means after all these transformations, uv was shot to infinity. And the result?

![Circle](/assets/mandelbrot/circle.png)

Just a boring circle. This does not look like those awesome julia sets at all! Well, just wait for a moment and let's change this

$$z = z^2$$

to

$$z = z^2 + c$$

in which c is a random number. For the sake of fun, how about 0.25?

```glsl
float julia(vec2 uv) {
    int i;
    float c = 0.25;
    for (i = 0; i < 100; i++) {
        uv = vec2(uv.x * uv.x - uv.y * uv.y + c,
                  2.0 * uv.x * uv.y);
        if (length(uv) > 100.0) {
            break; // Spiraling to infinity; stop
        }
    }
    return float(i) / 100.0;
}
```

And here's what we get:

![Four-leave clover like stuff](/assets/mandelbrot/flowerly.png)

This looks like a four-leave clover. It is weird, right? A circle could be so seriously deformed by just adding a c after the x component. It is not just that, also; this thing could be zoomed in __forever__. Let's zoom!

![Zoom](/assets/mandelbrot/zoom.png)

As we can see, the patterns are self-similar here: after zooming in, we get more of these little things, and it could go on forever. That's what make fractals cool. It's like looking at a microscopic microscopic microscopic world. It also makes you think. What about adding a constant to y component? Say, 0.5?

```glsl
float julia(vec2 uv) {
    int i;
    vec2 c = vec2(0.25, 0.5);
    for (i = 0; i < 100; i++) {
        uv = vec2(uv.x * uv.x - uv.y * uv.y + c.x,
                  2.0 * uv.x * uv.y + c.y);
        if (length(uv) > 100.0) {
            break; // Spiraling to infinity; stop
        }
    }
    return float(i) / 100.0;
}
```

![Cool](/assets/mandelbrot/cool.png)

Woah there! Now this is a really cool shape! And this, my friend, is the Julia set! It is just 

$$
z = (z + c)^2
$$

Calculated over and over again for __every single pixel__. The featured image and others are just a little special effects I added on my own; go figure it out on your own! It's fun! By setting the c bigger, the whole set will begin to disintegrate. But things are at their most beautiful before their total destruction:

![0.5](/assets/mandelbrot/dotfive.png)

(c = (0.25, 0.6))

![Treey](/assets/mandelbrot/treey.png)

(c = (0.37, -0.35))

## Mandelbrot set

Mandelbrot is this guy who coined term "fractal". And one day he loved Julia set so much, he wanted to know every possible valid Julia set. So he updated the julia function:

```glsl
float julia(vec2 uv, vec2 c) {
    int i;
    for (i = 0; i < 100; i++) {
        uv = vec2(uv.x * uv.x - uv.y * uv.y + c.x,
                  2.0 * uv.x * uv.y + c.y);
        if (length(uv) > 100.0) {
            break;
        }
    }
    return float(i) / 100.0;
}
```

So now Mandelbrot could invoke the Julia function by using `julia(uv, vec2(0.1, 0.1))` to check out the shape, which is really convinient.

Then he thought _screw it_, why not just insert uv as c, and the original `uv` parameter to be `vec2(0.0, 0.0)`? In this way, we could know whether (0, 0) spirals out at __all__ possible Julia combinations. And so he did it:

```glsl
float f = julia(vec2(0.0, 0.0), uv);
```

And __BAM__! Mandelbrot Set!

![Mandelbrot](/assets/mandelbrot/mandelbrot.png)

White areas means the (0, 0) does __not__ spiral out when $$c = uv$$. So all positions within the white area are valid Julia sets! Yay! (And a little bit of positions outside the white area too, because not all Julia set's (0, 0) are white).

Mandelbrot set is beautiful, it could be zoomed in forever and does not have a single problem (theoretically; your GPU might vomit at all those floating points). It's like a kaleidoscope of infinity; deep down, you will find out that it is, indeed, self similar. There are a Mandelbrot set deep within itself. You just need to zoom in!

<iframe width="640" height="360" frameborder="0" src="https://www.shadertoy.com/embed/WtcSzl?gui=true&t=10&paused=true&muted=false" allowfullscreen></iframe>

## Conclusion

We saw Mandelbrot today, the beauty of maths. It's a graph plotted by numbers that doesn't even exist in real life. Of course there are other mathy stuffs which is the ugliness of maths, but I guess we are not gonna cover it today (\*cough\* calculation \*cough\*).

## References

1. [Mandelbrot Set: how it is generated, fractalmath](https://www.youtube.com/watch?v=8ma6cV6fw24)
2. [How Julia Set images are generated, fractalmath](https://www.youtube.com/watch?v=2AZYZ-L8m9Q)
3. [Fractal, PCG Wiki](http://pcg.wikidot.com/pcg-algorithm:fractal)
4. [Fractal, The Book of Shaders (unfinished)](https://thebookofshaders.com/14/)
5. [Fractal, Wikipedia](https://en.wikipedia.org/wiki/Fractal)
6. [Mandelbrot - Distance, Inigo Quilez](https://www.shadertoy.com/view/lsX3W4)
7. [Fractals are typically not self similar, 3Blue1Brown](https://www.youtube.com/watch?v=gB9n2gHsHN4)
