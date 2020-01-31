---
layout: post
title: Perlin Noise
featured: /assets/perlin/clouds.png
---

In the world of shaders & procgen, Perlin Noise is very serious stuff. Its ability to generate nonsense, however continuous image has been really useful in texture synthesis & that kind of stuffs. This featured image is [_clouds_](https://www.shadertoy.com/view/XslGRr), made famous by [Inigo Quilez](http://www.iquilezles.org/), using only a noise texture.

## Introduction

![Just noise](/assets/perlin/noise.png)

Perlin Noise might not seem straightforward at the very start. I mean, what was that? It's just some continuous grayscale pixels. However, if we assign thresholds for the grayness, and think about it in this way: we color the very dark (grayness <= 0.3) as blue; we color the not-so-dark to not-so-bright to green; and we color the rest to white. And __BOOM!__ A (fake) terrain:

![Terrain](/assets/perlin/terrain.png)

And that's exactly one of the most important usage of perlin noise, heightmap! Take our dear Minecraft for example, uses Perlin Noise to generate its heightmap, and [Perlin Worm](http://libnoise.sourceforge.net/examples/worms/) to generate its caves (sorry I didn't know how that works yet). Other examples would be loads of texture synthesis related contents, such as 2D clouds, water, fire, <span style="color: red">!!magma!!</span>, that kind of stuffs. As human eye feels good looking at continuous content, Perlin Noise has been proven really useful.

## Play with it

Alright, JavaScript implementation time! Let's play with it for a little bit first. Note that this might not be really interesting, as it is only a grayscale image.

<canvas id="output" width="500" height="500" style="width: 250px; height: 250px"></canvas>
<script src="/assets/perlin/main.js" type="module"></script>

<div style="display: flex; align-items: center">
Zoom Level: <input type="range" min="1" max="10" step="0.01" value="3" id="zoom" class="slider" style="margin-left: 1em">&nbsp;<span id="zoomValue"></span>
</div>
<div style="display: flex; align-items: center">
Seed A1: <input type="range" min="1" max="10000" value="13.71313" id="seeda1" class="slider" style="margin-left: 1em" step="0.01">&nbsp;<span id="seeda1Value"></span>
</div>
<div style="display: flex; align-items: center">
Seed A2: <input type="range" min="1" max="10000" value="87.58582" id="seeda2" class="slider" style="margin-left: 1em" step="0.01">&nbsp;<span id="seeda2Value"></span>
</div>
<div style="display: flex; align-items: center">
Seed B1: <input type="range" min="1" max="10000" value="1.31423" id="seedb1" class="slider" style="margin-left: 1em" step="0.01">&nbsp;<span id="seedb1Value"></span>
</div>
<div style="display: flex; align-items: center">
Seed B2: <input type="range" min="1" max="10000" value="56.928" id="seedb2" class="slider" style="margin-left: 1em" step="0.01">&nbsp;<span id="seedb2Value"></span>
</div>
<div style="display: flex; align-items: center">
dX: <input type="range" min="-100" max="100" value="0" id="dx" class="slider" style="margin-left: 1em" step="0.01">&nbsp;<span id="dxValue"></span>
</div>
<div style="display: flex; align-items: center">
dY: <input type="range" min="-100" max="100" value="0" id="dy" class="slider" style="margin-left: 1em" step="0.01">&nbsp;<span id="dyValue"></span>
</div>

## Implementation

So, that's a lot to tweak with not much to play. Still, it's fun, right? I mean look at those sliders! I worked really hard for this!

Anyway, here's where the charm of the Perlin Noise lies: consistency. It does not look like white noise, which looks really ugly, and there's no rule at all. It does not look like blue / red noise either, nope. It is consistent, and it looks like a slide sliding to all directions. What's even better, is its infinity. It could stretch in all positive directions, forever. Just the thing we want for terrain! You know, we don't want it to be jagged, right? So let's implement it!

### White Noise

