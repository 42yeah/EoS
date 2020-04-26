---
layout: post
title: Soft Shadow in Raymarching
featured: /assets/ss/featured.png
---

Shadow. The stuff that adds a great deal of realism to the scene. Thanks to the great people in Shadertoy's Discord server, I am finally able to understand how soft shadow works! So I am writing this down today.

## Introduction

Well, let's implement a basic scene first:

```glsl
```

```glsl
vec3 sunDir = normalize(vec3(0.0, 1.0, 1.0));

float ball(vec3 p, vec3 off) {
    p -= off;
    return length(p) - 0.5;
}

float sol(vec3 p) {
    return p.y;
}

vec2 map(vec3 p) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(p);
    if (dist < closest) { closest = dist; id = 0.5; }

    dist = ball(p, vec3(0.0, 0.5, 0.0));
    if (dist < closest) { closest = dist; id = 1.5; }
    
    return vec2(closest, id);
}

vec2 intersect(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth);
        if (info.x <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec3 getColor(float id, vec3 p, vec3 rd) {
    if (id < -0.5) {
        vec3 sky = vec3(0.6, 0.8, 0.9) * 0.9;
        sky += rd.y * vec3(0.3, 0.3, 1.1) * 2.5;
        return vec3(sky);
    }
    if (id < 1.0) {
        vec3 floorColor = vec3(1.5, 1.5, 1.5);
        p = p * 2.0;
        vec3 f = fract(p);
        vec3 u = mod(floor(p), 2.0);
        float d = 0.6 + clamp(abs(u.x - u.z), 0.0, 1.0);
        return vec3(d * floorColor);
    }
    if (id < 2.0) { return vec3(1.0, 0.6, 0.0); }
    return vec3(1.0, 0.0, 0.0);
}

vec3 getNormal(vec3 p) {
    const float epsilon = 0.001;
    return normalize(vec3(
        map(p).x - map(vec3(p.x - epsilon, p.yz)).x,
        map(p).x - map(vec3(p.x, p.y - epsilon, p.z)).x,
        map(p).x - map(vec3(p.xy, p.z - epsilon)).x
    ));
}

void main() {
    vec2 xy = uv * 2.0 - 1.0;
    vec3 ro = vec3(3.0 * sin(time), 1.0, 3.0 * cos(time));
    vec3 center = vec3(0.0, 1.0, 0.0);
    
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
    vec2 info = intersect(ro, rd);
    vec3 pos = ro + rd * info.x;
    vec3 n = getNormal(pos);
    
    vec3 light = vec3(0.0);
    float ambient = 1.0;
    float diffuse = max(dot(n, sunDir), 0.0);
    float specular = clamp(pow(max(dot(-normalize(reflect(-sunDir, n)), rd), 0.0), 32.0), 0.0, 1.0);
    float dome = 0.2 + 0.8 * clamp(rd.y, 0.0, 1.0);
    float back = max(dot(n, vec3(sunDir.x, 0.0, sunDir.z)), 0.0);
    float sol = 0.2 + 0.8 * clamp(-rd.y, 0.0, 1.0);
    
    light += ambient * vec3(0.21, 0.2, 0.2);
    light += diffuse * vec3(0.5, 0.55, 0.5);
    light += specular * vec3(0.8, 0.8, 0.8);
    light += dome * vec3(1.2, 1.11, 1.3);
    light += back * vec3(0.3, 0.3, 0.34);
    light += sol * vec3(0.1, 0.1, 0.2);

    if (info.y < -0.5) { light = vec3(1.0); }
    
    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = pow(objColor, vec3(0.4545));
    
    color = vec4(objColor, 1.0);
}
```
{% include glsl.html %}

For now, this is just a few lights. But it wouldn't be global illumination without some shadow! So let's take a look at the basic concept of said shadow.

## Implementation

The concept of shadow in raymarching itself is fairly simple, also "fairly cheap" (by iq). It's quite easy and intuitive to implement a shadow yourself, and here's how you are going to think about it:

