---
layout: post
title: Raymarching Reflection
featured:
---

Reflection is quite important when you are projecting your ray onto shiny stuffs. Mirror, metal, loads of things that start with an m... You get the gist. So today, let's take a look at reflection! If you want to get pass my words and just go to shader, you can visit [shane's shader](https://www.shadertoy.com/view/4dt3zn). He writes perfect comments!

## Introduction

Reflection in raymarching is easy, if not a little bit expensive. If you've learned ray tracing before, it will make a lot of sense to you. It is roughly divided in 3 parts:

1. Raymarch as if nothing happened
2. Get the normal of the object you hit, and reflect your ray direction based on that
3. Raymarch from that point on, and see what was hit. Add a percentage of that color to the final color computation.

Well, that's it! Isn't this easy? Well, let's get started! First, a scene:

```glsl
```

```glsl
float sol(vec3 pos) {
    return pos.y;
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
    
    dist = ball(pos, vec3(0.0, 0.48, 0.0));
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
    
    vec3 ro = vec3(3.0 * sin(time), 1.0, 3.0 * cos(time));
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

## Implementation

For this scene, I only want the floor to have the reflective property only. Fortunately, as we keep track of object's id, that could be arranged! We can thus start the reflection function like this:

```glsl
vec3 getReflection(float id, vec3 pos, vec3 rd, vec3 n) {
    if (id < 0.0 || id > 1.0) {
        // not floor
        return vec3(0.0);
    }
    // floor. Calculate reflection!
    return vec3(0.0);
}
```

to calculate reflection, we need quite a few things:

1. The position to calculate reflection
2. The current ray direction
3. The surface normal

And first, we need to perform step __two__ of reflection calculation: reflecting rd.

```glsl
// floor. Perform reflection!
rd = reflect(rd, n);
```

Then, we need to trace it from [a smidge off sample point](https://frame.42yeah.casa/2020/04/26/soft-shadow.html) (because if you don't sample it from a smidge off the original sample point, it will just sample itself), along the new rd, and record what we've see. So, basically another raymarching. Also, I added lightDir for reflection lighting calculation.

```glsl
vec3 getReflection(float id, vec3 pos, vec3 rd, vec3 n, vec3 lightDir) {
    if (id < 0.0 || id > 1.0) {
        // not floor
        return vec3(0.0);
    }
    // floor. Perform reflection!
    rd = reflect(rd, n);
    float depth = 1e-3;
    id = -1.0; // reuse id
    for (int i = 0; i < 100; i++) {
        vec2 info = map(pos + rd * depth);
        if (abs(info.x) < 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    pos = pos + rd * depth; // reuse pos
    n = getNormal(pos); // reuse normal
    vec3 objColor = getColor(id, pos + rd * depth, rd); // get object color
    // lighting calculations...
```

After implementing the thing above, we can now add the reflection as part of the color to the final lighting calculations:

```glsl
vec3 reflection = getReflection(info.y, pos, rd, n, lightDir) * 0.35;
vec3 objColor = getColor(info.y, pos, rd) + reflection;
```

Which should look a little bit like this:

```glsl
float sol(vec3 pos) {
    return pos.y;
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
    
    dist = ball(pos, vec3(0.0, 0.48, 0.0));
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

vec3 getReflection(float id, vec3 pos, vec3 rd, vec3 n, vec3 lightDir);

void main() {
    vec2 xy = uv * 2.0 - 1.0;
    
    vec3 ro = vec3(3.0 * sin(time), 1.0, 3.0 * cos(time));
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
    vec3 refl = getReflection(info.y, pos, rd, n, lightDir) * 0.35;

    vec3 objColor = (getColor(info.y, pos, rd) + refl) * light;
    objColor = pow(objColor, vec3(0.4545));

    color = vec4(objColor, 1.0);
}
```

```glsl
vec3 getReflection(float id, vec3 pos, vec3 rd, vec3 n, vec3 lightDir) {
    if (id < 0.0 || id > 1.0) {
        // not floor
        return vec3(0.0);
    }
    // floor. Perform reflection!
    rd = reflect(rd, n);
    float depth = 1e-3;
    id = -1.0; // reuse id, because why not?
    for (int i = 0; i < 100; i++) {
        vec2 info = map(pos + rd * depth);
        if (abs(info.x) < 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    pos = pos + rd * depth;
    n = getNormal(pos);
    vec3 light = vec3(1.0);
    if (id > 0.0) {
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
    vec3 color = getColor(id, pos + rd * depth, rd) * light;
    return color;
}
```

{% include glsl.html %}

As you might've noticed, the floor now becomes extremely bright because it is completely reflective. It is not only reflecting the ball, but the sky too. If you like, you can tune the reflectiveness down a little bit. It's up to you! Well, for the sake of fun, let's apply the reflection to the ball, too:

```glsl
float sol(vec3 pos) {
    return pos.y;
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
    
    dist = ball(pos, vec3(0.0, 0.48, 0.0));
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
    if (id < 2.0) { return vec3(1.0, 0.5, 0.0) * 0.7; }
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

vec3 getReflection(float id, vec3 pos, vec3 rd, vec3 n, vec3 lightDir);

void main() {
    vec2 xy = uv * 2.0 - 1.0;
    
    vec3 ro = vec3(3.0 * sin(time), 1.0, 3.0 * cos(time));
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
    vec3 refl = getReflection(info.y, pos, rd, n, lightDir) * 0.35;

    vec3 objColor = (getColor(info.y, pos, rd) + refl) * light;
    objColor = pow(objColor, vec3(0.4545));

    color = vec4(objColor, 1.0);
}
```

```glsl
vec3 getReflection(float id, vec3 pos, vec3 rd, vec3 n, vec3 lightDir) {
    if (id < 1.0 || id > 2.0) {
        // not ball
        return vec3(0.0);
    }
    // floor. Perform reflection!
    rd = reflect(rd, n);
    float depth = 1e-3;
    id = -1.0; // reuse id, because why not?
    for (int i = 0; i < 100; i++) {
        vec2 info = map(pos + rd * depth);
        if (abs(info.x) < 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    pos = pos + rd * depth;
    n = getNormal(pos);
    vec3 light = vec3(1.0);
    if (id > 0.0) {
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
    vec3 color = getColor(id, pos + rd * depth, rd) * light;
    return color;
}
```

{% include glsl.html %}

The ball's desaturated a lot because of the sky! Well, that was fun.

### Reflection Factors

The reflectiveness of the surface does not have to be constant. iq for example uses the specular value as a factor in his [fruxis](https://www.shadertoy.com/view/ldl3zl). We can do this too:

```glsl
float sol(vec3 pos) {
    return pos.y;
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
    
    dist = ball(pos, vec3(0.0, 0.48, 0.0));
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
        vec2 info = map(pos + n * 1e-3 + 0.1 * ray);
        totalAO += clamp(info.x * 48.0, 0.0, 1.0);
    }
    totalAO /= 25.0;
    return clamp(totalAO, 0.0, 1.0);
}

vec3 getReflection(float id, vec3 pos, vec3 rd, vec3 n, vec3 lightDir) {
    if (id < 0.0 || id > 1.0) {
        // not floor
        return vec3(0.0);
    }
    // floor. Perform reflection!
    rd = reflect(rd, n);
    float depth = 1e-3;
    id = -1.0; // reuse id, because why not?
    for (int i = 0; i < 25; i++) {
        vec2 info = map(pos + rd * depth);
        if (abs(info.x) < 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    pos = pos + rd * depth;
    n = getNormal(pos);
    vec3 light = vec3(1.0);
    if (id > 0.0) {
        light = vec3(0.0);
        float ambient = 1.0;
        float diffuse = max(dot(n, lightDir), 0.0);
        float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
        float sol = 0.2 + 0.8 * clamp(-n.y, 0.0, 1.0);
        float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
        float ao = getAmbientOcclusion(pos, n);

        light += ambient * vec3(0.22, 0.22, 0.1) * ao;
        light += diffuse * vec3(0.97, 0.99, 0.99);
        light += dome * vec3(0.19, 0.20, 0.26) * 2.0 * ao;
        light += sol * vec3(0.2, 0.22, 0.22) * ao;
        light += back * vec3(0.1, 0.11, 0.2) * ao;
    }
    vec3 color = getColor(id, pos + rd * depth, rd) * light;
    return color;
}
```

```glsl
void main() {
    vec2 xy = uv * 2.0 - 1.0;
    vec3 ro = vec3(3.0 * sin(time), 1.0, 3.0 * cos(time));
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
    vec3 refl = vec3(0.0);

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
        float specular = clamp(pow(max(dot(rd, reflect(lightDir, n)), 0.0), 32.0), 0.0, 1.0);

        light += ambient * vec3(0.22, 0.22, 0.1) * shadow * ao;
        light += diffuse * vec3(0.97, 0.99, 0.99) * shadow;
        light += dome * vec3(0.19, 0.20, 0.26) * 2.0 * ao;
        light += sol * vec3(0.2, 0.22, 0.22) * ao;
        light += back * vec3(0.1, 0.11, 0.2) * ao;
        light += specular * vec3(1.0, 1.0, 1.0) * ao;
        
        refl = getReflection(info.y, pos, rd, n, lightDir) * (0.12 + specular);
    }

    vec3 objColor = (getColor(info.y, pos, rd) + refl) * light;
    objColor = pow(objColor, vec3(0.4545));

    color = vec4(objColor, 1.0);
}
```

{% include glsl.html %}

## Conclusion

Ah, this concludes my exploration in raymarching today. Reflection is expensive, and when it comes with shadow, ambient occlusion, and complex normals, it is so expensive that it could blow up old GPUs (I guess). So use it at your own risk. On the other hand, reflection is useful for reflective materials (duh), or use it together with glass/water refraction (I might write about refraction later).

## References

1. [Raymarched reflections, Shane, Shadertoy](https://www.shadertoy.com/view/4dt3zn)
2. [Fruxis, iq, Shadertoy](https://www.shadertoy.com/view/ldl3zl)