Before implementing Perlin Noise, we should know how to implement [white noise](https://en.wikipedia.org/wiki/White_noise). And how exactly are we going to do that, especially in environments lack of the element of randomness, such as fragment shader? [You could go learn about it here.](https://thebookofshaders.com/10/). In fact, that link also contains Perlin Noise, so you could just skip to there and done with it. I am however, gonna steal image from it (again):

![y = fract(sin(x)*1.0);](/assets/perlin/fractsin.png)

Here's how the magic happens. By taking the fraction of sin, we could get the (perhaps) most inconsistent plot ever. And here's how we are going to do it in JavaScript (to give you an idea):

```js
y = Math.abs(Math.sin(x) - Math.floor(Math.sin(x)));
```

Now that you know how to implement `fract` in JavaScript, you should understand how to implement `fract` in all languages. `fract` is easy anyways. I really should stop saying `fract`. Notice about the image above, there are this really big skip once and a while. Now, what we really want to do is __increase its frequency__ by multiplying the product of `Math.sin()`:

```glsl
y = fract(sin(x) * 1000000.0);
```

And we will notice as the number of zero increases, the whole graph becomes more and more chaotic, eventually you can't recognize it being the original function at all:

![White Noise?!](/assets/perlin/whitenoise.png)

And there you have it! 1D fake white noise. It's called random by someone, and hash by others. Hash, because the answer of the same input would always be the same. Random because... It's pretty random. Also by looking at the plot, it looks like a normal distribution. Which is nice!

### Dimensional upgrade

Now that 1D white noise is no longer a problem, it's time to upgrade it to 2D. 2D white noise is no harder than the 1D white noise at all. However now it takes a two-dimensional vector for its input, and spits out the fraction of the sine of the dot product of it and a random vector (which is the A1 & A2 above).

(Assuming uv is the two-dimensional input)

```glsl
y = fract(sin(dot(uv, vec2(13.51231, 78.5123))) * 1000000.0);
```

Now you might wonder: why should I get a 1D output with a 2D input? This sucks! I want a 2D output. And that's easy! We just need another random vector:

```glsl
xy = vec2(
    fract(sin(dot(uv, vec2(13.51231, 78.5123))) * 1000000.0),
    fract(sin(dot(uv, vec2(1.2151, 102.12456))) * 1000000.0)
);
```
And that's it. 2D white noise. If xy was the R channel and the G channel of the output, it'll look a little bit like this:

![2D Noise](/assets/perlin/noise.2d.jpg)

Ugh. Dizzy. But it works, right? Now that we have 2D white noise, it's time for the actual Perlin Noise!

### Perlin Noise

There are lots of ways to explain Perlin Noise, and my way to explain it is really not trying to explain that much. Here's a usual, ugly doodle about how it works:

![The procedure](/assets/perlin/procedure.jpg)

To achieve this, first we need to turn our sampling position into a normalized sampling position. That is, divide the sampling position by the image size. Now that it is in [(0, 0), (1, 1)], we multiply it by a _zoom_ factor, so it isn't too small nor too big: too small and it would be indistinguishable;  too big and it would just be yet another white noise map. Normally the _zoom_ factor should be 2 or 3 or something? Well, it is up to you, really. And finally, here's the code of the Perlin Noise:

```glsl
vec2 hash(vec2 i) {
    return vec2(
        fract(sin(dot(i, vec2(13.156, 98.123))) * 1000000.0),
        fract(sin(dot(i, vec2(3.1251, 123.124))) * 1000000.0)
    ) * 2.0 - 1.0; // Why * 2.0 - 1.0? Well, so that the range of hash() will become (-1.0, 1.0)
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    uv *= zoom; // Here's the zoom level

    vec2 u = floor(uv);
    vec2 f = fract(uv);
    vec2 s = smoothstep(0.0, 1.0, f);
    
    vec2 a = hash(u); // Sampling the white noise's four corners
    vec2 b = hash(u + vec2(1.0, 0.0));
    vec2 c = hash(u + vec2(0.0, 1.0));
    vec2 d = hash(u + vec2(1.0, 1.0));
    
    // Perlin noise: basically mixing those four corners back using dot and mix.
    // smoothstep is optinal: you could use any cubic curve you want, or if you don't want to use cubic curve, that's OK! It just won't look as natural.
    float r = mix(mix(dot(a, f), dot(b, f - vec2(1.0, 0.0)), s.x),
                  mix(dot(c, f - vec2(0.0, 1.0)), dot(d, f - vec2(1.0, 1.0)), s.x), s.y);
    r = r * 0.5 + 0.5; // As the output ranges from (-1, 1), we are making it go back to (0, 1), so the output won't get clamped & be way too dark.

    // Output to screen
    fragColor = vec4(r, r, r, 1.0);
}
```

As we can see, the sampling point's grayness is really dependant on the value of its four corners. By mixing the output color according to the four corner's contribution, it really is just making white noises on a regular interval, and then interpolate the rest, empty spaces. But that's perlin noise! And it really revolutionized computer graphics, creative coding, and that kind of things! Really cool isn't it?

## Conclusion

Well, our little journey of Perlin Noise ends here. You might have more to ask, and I will have a high chance of getting something wrong. If that's really the case, __please__ don't hesitate to tell me! Also I might be using exclamation mark __way__ too much. I really am not the brightest at maths, and I used to hate it a lot. But recently I find that it could be pretty interesting, right? Worlds generated out of maths! That really takes the burden off humans.

## References

1. [Actual Perlin Noise code in The Book of Shaders](https://thebookofshaders.com/edit.php#11/2d-gnoise.frag)
1. [Random \| The Book of Shaders](https://thebookofshaders.com/10/)
2. [Noise \| The Book of Shaders](https://thebookofshaders.com/11/) <- This chapter covers Perlin Noise!
3. [More Noise \| The Book of Shaders](https://thebookofshaders.com/12/). Yep, three in a row.
4. [My shitty implementation in ShaderToy](https://www.shadertoy.com/view/tt3XR4)
5. [Yet another shitty implementation, but with branching, and a little bit of animation](https://www.shadertoy.com/view/ttGGzt)
6. [Perlin Noise by Eevee](https://eev.ee/blog/2016/05/29/perlin-noise/)
7. [Minecraft](https://minecraft.net). It's awesome, buy it!