![Hard shadow](/assets/ss/hard.shadow.jpg)

So, it's yet another raymarch. But instead of starting from the camera, it starts from the floor, and marches towards the light source. If the procedure was blocked by something, then it's occluded from light, and thus it's in shadow:

```glsl
vec3 sunDir = normalize(vec3(0.0, 1.0, 1.0));

float ball(vec3 p, vec3 off) {
    p -= off;
    return length(p) - 0.5;
}

float sol(vec3 p) {
    return p.y;
}

vec2 map(vec3 p) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(p);
    if (dist < closest) { closest = dist; id = 0.5; }

    dist = ball(p, vec3(0.0, 0.5, 0.0));
    if (dist < closest) { closest = dist; id = 1.5; }
    
    return vec2(closest, id);
}

vec2 intersect(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth);
        if (info.x <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec3 getColor(float id, vec3 p, vec3 rd) {
    if (id < -0.5) {
        vec3 sky = vec3(0.6, 0.8, 0.9) * 0.9;
        sky += rd.y * vec3(0.3, 0.3, 1.1) * 2.5;
        return vec3(sky);
    }
    if (id < 1.0) {
        vec3 floorColor = vec3(1.5, 1.5, 1.5);
        p = p * 2.0;
        vec3 f = fract(p);
        vec3 u = mod(floor(p), 2.0);
        float d = 0.6 + clamp(abs(u.x - u.z), 0.0, 1.0);
        return vec3(d * floorColor);
    }
    if (id < 2.0) { return vec3(1.0, 0.6, 0.0); }
    return vec3(1.0, 0.0, 0.0);
}

vec3 getNormal(vec3 p) {
    const float epsilon = 0.001;
    return normalize(vec3(
        map(p).x - map(vec3(p.x - epsilon, p.yz)).x,
        map(p).x - map(vec3(p.x, p.y - epsilon, p.z)).x,
        map(p).x - map(vec3(p.xy, p.z - epsilon)).x
    ));
}

float getShadowIntensity(vec3 p);

void main() {
    vec2 xy = uv * 2.0 - 1.0;
    vec3 ro = vec3(3.0 * sin(time), 1.0, 3.0 * cos(time));
    vec3 center = vec3(0.0, 1.0, 0.0);
    
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
    vec2 info = intersect(ro, rd);
    vec3 pos = ro + rd * info.x;
    vec3 n = getNormal(pos);
    
    vec3 light = vec3(0.0);
    float ambient = 1.0;
    float diffuse = max(dot(n, sunDir), 0.0);
    float specular = clamp(pow(max(dot(-normalize(reflect(-sunDir, n)), rd), 0.0), 32.0), 0.0, 1.0);
    float dome = 0.2 + 0.8 * clamp(rd.y, 0.0, 1.0);
    float back = max(dot(n, vec3(sunDir.x, 0.0, sunDir.z)), 0.0);
    float sol = 0.2 + 0.8 * clamp(-rd.y, 0.0, 1.0);
    float shadow = getShadowIntensity(pos + n * 0.001);
    
    light += ambient * vec3(0.21, 0.2, 0.2);
    light += diffuse * vec3(0.5, 0.55, 0.5) * shadow;
    light += specular * vec3(0.8, 0.8, 0.8);
    light += dome * vec3(1.2, 1.11, 1.3) * shadow;
    light += back * vec3(0.3, 0.3, 0.34);
    light += sol * vec3(0.1, 0.1, 0.2);

    if (info.y < -0.5) { light = vec3(1.0); }
    
    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = pow(objColor, vec3(0.4545));
    
    color = vec4(objColor, 1.0);
}
```

```glsl
float getShadowIntensity(vec3 p) {
    float depth = 0.001;
    for (int i = 0; i < 25; i++) {
        // If you wonder why we are using a vec2 here,
        // the x component is shortest distance, and the y component is id.
        // The y component was used for texturing, and is useless here. So we simply ignore it.
        vec2 info = map(p + depth * sunDir);
        if (info.x <= 0.0001) {
            return 0.0;
        }
        depth += info.x;
    }
    return 1.0;
}
```
{% include glsl.html %}

