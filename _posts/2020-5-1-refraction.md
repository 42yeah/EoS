---
layout: post
title: Raymarching Refraction
featured: /assets/refr/featured.png
---

Happy International Except America Labor Day! I will save the rest for September :P. Well, back to the magnificent world of raymarching. We've come this far, and now it's time for us to do the surface refraction too, right? 

## Introduction

Refraction is like a twin sister to reflection (mostly), because ice, water, glass, and other stuffs I can't think of usually consists of both. GLSL has a `refract` function just like `reflect`, which is convenient, however it also accepts a parameter `eta`, which is used to controll the refractiness of a surface. You could look them up [here](http://hyperphysics.phy-astr.gsu.edu/hbase/Tables/indrf.html).

Dispite they might not be the same, refraction looks pretty much like [reflection](http://frame.42yeah.casa/2020/04/30/reflection.html). Here's what we are going to do in raymarching when we reach a refractive surface:

1. Raymarch as if nothing happened
2. Get the normal of the object you hit, and refract your ray direction based on that
3. Raymarch from that point on, however __ignore the refracted object__ (because if we don't ignore it, we will end up in the refracted object) and see what was hit. Add a percentage of that color to the final color computation.

As per usual, basic scene. Let's start with a cube, because that looks cooler to refract:

```glsl
```

```glsl
float sol(vec3 pos) {
    return pos.y;
}

float cube(vec3 pos, vec3 off) {
    pos -= off;
    vec3 d = abs(pos) - vec3(0.5);
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

vec2 map(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(pos);
    if (dist < closest) { closest = dist; id = 0.5; }
    
    dist = cube(pos, vec3(0.0, 0.48, 0.0));
    if (dist < closest) { closest = dist; id = 1.5; }
    
    return vec2(closest, id);
}

vec2 trace(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth);
        if (abs(info.x) <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec3 getSkyColor(vec3 rd) {
    vec3 sky = vec3(0.67, 0.79, 0.89);
    return mix(sky, vec3(1.0), clamp(rd.y * 5.0, 0.0, 1.0));
}

vec3 getTileColor(vec3 pos) {
    vec3 baseColor = vec3(0.9, 0.9, 0.9);
    vec3 u = mod(floor(pos * 2.0), 2.0);
    float att = 1.0 - clamp(abs(u.x - u.z), 0.0, 0.22);
    return vec3(baseColor * att);
}

vec3 getColor(float id, vec3 pos, vec3 rd) {
    if (id < -0.5) { return getSkyColor(rd); } // sky
    if (id < 1.0) { return getTileColor(pos); } // ground
    if (id < 2.0) { return vec3(1.0, 0.5, 0.0); }
    return vec3(1.0, 0.0, 0.0); // red for undefined
}

vec3 getNormal(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = map(pos).x;
    return normalize(vec3(
        mapped - map(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - map(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - map(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}

float getShadowIntensity(vec3 ro, vec3 rd) {
    float depth = 1e-3;
    float res = 1.0;
    for (int i = 0; i < 25; i++) {
        vec2 info = map(ro + rd * depth);
        res = min(res, 20.0 * info.x / depth);
        if (res < 1e-3) { break; }
        depth += info.x;
    }
    return res;
}

vec3 rand3d(float f) {
    return fract(sin(
        vec3(f) * vec3(12.456, 92.125, 102.215)
    ) * 41235.56) * 2.0 - 1.0;
}

float getAmbientOcclusion(vec3 pos, vec3 n) {
    float totalAO = 0.0;
    for (int i = 0; i < 25; i++) {
        vec3 ray = rand3d(float(i));
        ray = pow(ray, vec3(3.0));
        ray = sign(dot(ray, n)) * ray;
        vec2 info = map(pos + n * 1e-3 + 0.15 * ray);
        totalAO += clamp(info.x * 48.0, 0.0, 1.0);
    }
    totalAO /= 25.0;
    return clamp(totalAO, 0.0, 1.0);
}

void main() {
    vec2 xy = uv * 2.0 - 1.0;
    
    vec3 ro = vec3(3.0 * sin(time), 2.0, 3.0 * cos(time));
    vec3 center = vec3(0.0, 0.5, 0.0);

    vec3 front = normalize(center - ro);
    vec3 right = normalize(cross(front, vec3(0.0, 1.0, 0.0)));
    vec3 up = normalize(cross(right, front));
    
    mat4 lookAt = mat4(
        vec4(right, 0.0),
        vec4(up, 0.0),
        vec4(front, 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
    vec3 rd = normalize(vec3(lookAt * vec4(xy, 2.0, 1.0)));

    vec2 info = trace(ro, rd);
    vec3 pos = ro + rd * info.x;
    vec3 n = getNormal(pos);

    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));

    vec3 light = vec3(1.0);
    if (info.y > 0.0) {
        light = vec3(0.0);
        float ambient = 1.0;
        float diffuse = max(dot(n, lightDir), 0.0);
        float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
        float sol = 0.2 + 0.8 * clamp(-n.y, 0.0, 1.0);
        float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
        float shadow = getShadowIntensity(pos + n * 1e-3, lightDir);
        float ao = getAmbientOcclusion(pos, n);

        light += ambient * vec3(0.22, 0.22, 0.1) * shadow * ao;
        light += diffuse * vec3(0.97, 0.99, 0.99) * shadow;
        light += dome * vec3(0.19, 0.20, 0.26) * 2.0 * ao;
        light += sol * vec3(0.2, 0.22, 0.22) * ao;
        light += back * vec3(0.1, 0.11, 0.2) * ao;
    }

    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = pow(objColor, vec3(0.4545));

    color = vec4(objColor, 1.0);
}
```

{% include glsl.html %}

As we are going to make the ball glassy later, its color is moot. But let's keep it for the moment!

## Implementation

### One-time Refraction

Implementing refraction first requires a `map` function and a `getNormal` function that does __not__ include the ball itself (as it is a refractive material). Let's name it `mapRefr` and `getNormalRefr`, and a `traceRefr`, just like [shane's](https://www.shadertoy.com/view/MsScRD):

```glsl
vec2 mapRefr(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(pos);
    if (dist < closest) { closest = dist; id = 0.5; }

    // We removed the ball here (as it is refractive material)
    
    return vec2(closest, id);
}

vec3 getNormalRefr(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = mapRefr(pos).x;
    return normalize(vec3(
        mapped - mapRefr(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - mapRefr(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - mapRefr(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}

// traceRefr takes up less iterations, so to save cycles.
vec2 traceRefr(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 100; i++) {
        vec2 info = mapRefr(ro + rd * depth);
        if (abs(info.x) <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}
```

And now, going back to coloring. The material only refracts when it's the ball's material:

```glsl
vec2 info = trace(ro, rd);
vec3 pos = ro + rd * info.x;
vec3 n = getNormal(pos);

if (info.y > 1.0 && info.y < 2.0) {
    // Calculate refraction...
}
```

And how do we do the refraction? Here's how:

```glsl
vec3 refracted = refract(rd, n, 1.0 / 1.33); // water
info = traceRefr(pos, refracted);

pos = pos + refracted * info.x; // the new position
n = getNormalRefr(pos); // the new normal
```

The reason we are using `1.0 / 1.33` instead of just `1.33` is the final argument of `refract`, named $$\eta$$, is the ratio of source material to destination material. So as we are entering from air to water, we will be doing `air / water`, instead of `water / air`. Also note that as we are completely ignoring the original object this time, the slight nudge of `pos + n * 1e-3` is no longer needed.

After that, we can calculate lighting like normal. Keep in mind that refracted objects doesn't necessarily leave a shadow, so our shadow calculation should change from `map` to `mapRefr`. And combining everything above, here's what we see:

```glsl
float sol(vec3 pos) {
    return pos.y;
}

float cube(vec3 pos, vec3 off) {
    pos -= off;
    vec3 d = abs(pos) - vec3(0.5);
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

vec2 map(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(pos);
    if (dist < closest) { closest = dist; id = 0.5; }
    
    dist = cube(pos, vec3(0.0, 0.48, 0.0));
    if (dist < closest) { closest = dist; id = 1.5; }
    
    return vec2(closest, id);
}

vec2 mapRefr(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(pos);
    if (dist < closest) { closest = dist; id = 0.5; }
    
    return vec2(closest, id);
}

vec2 trace(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth);
        if (abs(info.x) <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec3 getSkyColor(vec3 rd) {
    vec3 sky = vec3(0.67, 0.79, 0.89);
    return mix(sky, vec3(1.0), clamp(rd.y * 5.0, 0.0, 1.0));
}

vec3 getTileColor(vec3 pos) {
    vec3 baseColor = vec3(0.9, 0.9, 0.9);
    vec3 u = mod(floor(pos * 2.0), 2.0);
    float att = 1.0 - clamp(abs(u.x - u.z), 0.0, 0.22);
    return vec3(baseColor * att);
}

vec3 getColor(float id, vec3 pos, vec3 rd) {
    if (id < -0.5) { return getSkyColor(rd); } // sky
    if (id < 1.0) { return getTileColor(pos); } // ground
    if (id < 2.0) { return vec3(1.0, 0.5, 0.0); }
    return vec3(1.0, 0.0, 0.0); // red for undefined
}

vec3 getNormal(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = map(pos).x;
    return normalize(vec3(
        mapped - map(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - map(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - map(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}

vec3 getNormalRefr(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = mapRefr(pos).x;
    return normalize(vec3(
        mapped - mapRefr(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - mapRefr(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - mapRefr(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}

vec2 traceRefr(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 100; i++) {
        vec2 info = mapRefr(ro + rd * depth);
        if (abs(info.x) <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

float getShadowIntensity(vec3 ro, vec3 rd) {
    float depth = 1e-3;
    float res = 1.0;
    for (int i = 0; i < 25; i++) {
        vec2 info = mapRefr(ro + rd * depth);
        res = min(res, 20.0 * info.x / depth);
        if (res < 1e-3) { break; }
        depth += info.x;
    }
    return res;
}

vec3 rand3d(float f) {
    return fract(sin(
        vec3(f) * vec3(12.456, 92.125, 102.215)
    ) * 41235.56) * 2.0 - 1.0;
}

float getAmbientOcclusion(vec3 pos, vec3 n) {
    float totalAO = 0.0;
    for (int i = 0; i < 25; i++) {
        vec3 ray = rand3d(float(i));
        ray = pow(ray, vec3(3.0));
        ray = sign(dot(ray, n)) * ray;
        vec2 info = map(pos + n * 1e-3 + 0.15 * ray);
        totalAO += clamp(info.x * 48.0, 0.0, 1.0);
    }
    totalAO /= 25.0;
    return clamp(totalAO, 0.0, 1.0);
}
```

```glsl
void main() {
    vec2 xy = uv * 2.0 - 1.0;
    
    vec3 ro = vec3(3.0 * sin(time), 2.0, 3.0 * cos(time));
    vec3 center = vec3(0.0, 0.5, 0.0);

    vec3 front = normalize(center - ro);
    vec3 right = normalize(cross(front, vec3(0.0, 1.0, 0.0)));
    vec3 up = normalize(cross(right, front));
    
    mat4 lookAt = mat4(
        vec4(right, 0.0),
        vec4(up, 0.0),
        vec4(front, 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
    vec3 rd = normalize(vec3(lookAt * vec4(xy, 2.0, 1.0)));

    vec2 info = trace(ro, rd);
    vec3 pos = ro + rd * info.x;
    vec3 n = getNormal(pos);

    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));

    vec3 light = vec3(1.0);
    if (info.y > 0.0 && info.y < 1.0) {
        light = vec3(0.0);
        float ambient = 1.0;
        float diffuse = max(dot(n, lightDir), 0.0);
        float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
        float sol = 0.2 + 0.8 * clamp(-n.y, 0.0, 1.0);
        float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
        float shadow = getShadowIntensity(pos + n * 1e-3, lightDir);
        float ao = getAmbientOcclusion(pos, n);

        light += ambient * vec3(0.22, 0.22, 0.1) * shadow * ao;
        light += diffuse * vec3(0.97, 0.99, 0.99) * shadow;
        light += dome * vec3(0.19, 0.20, 0.26) * 2.0 * ao;
        light += sol * vec3(0.2, 0.22, 0.22) * ao;
        light += back * vec3(0.1, 0.11, 0.2) * ao;
    } else if (info.y > 1.0 && info.y < 2.0) { // refraction
        vec3 refr = refract(rd, n, 1.0 / 1.33); // water
        info = traceRefr(pos, refr); // trace along the refracted place
        
        light = vec3(1.0);
        pos = pos + refr * info.x; // get traced refracted position
        n = getNormalRefr(pos); // get traced normal
        if (info.y > 0.0 && info.y < 1.0) { // calc lighting
            light = vec3(0.0);
            float ambient = 1.0;
            float diffuse = max(dot(n, lightDir), 0.0);
            float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
            float sol = 0.2 + 0.8 * clamp(-n.y, 0.0, 1.0);
            float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
            float shadow = getShadowIntensity(pos + n * 1e-3, lightDir);
            float ao = getAmbientOcclusion(pos, n);
    
            light += ambient * vec3(0.22, 0.22, 0.1) * shadow * ao;
            light += diffuse * vec3(0.97, 0.99, 0.99) * shadow;
            light += dome * vec3(0.19, 0.20, 0.26) * 2.0 * ao;
            light += sol * vec3(0.2, 0.22, 0.22) * ao;
            light += back * vec3(0.1, 0.11, 0.2) * ao;
        }
    }

    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = pow(objColor, vec3(0.4545));

    color = vec4(objColor, 1.0);
}
```

{% include glsl.html %}

This is a perfectly refractive water cube. It looks pretty nice! However, keep in mind we only refracted once here. A nice refraction would be refracting at both enter & exit:

![Refraction](/assets/refr/refr.jpg)

### Two-time Refraction

For a two-time refraction, we are going to add another function (just for precision's sake). I kinda figured this out on my own (eureka!), so the code might not be the best. First, we are going to rename our previous `refr` functions to `final`, as those ignoring-block-tracing functions should only be used when the ray exists the block:

```glsl
vec2 mapFinal(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(pos);
    if (dist < closest) { closest = dist; id = 0.5; }

    // We removed the ball here (as it is refractive material)
    
    return vec2(closest, id);
}

vec3 getNormalFinal(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = mapFinal(pos).x;
    return normalize(vec3(
        mapped - mapFinal(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - mapFinal(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - mapFinal(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}

// traceRefr takes up less iterations, so to save cycles.
vec2 traceFinal(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 100; i++) {
        vec2 info = mapFinal(ro + rd * depth);
        if (abs(info.x) <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}
```

So how do we trace the ray when it's inside the block? Well, here's the new `mapRefr`:

```glsl
vec2 mapRefr(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;

    float dist = -cube(pos, vec3(0.0, 0.48, 0.0));
    if (dist < closest) { closest = dist; id = 0.5; }

    return vec2(closest, id);
}
```

The `-cube` makes sure the ray advances inside the block, and stops when it hits a boundary. However, as we will start the marching on the boundary of the block, the marching will rapidly fail. That's why we need a more strict `near` distance, from `1e-3` to `1e-6`, so the refraction raymarching won't end immaturely. Also, we will give a slight nudge to depth, pretty much like when we are calculating shadow and ambient occlusion:

```glsl
vec2 traceRefr(vec3 ro, vec3 rd) {
    float depth = 0.001;
    float id = -1.0;
    for (int i = 0; i < 100; i++) {
        vec2 info = mapRefr(ro + rd * depth);
        if (abs(info.x) <= 1e-6) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}
```

And here's the `getNormalRefr`, which didn't change much:

```glsl
vec3 getNormalRefr(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = mapRefr(pos).x;
    return normalize(vec3(
        mapped - mapRefr(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - mapRefr(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - mapRefr(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}
```

Finally, when we are raymarching, after hitting into the cube, we will refract __twice__:

```glsl
// air -> water; refract for the first time
rd = refract(rd, n, 1.0 / 1.33);

// march inside block
info = traceRefr(pos - n * 1e-3, rd); 

// go to the refracted point inside the block
pos = pos + rd * info.x; 

// get the refracted normal (notice the normal points in the opposite
// direction of the real normal now, because we are marching inside the block)
n = getNormalRefr(pos); 

// nudge out a bit
pos = pos - n * 1e-5;

// water -> air; refract for the second time
rd = refract(rd, n, 1.0 / 1.33);

// finally trace again. This time we ignore the block, because of 
// precision issues and I am too lazy to solve it. If you can solve it, 
// you can save a function definition! Don't use my version.
info = traceFinal(pos, rd);
```

And finally, combining all stuffs together and here's what we get:

```glsl
```

```glsl
float sol(vec3 pos) {
    return pos.y;
}

float cube(vec3 pos, vec3 off) {
    pos -= off;
    vec3 d = abs(pos) - vec3(0.5);
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

vec2 map(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(pos);
    if (dist < closest) { closest = dist; id = 0.5; }
    
    dist = cube(pos, vec3(0.0, 0.48, 0.0));
    if (dist < closest) { closest = dist; id = 1.5; }
    
    return vec2(closest, id);
}

vec2 mapRefr(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;

    float dist = -cube(pos, vec3(0.0, 0.48, 0.0));
    if (dist < closest) { closest = dist; id = 0.5; }

    return vec2(closest, id);
}

vec2 trace(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth);
        if (abs(info.x) <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec3 getSkyColor(vec3 rd) {
    vec3 sky = vec3(0.67, 0.79, 0.89);
    return mix(sky, vec3(1.0), clamp(rd.y * 5.0, 0.0, 1.0));
}

vec3 getTileColor(vec3 pos) {
    vec3 baseColor = vec3(0.9, 0.9, 0.9);
    vec3 u = mod(floor(pos * 2.0), 2.0);
    float att = 1.0 - clamp(abs(u.x - u.z), 0.0, 0.22);
    return vec3(baseColor * att);
}

vec3 getColor(float id, vec3 pos, vec3 rd) {
    if (id < -0.5) { return getSkyColor(rd); } // sky
    if (id < 1.0) { return getTileColor(pos); } // ground
    if (id < 2.0) { return vec3(1.0, 0.5, 0.0); }
    return vec3(1.0, 0.0, 0.0); // red for undefined
}

vec3 getNormal(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = map(pos).x;
    return normalize(vec3(
        mapped - map(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - map(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - map(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}

vec3 getNormalRefr(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = mapRefr(pos).x;
    return normalize(vec3(
        mapped - mapRefr(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - mapRefr(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - mapRefr(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}

vec2 traceRefr(vec3 ro, vec3 rd) {
    float depth = 0.001;
    float id = -1.0;
    for (int i = 0; i < 100; i++) {
        vec2 info = mapRefr(ro + rd * depth);
        if (abs(info.x) <= 1e-6) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec2 mapFinal(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(pos);
    if (dist < closest) { closest = dist; id = 0.5; }

    // We removed the ball here (as it is refractive material)
    
    return vec2(closest, id);
}

float getShadowIntensity(vec3 ro, vec3 rd) {
    float depth = 1e-3;
    float res = 1.0;
    for (int i = 0; i < 25; i++) {
        vec2 info = mapFinal(ro + rd * depth);
        res = min(res, 20.0 * info.x / depth);
        if (res < 1e-3) { break; }
        depth += info.x;
    }
    return res;
}

vec3 rand3d(float f) {
    return fract(sin(
        vec3(f) * vec3(12.456, 92.125, 102.215)
    ) * 41235.56) * 2.0 - 1.0;
}

float getAmbientOcclusion(vec3 pos, vec3 n) {
    float totalAO = 0.0;
    for (int i = 0; i < 25; i++) {
        vec3 ray = rand3d(float(i));
        ray = pow(ray, vec3(3.0));
        ray = sign(dot(ray, n)) * ray;
        vec2 info = map(pos + n * 1e-3 + 0.15 * ray);
        totalAO += clamp(info.x * 48.0, 0.0, 1.0);
    }
    totalAO /= 25.0;
    return clamp(totalAO, 0.0, 1.0);
}

vec3 getNormalFinal(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = mapFinal(pos).x;
    return normalize(vec3(
        mapped - mapFinal(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - mapFinal(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - mapFinal(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}

// traceRefr takes up less iterations, so to save cycles.
vec2 traceFinal(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 100; i++) {
        vec2 info = mapFinal(ro + rd * depth);
        if (abs(info.x) <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

void main() {
    vec2 xy = uv * 2.0 - 1.0;

    vec3 ro = vec3(3.0 * sin(time), 2.0, 3.0 * cos(time));
    vec3 center = vec3(0.0, 0.5, 0.0);

    vec3 front = normalize(center - ro);
    vec3 right = normalize(cross(front, vec3(0.0, 1.0, 0.0)));
    vec3 up = normalize(cross(right, front));
    
    mat4 lookAt = mat4(
        vec4(right, 0.0),
        vec4(up, 0.0),
        vec4(front, 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
    vec3 rd = normalize(vec3(lookAt * vec4(xy, 2.0, 1.0)));

    vec2 info = trace(ro, rd);
    vec3 pos = ro + rd * info.x;
    vec3 n = getNormal(pos);

    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));

    vec3 light = vec3(1.0);
    if (info.y > 0.0 && info.y < 1.0) {
        light = vec3(0.0);
        float ambient = 1.0;
        float diffuse = max(dot(n, lightDir), 0.0);
        float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
        float sol = 0.2 + 0.8 * clamp(-n.y, 0.0, 1.0);
        float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
        float shadow = getShadowIntensity(pos + n * 1e-3, lightDir);
        float ao = getAmbientOcclusion(pos, n);

        light += ambient * vec3(0.22, 0.22, 0.1) * shadow * ao;
        light += diffuse * vec3(0.97, 0.99, 0.99) * shadow;
        light += dome * vec3(0.19, 0.20, 0.26) * 2.0 * ao;
        light += sol * vec3(0.2, 0.22, 0.22) * ao;
        light += back * vec3(0.1, 0.11, 0.2) * ao;
    } else if (info.y > 1.0 && info.y < 2.0) {
        rd = refract(rd, n, 1.0 / 1.33); // water
        info = traceRefr(pos - n * 1e-3, rd);

        pos = pos + rd * info.x;
        n = getNormalRefr(pos);
        pos = pos - n * 1e-5;

        rd = refract(rd, n, 1.0 / 1.33);
        info = traceFinal(pos, rd);
        pos = pos + rd * info.x;
        n = getNormalFinal(pos);

        light = vec3(1.0);
        if (info.y > 0.0 && info.y < 1.0) {
            light = vec3(0.0);
            float ambient = 1.0;
            float diffuse = max(dot(n, lightDir), 0.0);
            float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
            float sol = 0.2 + 0.8 * clamp(-n.y, 0.0, 1.0);
            float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
            float shadow = getShadowIntensity(pos + n * 1e-3, lightDir);
            float ao = getAmbientOcclusion(pos, n);

            light += ambient * vec3(0.22, 0.22, 0.1) * shadow * ao;
            light += diffuse * vec3(0.97, 0.99, 0.99) * shadow;
            light += dome * vec3(0.19, 0.20, 0.26) * 2.0 * ao;
            light += sol * vec3(0.2, 0.22, 0.22) * ao;
            light += back * vec3(0.1, 0.11, 0.2) * ao;
        }
    }

    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = pow(objColor, vec3(0.4545));

    color = vec4(objColor, 1.0);
}
```

{% include glsl.html %}

Here's the one-time refraction above, just to give you an comparison:

```glsl
float sol(vec3 pos) {
    return pos.y;
}

float cube(vec3 pos, vec3 off) {
    pos -= off;
    vec3 d = abs(pos) - vec3(0.5);
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

vec2 map(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(pos);
    if (dist < closest) { closest = dist; id = 0.5; }
    
    dist = cube(pos, vec3(0.0, 0.48, 0.0));
    if (dist < closest) { closest = dist; id = 1.5; }
    
    return vec2(closest, id);
}

vec2 mapRefr(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(pos);
    if (dist < closest) { closest = dist; id = 0.5; }
    
    return vec2(closest, id);
}

vec2 trace(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth);
        if (abs(info.x) <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec3 getSkyColor(vec3 rd) {
    vec3 sky = vec3(0.67, 0.79, 0.89);
    return mix(sky, vec3(1.0), clamp(rd.y * 5.0, 0.0, 1.0));
}

vec3 getTileColor(vec3 pos) {
    vec3 baseColor = vec3(0.9, 0.9, 0.9);
    vec3 u = mod(floor(pos * 2.0), 2.0);
    float att = 1.0 - clamp(abs(u.x - u.z), 0.0, 0.22);
    return vec3(baseColor * att);
}

vec3 getColor(float id, vec3 pos, vec3 rd) {
    if (id < -0.5) { return getSkyColor(rd); } // sky
    if (id < 1.0) { return getTileColor(pos); } // ground
    if (id < 2.0) { return vec3(1.0, 0.5, 0.0); }
    return vec3(1.0, 0.0, 0.0); // red for undefined
}

vec3 getNormal(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = map(pos).x;
    return normalize(vec3(
        mapped - map(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - map(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - map(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}

vec3 getNormalRefr(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = mapRefr(pos).x;
    return normalize(vec3(
        mapped - mapRefr(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - mapRefr(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - mapRefr(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}

vec2 traceRefr(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 100; i++) {
        vec2 info = mapRefr(ro + rd * depth);
        if (abs(info.x) <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

float getShadowIntensity(vec3 ro, vec3 rd) {
    float depth = 1e-3;
    float res = 1.0;
    for (int i = 0; i < 25; i++) {
        vec2 info = mapRefr(ro + rd * depth);
        res = min(res, 20.0 * info.x / depth);
        if (res < 1e-3) { break; }
        depth += info.x;
    }
    return res;
}

vec3 rand3d(float f) {
    return fract(sin(
        vec3(f) * vec3(12.456, 92.125, 102.215)
    ) * 41235.56) * 2.0 - 1.0;
}

float getAmbientOcclusion(vec3 pos, vec3 n) {
    float totalAO = 0.0;
    for (int i = 0; i < 25; i++) {
        vec3 ray = rand3d(float(i));
        ray = pow(ray, vec3(3.0));
        ray = sign(dot(ray, n)) * ray;
        vec2 info = map(pos + n * 1e-3 + 0.15 * ray);
        totalAO += clamp(info.x * 48.0, 0.0, 1.0);
    }
    totalAO /= 25.0;
    return clamp(totalAO, 0.0, 1.0);
}
```

```glsl
void main() {
    vec2 xy = uv * 2.0 - 1.0;
    
    vec3 ro = vec3(3.0 * sin(time), 2.0, 3.0 * cos(time));
    vec3 center = vec3(0.0, 0.5, 0.0);

    vec3 front = normalize(center - ro);
    vec3 right = normalize(cross(front, vec3(0.0, 1.0, 0.0)));
    vec3 up = normalize(cross(right, front));
    
    mat4 lookAt = mat4(
        vec4(right, 0.0),
        vec4(up, 0.0),
        vec4(front, 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
    vec3 rd = normalize(vec3(lookAt * vec4(xy, 2.0, 1.0)));

    vec2 info = trace(ro, rd);
    vec3 pos = ro + rd * info.x;
    vec3 n = getNormal(pos);

    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));

    vec3 light = vec3(1.0);
    if (info.y > 0.0 && info.y < 1.0) {
        light = vec3(0.0);
        float ambient = 1.0;
        float diffuse = max(dot(n, lightDir), 0.0);
        float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
        float sol = 0.2 + 0.8 * clamp(-n.y, 0.0, 1.0);
        float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
        float shadow = getShadowIntensity(pos + n * 1e-3, lightDir);
        float ao = getAmbientOcclusion(pos, n);

        light += ambient * vec3(0.22, 0.22, 0.1) * shadow * ao;
        light += diffuse * vec3(0.97, 0.99, 0.99) * shadow;
        light += dome * vec3(0.19, 0.20, 0.26) * 2.0 * ao;
        light += sol * vec3(0.2, 0.22, 0.22) * ao;
        light += back * vec3(0.1, 0.11, 0.2) * ao;
    } else if (info.y > 1.0 && info.y < 2.0) { // refraction
        vec3 refr = refract(rd, n, 1.0 / 1.33); // water
        info = traceRefr(pos, refr); // trace along the refracted place
        
        light = vec3(1.0);
        pos = pos + refr * info.x; // get traced refracted position
        n = getNormalRefr(pos); // get traced normal
        if (info.y > 0.0 && info.y < 1.0) { // calc lighting
            light = vec3(0.0);
            float ambient = 1.0;
            float diffuse = max(dot(n, lightDir), 0.0);
            float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
            float sol = 0.2 + 0.8 * clamp(-n.y, 0.0, 1.0);
            float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
            float shadow = getShadowIntensity(pos + n * 1e-3, lightDir);
            float ao = getAmbientOcclusion(pos, n);
    
            light += ambient * vec3(0.22, 0.22, 0.1) * shadow * ao;
            light += diffuse * vec3(0.97, 0.99, 0.99) * shadow;
            light += dome * vec3(0.19, 0.20, 0.26) * 2.0 * ao;
            light += sol * vec3(0.2, 0.22, 0.22) * ao;
            light += back * vec3(0.1, 0.11, 0.2) * ao;
        }
    }

    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = pow(objColor, vec3(0.4545));

    color = vec4(objColor, 1.0);
}
```

{% include glsl.html %}

After a second time refraction, we can see the cube's edges on the back. This does __not__ show up if there's only one refraction! However, a second time refraction adds complexity to code. If you are rendering stuffs such as encapsulated water whose second time refraction is guaranteed to hit an obstacle, one-time refraction is the way to go.

## Combining With Reflection

The stuff we were seeing just now is a perfectly refractive object, which might not exist in natural world. $$H_2O$$ not only consists of refraction, but also reflection. We can do this by mixing the refraction value and reflection value according to the [fresnel value](https://en.wikipedia.org/wiki/Fresnel_equations) (I have no idea what the wiki page says but I am just giving out references):

```glsl
float fresnel = clamp(1.0 + dot(rd, n), 0.0, 1.0);
```

And the final color could be a mixing of reflection & refraction:

```glsl
objColor = mix(refr, refl, pow(fresnel, 5.0) * 0.8 + 0.2);
```

Finally, after getting everything together, here's what we see (not a lot of differences huh):

```glsl
```

```glsl
float sol(vec3 pos) {
    return pos.y;
}

float cube(vec3 pos, vec3 off) {
    pos -= off;
    vec3 d = abs(pos) - vec3(0.5);
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

float ball(vec3 pos, vec3 off) {
    pos -= off;
    return length(pos) - 0.5;
}

vec2 map(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(pos);
    if (dist < closest) { closest = dist; id = 0.5; }
    
    dist = cube(pos, vec3(0.0, 0.48, 0.0));
    if (dist < closest) { closest = dist; id = 1.5; }

    dist = ball(pos, vec3(1.2, 0.48, 0.3));
    if (dist < closest) { closest = dist; id = 2.5; }
    
    return vec2(closest, id);
}

vec2 mapRefr(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;

    float dist = -cube(pos, vec3(0.0, 0.48, 0.0));
    if (dist < closest) { closest = dist; id = 0.5; }

    return vec2(closest, id);
}

vec2 trace(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth);
        if (abs(info.x) <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec3 getSkyColor(vec3 rd) {
    vec3 sky = vec3(0.67, 0.79, 0.89);
    return mix(sky, vec3(1.0), clamp(rd.y * 5.0, 0.0, 1.0));
}

vec3 getTileColor(vec3 pos) {
    vec3 baseColor = vec3(0.9, 0.9, 0.9);
    vec3 u = mod(floor(pos * 2.0), 2.0);
    float att = 1.0 - clamp(abs(u.x - u.z), 0.0, 0.22);
    return vec3(baseColor * att);
}

vec3 getColor(float id, vec3 pos, vec3 rd) {
    if (id < -0.5) { return getSkyColor(rd); } // sky
    if (id < 1.0) { return getTileColor(pos); } // ground
    if (id < 2.0) { return vec3(1.0, 0.5, 0.0); }
    if (id < 3.0) { return vec3(1.0, 0.5, 0.0); }
    return vec3(1.0, 0.0, 0.0); // red for undefined
}

vec3 getNormal(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = map(pos).x;
    return normalize(vec3(
        mapped - map(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - map(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - map(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}

vec3 getNormalRefr(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = mapRefr(pos).x;
    return normalize(vec3(
        mapped - mapRefr(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - mapRefr(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - mapRefr(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}

vec2 traceRefr(vec3 ro, vec3 rd) {
    float depth = 0.001;
    float id = -1.0;
    for (int i = 0; i < 100; i++) {
        vec2 info = mapRefr(ro + rd * depth);
        if (abs(info.x) <= 1e-6) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec2 mapFinal(vec3 pos) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(pos);
    if (dist < closest) { closest = dist; id = 0.5; }

    // We removed the ball here (as it is refractive material)

    dist = ball(pos, vec3(1.2, 0.48, 0.3));
    if (dist < closest) { closest = dist; id = 2.5; }
    
    return vec2(closest, id);
}

float getShadowIntensity(vec3 ro, vec3 rd) {
    float depth = 1e-3;
    float res = 1.0;
    for (int i = 0; i < 25; i++) {
        vec2 info = mapFinal(ro + rd * depth);
        res = min(res, 20.0 * info.x / depth);
        if (res < 1e-3) { break; }
        depth += info.x;
    }
    return res;
}

vec3 rand3d(float f) {
    return fract(sin(
        vec3(f) * vec3(12.456, 92.125, 102.215)
    ) * 41235.56) * 2.0 - 1.0;
}

float getAmbientOcclusion(vec3 pos, vec3 n) {
    float totalAO = 0.0;
    for (int i = 0; i < 25; i++) {
        vec3 ray = rand3d(float(i));
        ray = pow(ray, vec3(3.0));
        ray = sign(dot(ray, n)) * ray;
        vec2 info = map(pos + n * 1e-3 + 0.15 * ray);
        totalAO += clamp(info.x * 48.0, 0.0, 1.0);
    }
    totalAO /= 25.0;
    return clamp(totalAO, 0.0, 1.0);
}

vec3 getNormalFinal(vec3 pos) {
    const float epsilon = 0.001;
    float mapped = mapFinal(pos).x;
    return normalize(vec3(
        mapped - mapFinal(vec3(pos.x - epsilon, pos.yz)).x,
        mapped - mapFinal(vec3(pos.x, pos.y - epsilon, pos.z)).x,
        mapped - mapFinal(vec3(pos.x, pos.y, pos.z - epsilon)).x
    ));
}

// traceRefr takes up less iterations, so to save cycles.
vec2 traceFinal(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 100; i++) {
        vec2 info = mapFinal(ro + rd * depth);
        if (abs(info.x) <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec3 getLight(vec3 pos, vec3 n, vec3 lightDir) {
    vec3 light = vec3(0.0);
    float ambient = 1.0;
    float diffuse = max(dot(n, lightDir), 0.0);
    float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
    float sol = 0.2 + 0.8 * clamp(-n.y, 0.0, 1.0);
    float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
    float shadow = getShadowIntensity(pos + n * 1e-3, lightDir);
    float ao = getAmbientOcclusion(pos, n);

    light += ambient * vec3(0.22, 0.22, 0.1) * shadow * ao;
    light += diffuse * vec3(0.97, 0.99, 0.99) * shadow;
    light += dome * vec3(0.19, 0.20, 0.26) * 2.0 * ao;
    light += sol * vec3(0.2, 0.22, 0.22) * ao;
    light += back * vec3(0.1, 0.11, 0.2) * ao;
    return light;
}

void main() {
    vec2 xy = uv * 2.0 - 1.0;
    
    vec3 ro = vec3(3.0 * sin(time), 2.0, 3.0 * cos(time));
    vec3 center = vec3(0.0, 0.5, 0.0);

    vec3 front = normalize(center - ro);
    vec3 right = normalize(cross(front, vec3(0.0, 1.0, 0.0)));
    vec3 up = normalize(cross(right, front));
    
    mat4 lookAt = mat4(
        vec4(right, 0.0),
        vec4(up, 0.0),
        vec4(front, 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
    vec3 rd = normalize(vec3(lookAt * vec4(xy, 2.0, 1.0)));

    vec2 info = trace(ro, rd);
    vec3 pos = ro + rd * info.x;
    vec3 n = getNormal(pos);

    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));

    vec3 light = vec3(1.0);
    vec3 refl = vec3(0.0);
    
    vec3 objColor = vec3(0.0);
    if ((info.y > 0.0 && info.y < 1.0) || (info.y > 2.0)) {
        // ground
        objColor = getColor(info.y, pos, rd) * getLight(pos, n, lightDir);
        objColor = pow(objColor, vec3(0.4545));
    } else if (info.y > 1.0 && info.y < 2.0) {
        // block
        float fresnel = clamp(1.0 + dot(rd, n), 0.0, 1.0);
        vec3 reflected = reflect(rd, n);
        info = trace(pos + n * 1e-3, reflected);
        vec3 reflectedPos = pos + reflected * info.x;
        vec3 reflectedN = getNormal(reflectedPos);
        if (info.y > 0.0 && info.y < 1.0) {
            light = getLight(pos, n, lightDir);
        }
        refl = getColor(info.y, reflectedPos, reflected) * light;
        
        rd = refract(rd, n, 1.0 / 1.33); // water
        info = traceRefr(pos - n * 1e-3, rd);

        pos = pos + rd * info.x;
        n = getNormalRefr(pos);
        pos = pos - n * 1e-5;

        rd = refract(rd, n, 1.0 / 1.33);
        info = traceFinal(pos, rd);
        pos = pos + rd * info.x;
        n = getNormalFinal(pos);

        light = vec3(1.0);
        if (info.y > 0.0 && info.y < 1.0) {
            light = getLight(pos, n, lightDir);
        }
        
        vec3 refr = getColor(info.y, pos, rd) * light;
        objColor = mix(refr, refl, pow(fresnel, 5.0) * 0.8 + 0.2);
        objColor = pow(objColor, vec3(0.4545));
    } else {
        // sky
        objColor = getColor(info.y, pos, rd);
    }

    color = vec4(objColor, 1.0);
}
```

{% include glsl.html %}

Well, isn't this great?

## Conclusion

Refraction comes to sine when you are working with transparent materials, such as waater, glass, et cetera. And when the refracted ray is guaranteed to hit the ground, you can simply use one refraction; otherwise, you should use two. Well, that's it!

## References

1. [Abstract Water Tunnel, Shane, Shadertoy](https://www.shadertoy.com/view/MsScRD)
2. [Index of Refraction, HyperPhysics, Georgia State University](http://hyperphysics.phy-astr.gsu.edu/hbase/Tables/indrf.html)
3. [Fresnel Equations, Wikipedia](https://en.wikipedia.org/wiki/Fresnel_equations)
4. [Reflection, Frame of 42yeah (that's myself!)]([reflection](http://frame.42yeah.casa/2020/04/30/reflection.html))
5. [Empty Glass, mu6k, Shadertoy](https://www.shadertoy.com/view/4s2GDV)
