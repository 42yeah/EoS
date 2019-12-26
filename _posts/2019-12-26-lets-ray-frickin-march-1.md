---
layout: post
title: Let's Ray Frickin' March!
featured: /assets/Mist-by-Ohno-OctaHydra-Flopine.png
---

Title done by [flopine](https://www.shadertoy.com/user/flopine), she's awesome!

> Warning: This post might be shittily written. If you just want the code, dive right to the [Code!](#code) section. Sorry for the inexplicable explanation. Sometimes I just fail to explain stuffs. You might be able to understand the code more easily than the shitty stuff I write.

I accidentally (did I?) bumped into Shader Showdown and now I really crave for some awesome shader coding. However I know nothing about it & I just started to understand stuffs recently. So why don't I begin writing a Ray Marching shader on my own? Let's do this! It will be so simple (yet so ugly), you will doubt what's the point of learning this.

Well, I don't really care about ya, mysterious reader: I care about myself. Let's do this! I might update this for a few days, or this would be the last chapter. It really depends on my interest. Solely.

## Let's get started!

Before we start, we can use quite a few softwares to enhance our coding experience: you can either write one from the ground up (I used to did that), it's just a rect rendering app anyway. Or, you could use [bonzomatic](https://github.com/Gargaj/Bonzomatic). Or, you could use the [ShaderToy VSCode Extension](https://github.com/stevensona/shader-toy). All works!

And here's how we are going to start. First, we are gonna write some __really__ basic shaders:

```glsl
void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;    
    gl_FragColor = vec4(uv, 0.0, 1.0);
}
```

![Result](/assets/shaders/1.png)

This si the shader that just works. It's the most basic shader, and as we could see, the bottom left is black: that's because the red, green, blue components there are all zero. The top right is yellow: and yellow consists of full red and green. So as we could see, red increases as x increases; and green increases as y increases. Not a big deal!

## And then we start marching!

Ray marching, as its name suggests, consists of rays marching. We could imagine this as putting a glass pane in front of us, and stand in front of it for a short distance. And then paint every glass tile as the color you could see through the tile.

![Just like this.](/assets/shaders/2.png)

To achieve this we will need an __eye__, or as we call in ray marching, a __ray origin__. It's usually been abbreviated as _ro_. As we are going to simply things, let's assume, as the OpenGL tradition does, our eye starts at the negative of z, and is looking towards positive z:

```glsl
vec3 ro = vec3(0.0, 0.0, -2.0); // Ray Origin
vec3 rd = vec3(0.0, 0.0, 1.0); // Ray Direction
```

As fragment shader was run by every pixel, we need to shoot corresponding rays, otherwise according to the code above, all pixels will be shooting to the same direction. __Lucky for us__, as our ray direction is perpendicular to the XoY face, our rays could be just shooting just like the UV coordinate. There should be a bit of tweaking, though: the center of our image should be (0, 0).

```glsl
vec2 c = 2.0 * (uv - vec2(0.5, 0.5));
```

In this way, we mapped the UV from [(0, 0), (1, 1)] to [(-1, -1), (1, 1)]. So that's nice! Now what we should do next, is to define the __real__ ray direction:

```glsl
vec3 rd = vec3(c, 1.0); // Ray Direction
```

As I said, this is the __oversimplified__ version. So there would be no diagonal ray thing whatsoever.

## Finally, SDF!

The SDF function (Signed Distance Field) is a brilliant function, in a way that it is not ray marching but somehow achieve what ray marching could be done. Here, I am just gonna rip from [Jamie Wong](http://jamie-wong.com/2016/07/15/ray-marching-signed-distance-functions/) (who in turn ripped from GPU Gems 2): 

![SDF explained](/assets/shaders/3.jpg)

SDF calculates the distance to the nearest obstacle, then march the ray in the corresponding distance (__note__, however, that the direction __does not__ change). If no obstacle was met (distance > 0), the SDF would be calculated again, this time marching further; if an obstacle was met (distance < 0), then the SDF function would halt, indicating that its time to shade the stuff. So let's get started with a simple function: sphere SDF!

```glsl
float sphere(vec3 p) {
    return length(p) - 1.0;
}
```

This is the simplified version of $$dist = \sqrt{x^2 + y^2 + z^2} - 1$$. Which in turn means the sphere was located at (0, 0, 0), with a radius of 1. Thus if a given p's sphere function returns __less than__ 0, it indicates that the p is currently __in the sphere__.

After all those and I still got no idea what I was talking about. Maybe I am that bad at explaining, sorry. But now we got to see the beauty of the SDF function, when all of those pieces are placed together!

## Code!

```glsl
float sphere(vec3 p) {
    return length(p) - 1.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 c = 2.0 * (uv - vec2(0.5, 0.5));
    vec3 ro = vec3(0.0, 0.0, -2.0);
    vec3 rd = vec3(c, 1.0);
    vec3 resultColor = vec3(uv, 0.0);
    float depth = 0.01;
    for (int i = 0; i < 200; i++) {
        float dist = sphere(ro + rd * depth);
        if (dist <= 0.0) {
            resultColor = vec3(1.0, 0.0, 0.0);
            break;
        }
        depth += dist;
    }
    gl_FragColor = vec4(resultColor, 1.0);
}
```

See? It wasn't that hard! Let's walk through it!

- First, we calculate UV
- Then we calculate the centerized UV
- Then we place the ray origin at (0, 0, -2)
- Then we calculate the ray direction; where should it shoot to?
- Then we define result color, giving it a good-looking (also debugging background) first
- Then we define this `depth` thing, which is the current distance of the ray march
- Then we enter the loop! We limited it to 200 times, so if the ray shoots outside of the sphere, it knows when to break. Also GLSL does __NOT__ allow infinite loops.
- We calculate the ray's distance to the sphere.
- If `dist < 0`, that means the ray is currently __in__ the sphere! We got a hit! Set the color to red.
- Otherwise there is no hit. It's ok though; we march the ray further, to see if there will be any hits.
- Finally, we set the output color to be the `resultColor` we got earlier.

If everything goes well, this should be the result:

![Result](/assets/shaders/4.png)

Man, that's way too ugly, isn't it? Don't worry! It will be better soon. Meanwhile, I know as much as you now. So that's good news (or not). We'll see!