Well, that's pretty cool.  The problem is also quite obvious: the shadow is __hard__. It is so hard that artifacts are quite obvious. So are there any way to soften it? Because we don't see a lot of hard shadows in our life! And turns out there is.

### Soft shadow

The hard shadow above are the places we are certain it would be occluded by an object. So wouldn't it be nice if we not only occlude those places, but also occlude those places quite close to the obstacle?

```glsl
vec3 sunDir = normalize(vec3(0.0, 1.0, 1.0));

float ball(vec3 p, vec3 off) {
    p -= off;
    return length(p) - 0.5;
}

float sol(vec3 p) {
    return p.y;
}

vec2 map(vec3 p) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(p);
    if (dist < closest) { closest = dist; id = 0.5; }

    dist = ball(p, vec3(0.0, 0.5, 0.0));
    if (dist < closest) { closest = dist; id = 1.5; }
    
    return vec2(closest, id);
}

vec2 intersect(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth);
        if (info.x <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec3 getColor(float id, vec3 p, vec3 rd) {
    if (id < -0.5) {
        vec3 sky = vec3(0.6, 0.8, 0.9) * 0.9;
        sky += rd.y * vec3(0.3, 0.3, 1.1) * 2.5;
        return vec3(sky);
    }
    if (id < 1.0) {
        vec3 floorColor = vec3(1.5, 1.5, 1.5);
        p = p * 2.0;
        vec3 f = fract(p);
        vec3 u = mod(floor(p), 2.0);
        float d = 0.6 + clamp(abs(u.x - u.z), 0.0, 1.0);
        return vec3(d * floorColor);
    }
    if (id < 2.0) { return vec3(1.0, 0.6, 0.0); }
    return vec3(1.0, 0.0, 0.0);
}

vec3 getNormal(vec3 p) {
    const float epsilon = 0.001;
    return normalize(vec3(
        map(p).x - map(vec3(p.x - epsilon, p.yz)).x,
        map(p).x - map(vec3(p.x, p.y - epsilon, p.z)).x,
        map(p).x - map(vec3(p.xy, p.z - epsilon)).x
    ));
}

float getShadowIntensity(vec3 p);

void main() {
    vec2 xy = uv * 2.0 - 1.0;
    vec3 ro = vec3(3.0 * sin(time), 1.0, 3.0 * cos(time));
    vec3 center = vec3(0.0, 1.0, 0.0);
    
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
    vec2 info = intersect(ro, rd);
    vec3 pos = ro + rd * info.x;
    vec3 n = getNormal(pos);
    
    vec3 light = vec3(0.0);
    float ambient = 1.0;
    float diffuse = max(dot(n, sunDir), 0.0);
    float specular = clamp(pow(max(dot(-normalize(reflect(-sunDir, n)), rd), 0.0), 32.0), 0.0, 1.0);
    float dome = 0.2 + 0.8 * clamp(rd.y, 0.0, 1.0);
    float back = max(dot(n, vec3(sunDir.x, 0.0, sunDir.z)), 0.0);
    float sol = 0.2 + 0.8 * clamp(-rd.y, 0.0, 1.0);
    float shadow = getShadowIntensity(pos + n * 0.001);
    
    light += ambient * vec3(0.21, 0.2, 0.2);
    light += diffuse * vec3(0.5, 0.55, 0.5) * shadow;
    light += specular * vec3(0.8, 0.8, 0.8);
    light += dome * vec3(1.2, 1.11, 1.3) * shadow;
    light += back * vec3(0.3, 0.3, 0.34);
    light += sol * vec3(0.1, 0.1, 0.2);

    if (info.y < -0.5) { light = vec3(1.0); }
    
    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = pow(objColor, vec3(0.4545));
    
    color = vec4(objColor, 1.0);
}
```

```glsl
float getShadowIntensity(vec3 p) {
    float depth = 0.001;
    float intensity = 1.0;
    for (int i = 0; i < 25; i++) {
        // If you wonder why we are using a vec2 here,
        // the x component is shortest distance, and the y component is id.
        // The y component was used for texturing, and is useless here. So we simply ignore it.
        vec2 info = map(p + depth * sunDir);
        intensity = min(intensity, 5.0 * (info.x / depth));
        if (intensity < 0.001) {
            break;
        }
        depth += info.x;
    }
    return intensity;
}
```
{% include glsl.html %}

As we can see, there is a new parameter introduced, `intensity`, which is the shadow intensity variable. For every iteration, the intensity is the minimum of the current intensity (which starts from 1.0) and the normalized closest distance. The distance is normalized (line 9) so it wouldn't accidentally sample itself, and by normalizing, this guarantees the shadow only appears when:

1. It is not sampling itself
2. The distance to the object is less than current marched distance

Why the 5.0 multiplication then? Well, it acts kind of like a blur radius. As you would've guessed, if the shadow appears whenever the distance to the object is less than current marched distance, then there will be a hell load of shadows because the rule is way too laxed:

```glsl
vec3 sunDir = normalize(vec3(0.0, 1.0, 1.0));

float ball(vec3 p, vec3 off) {
    p -= off;
    return length(p) - 0.5;
}

float sol(vec3 p) {
    return p.y;
}

vec2 map(vec3 p) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(p);
    if (dist < closest) { closest = dist; id = 0.5; }

    dist = ball(p, vec3(0.0, 0.5, 0.0));
    if (dist < closest) { closest = dist; id = 1.5; }
    
    return vec2(closest, id);
}

vec2 intersect(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth);
        if (info.x <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec3 getColor(float id, vec3 p, vec3 rd) {
    if (id < -0.5) {
        vec3 sky = vec3(0.6, 0.8, 0.9) * 0.9;
        sky += rd.y * vec3(0.3, 0.3, 1.1) * 2.5;
        return vec3(sky);
    }
    if (id < 1.0) {
        vec3 floorColor = vec3(1.5, 1.5, 1.5);
        p = p * 2.0;
        vec3 f = fract(p);
        vec3 u = mod(floor(p), 2.0);
        float d = 0.6 + clamp(abs(u.x - u.z), 0.0, 1.0);
        return vec3(d * floorColor);
    }
    if (id < 2.0) { return vec3(1.0, 0.6, 0.0); }
    return vec3(1.0, 0.0, 0.0);
}

vec3 getNormal(vec3 p) {
    const float epsilon = 0.001;
    return normalize(vec3(
        map(p).x - map(vec3(p.x - epsilon, p.yz)).x,
        map(p).x - map(vec3(p.x, p.y - epsilon, p.z)).x,
        map(p).x - map(vec3(p.xy, p.z - epsilon)).x
    ));
}

float getShadowIntensity(vec3 p);

void main() {
    vec2 xy = uv * 2.0 - 1.0;
    vec3 ro = vec3(3.0 * sin(time), 1.0, 3.0 * cos(time));
    vec3 center = vec3(0.0, 1.0, 0.0);
    
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
    vec2 info = intersect(ro, rd);
    vec3 pos = ro + rd * info.x;
    vec3 n = getNormal(pos);
    
    vec3 light = vec3(0.0);
    float ambient = 1.0;
    float diffuse = max(dot(n, sunDir), 0.0);
    float specular = clamp(pow(max(dot(-normalize(reflect(-sunDir, n)), rd), 0.0), 32.0), 0.0, 1.0);
    float dome = 0.2 + 0.8 * clamp(rd.y, 0.0, 1.0);
    float back = max(dot(n, vec3(sunDir.x, 0.0, sunDir.z)), 0.0);
    float sol = 0.2 + 0.8 * clamp(-rd.y, 0.0, 1.0);
    float shadow = getShadowIntensity(pos + n * 0.001);
    
    light += ambient * vec3(0.21, 0.2, 0.2);
    light += diffuse * vec3(0.5, 0.55, 0.5) * shadow;
    light += specular * vec3(0.8, 0.8, 0.8);
    light += dome * vec3(1.2, 1.11, 1.3) * shadow;
    light += back * vec3(0.3, 0.3, 0.34);
    light += sol * vec3(0.1, 0.1, 0.2);

    if (info.y < -0.5) { light = vec3(1.0); }
    
    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = pow(objColor, vec3(0.4545));
    
    color = vec4(objColor, 1.0);
}
```

```glsl
float getShadowIntensity(vec3 p) {
    float depth = 0.001;
    float intensity = 1.0;
    for (int i = 0; i < 25; i++) {
        // If you wonder why we are using a vec2 here,
        // the x component is shortest distance, and the y component is id.
        // The y component was used for texturing, and is useless here. So we simply ignore it.
        vec2 info = map(p + depth * sunDir);
        intensity = min(intensity, 1.0 * (info.x / depth));
        if (intensity < 0.001) {
            break;
        }
        depth += info.x;
    }
    return intensity;
}
```
{% include glsl.html %}

Even the surface has artifacts now. That's why we need to stricten the rule, so shadow only appears when the said obstacle is closer. It's still an approximation though. When the multipler is quite big (such as 1000 or more), the shadow slowly becomes hard shadow, because the depth normalization itself matters less and less, and the whole algorithm devolves back to hard shadow:

```glsl
vec3 sunDir = normalize(vec3(0.0, 1.0, 1.0));

float ball(vec3 p, vec3 off) {
    p -= off;
    return length(p) - 0.5;
}

float sol(vec3 p) {
    return p.y;
}

vec2 map(vec3 p) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(p);
    if (dist < closest) { closest = dist; id = 0.5; }

    dist = ball(p, vec3(0.0, 0.5, 0.0));
    if (dist < closest) { closest = dist; id = 1.5; }
    
    return vec2(closest, id);
}

vec2 intersect(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth);
        if (info.x <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec3 getColor(float id, vec3 p, vec3 rd) {
    if (id < -0.5) {
        vec3 sky = vec3(0.6, 0.8, 0.9) * 0.9;
        sky += rd.y * vec3(0.3, 0.3, 1.1) * 2.5;
        return vec3(sky);
    }
    if (id < 1.0) {
        vec3 floorColor = vec3(1.5, 1.5, 1.5);
        p = p * 2.0;
        vec3 f = fract(p);
        vec3 u = mod(floor(p), 2.0);
        float d = 0.6 + clamp(abs(u.x - u.z), 0.0, 1.0);
        return vec3(d * floorColor);
    }
    if (id < 2.0) { return vec3(1.0, 0.6, 0.0); }
    return vec3(1.0, 0.0, 0.0);
}

vec3 getNormal(vec3 p) {
    const float epsilon = 0.001;
    return normalize(vec3(
        map(p).x - map(vec3(p.x - epsilon, p.yz)).x,
        map(p).x - map(vec3(p.x, p.y - epsilon, p.z)).x,
        map(p).x - map(vec3(p.xy, p.z - epsilon)).x
    ));
}

float getShadowIntensity(vec3 p);

void main() {
    vec2 xy = uv * 2.0 - 1.0;
    vec3 ro = vec3(3.0 * sin(time), 1.0, 3.0 * cos(time));
    vec3 center = vec3(0.0, 1.0, 0.0);
    
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
    vec2 info = intersect(ro, rd);
    vec3 pos = ro + rd * info.x;
    vec3 n = getNormal(pos);
    
    vec3 light = vec3(0.0);
    float ambient = 1.0;
    float diffuse = max(dot(n, sunDir), 0.0);
    float specular = clamp(pow(max(dot(-normalize(reflect(-sunDir, n)), rd), 0.0), 32.0), 0.0, 1.0);
    float dome = 0.2 + 0.8 * clamp(rd.y, 0.0, 1.0);
    float back = max(dot(n, vec3(sunDir.x, 0.0, sunDir.z)), 0.0);
    float sol = 0.2 + 0.8 * clamp(-rd.y, 0.0, 1.0);
    float shadow = getShadowIntensity(pos + n * 0.001);
    
    light += ambient * vec3(0.21, 0.2, 0.2);
    light += diffuse * vec3(0.5, 0.55, 0.5) * shadow;
    light += specular * vec3(0.8, 0.8, 0.8);
    light += dome * vec3(1.2, 1.11, 1.3) * shadow;
    light += back * vec3(0.3, 0.3, 0.34);
    light += sol * vec3(0.1, 0.1, 0.2);

    if (info.y < -0.5) { light = vec3(1.0); }
    
    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = pow(objColor, vec3(0.4545));
    
    color = vec4(objColor, 1.0);
}
```

```glsl
float getShadowIntensity(vec3 p) {
    float depth = 0.001;
    float intensity = 1.0;
    for (int i = 0; i < 25; i++) {
        // If you wonder why we are using a vec2 here,
        // the x component is shortest distance, and the y component is id.
        // The y component was used for texturing, and is useless here. So we simply ignore it.
        vec2 info = map(p + depth * sunDir);
        intensity = min(intensity, 1000.0 * (info.x / depth));
        if (intensity < 0.001) {
            break;
        }
        depth += info.x;
    }
    return intensity;
}
```
{% include glsl.html %}

But this is still better than the hard shadow algorithm. Notice how the artifacts are hardly noticable?

### Parameterize

Well, as the multipler itself is so playable, we could parameterize it into `k`, much like iq did:

```glsl
float getShadowIntensity(vec3 p, float k) {
    float depth = 0.001;
    float intensity = 1.0;
    for (int i = 0; i < 25; i++) {
        // If you wonder why we are using a vec2 here,
        // the x component is shortest distance, and the y component is id.
        // The y component was used for texturing, and is useless here. So we simply ignore it.
        vec2 info = map(p + depth * sunDir);
        intensity = min(intensity, k * (info.x / depth));
        if (intensity < 0.001) {
            break;
        }
        depth += info.x;
    }
    return intensity;
}
```

Then we can invoke it nice and safe. Also, in complex scenes, you might want to clamp the process of marching, so it doesn't march way too far or way too slow:

```glsl
depth += clamp(info.x, 0.02, 2.0);
```

You might also want to move a nudge off the original position along the normal vector, so the raymarching function won't repeatedly sample itself, which is a really bad idea. That's why we should call it in this way:

```glsl
float shadow = getShadowIntensity(pos + n * 0.001);
```

And that's the whole soft shadow implementation! And now, a demoscene, to demostrate how flexible the shadow is:

```glsl
```

```glsl
vec3 sunDir = normalize(vec3(0.0, 1.0, 1.0));

// https://www.iquilezles.org/www/articles/smin/smin.htm
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float ball(vec3 p, vec3 off) {
    p -= off;
    return length(p) - 0.5;
}

float cube(vec3 p, vec3 off) {
    p -= off;
    vec3 c = abs(p) - vec3(0.5);
    return length(max(c, 0.0))
        + min(max(c.x, max(c.y, c.z)), 0.0);
}

float scene(vec3 p) {
    float dist = ball(p, vec3(sin(time * 0.5), 0.5, cos(time * 1.5) * 2.0));
    dist = smin(ball(p, vec3(cos(time * 2.0), sin(time) * 0.5 + 1.0, 1.3)), dist, 0.6);
    dist = smin(ball(p, vec3(0.0, 0.6, 0.0)), dist, 1.0);
    dist = smin(cube(p, vec3(cos(time * 0.1) * 3.0, cos(time * 0.2) * 0.5 + 1.0, -0.5)), dist, 0.6);
    return dist;
}

float sol(vec3 p) {
    return p.y;
}

vec2 map(vec3 p) {
    float closest = 1000.0;
    float id = -1.0;
    
    float dist = sol(p);
    if (dist < closest) { closest = dist; id = 0.5; }

    dist = scene(p);
    if (dist < closest) { closest = dist; id = 1.5; }
    
    return vec2(closest, id);
}

vec2 intersect(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth);
        if (info.x <= 0.001) {
            id = info.y;
            break;
        }
        depth += info.x;
    }
    return vec2(depth, id);
}

vec3 getColor(float id, vec3 p, vec3 rd) {
    if (id < -0.5) {
        vec3 sky = vec3(0.6, 0.8, 0.9) * 0.9;
        sky += rd.y * vec3(0.3, 0.3, 1.1) * 2.5;
        return vec3(sky);
    }
    if (id < 1.0) {
        vec3 floorColor = vec3(1.5, 1.5, 1.5);
        p = p * 2.0;
        vec3 f = fract(p);
        vec3 u = mod(floor(p), 2.0);
        float d = 0.6 + clamp(abs(u.x - u.z), 0.0, 1.0);
        return vec3(d * floorColor);
    }
    if (id < 2.0) { return vec3(1.0, 0.6, 0.0); }
    return vec3(1.0, 0.0, 0.0);
}

vec3 getNormal(vec3 p) {
    const float epsilon = 0.001;
    return normalize(vec3(
        map(p).x - map(vec3(p.x - epsilon, p.yz)).x,
        map(p).x - map(vec3(p.x, p.y - epsilon, p.z)).x,
        map(p).x - map(vec3(p.xy, p.z - epsilon)).x
    ));
}

float getShadowIntensity(vec3 p, float k) {
    float depth = 0.001;
    float intensity = 1.0;
    for (int i = 0; i < 25; i++) {
        // If you wonder why we are using a vec2 here,
        // the x component is shortest distance, and the y component is id.
        // The y component was used for texturing, and is useless here. So we simply ignore it.
        vec2 info = map(p + depth * sunDir);
        intensity = min(intensity, k * (info.x / depth));
        if (intensity < 0.001) {
            break;
        }
        depth += info.x;
    }
    return intensity;
}

void main() {
    vec2 xy = uv * 2.0 - 1.0;
    vec3 ro = vec3(3.0 * sin(time * 0.5), 4.0, 3.0 * cos(time * 0.5));
    vec3 center = vec3(0.0, 1.0, 0.0);
    
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
    vec2 info = intersect(ro, rd);
    vec3 pos = ro + rd * info.x;
    vec3 n = getNormal(pos);
    
    vec3 light = vec3(0.0);
    float ambient = 1.0;
    float diffuse = max(dot(n, sunDir), 0.0);
    float specular = clamp(pow(max(dot(-normalize(reflect(-sunDir, n)), rd), 0.0), 32.0), 0.0, 1.0);
    float dome = 0.2 + 0.8 * clamp(rd.y, 0.0, 1.0);
    float back = max(dot(n, vec3(sunDir.x, 0.0, sunDir.z)), 0.0);
    float sol = 0.2 + 0.8 * clamp(-rd.y, 0.0, 1.0);
    float shadow = getShadowIntensity(pos + n * 0.001, 5.0);
    
    light += ambient * vec3(0.21, 0.2, 0.2);
    light += diffuse * vec3(0.5, 0.55, 0.5) * shadow;
    light += specular * vec3(0.8, 0.8, 0.8) * shadow;
    light += dome * vec3(1.2, 1.11, 1.3) * shadow;
    light += back * vec3(0.3, 0.3, 0.34);
    light += sol * vec3(0.1, 0.1, 0.2);

    if (info.y < -0.5) { light = vec3(1.0); }
    
    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = pow(objColor, vec3(0.4545));
    
    color = vec4(objColor, 1.0);
}
```
{% include glsl.html %}

## Conclusion

Shadow is an important aspect in lighting, and at times I find it confusing. Well, there's nothing else to say except I really enjoy watching the jelly effect. Anyway, goodbye and farewell! I will see you next time.

## References

1. [Penumbra shadows in raymarched SDFs, iq](https://www.iquilezles.org/www/articles/rmshadows/rmshadows.htm)
2. [Distance functions, iq](http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm)
3. [Fruxis, iq, Shadertoy](https://www.shadertoy.com/view/ldl3zl)
