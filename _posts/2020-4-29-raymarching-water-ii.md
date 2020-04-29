---
layout: post
title: Raymarching Water Body - Part II
featured: /assets/water/part.2.png
---

__WARNING:__ WebGL2 required! So if you are not using a PC with a better-than-below-average GPU, stuffs below might not work. Also, you might want to read [part I](https://frame.42yeah.casa/2020/04/28/raymarching-water.html) first.

## Resumé

So first, a resumé about what we've done last time:

```glsl
```

```glsl
mat2 rot2d(float deg) {
    float rad = radians(deg);
    float a = sin(rad), b = cos(rad);
    return mat2(b, a, -a, b);
}

vec3 getSkyColor(vec3 rd) {
    vec3 sky = vec3(0.58, 0.77, 1.0);
    return mix(sky, vec3(1.0), clamp(rd.y * 1.5, 0.0, 1.0));
}

// === WAVE CODE START === //
float rand2d(vec2 p) {
    return fract(sin(
        dot(p, vec2(12.345, 67.890))
    ) * 41234.45) * 2.0 - 1.0;
}

float perlin(vec2 p) {
    vec2 u = floor(p);
    vec2 f = fract(p);
    vec2 s = smoothstep(0.0, 1.0, f);
    
    float a = rand2d(u);
    float b = rand2d(u + vec2(1.0, 0.0));
    float c = rand2d(u + vec2(0.0, 1.0));
    float d = rand2d(u + vec2(1.0, 1.0));
    
    return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

float wave(vec2 uv, float choppiness) {
    uv += perlin(uv); // offset by itself
    vec2 a = 1.0 - abs(sin(uv));
    vec2 b = abs(cos(uv));
    vec2 smoothed = mix(a, b, a);
    return pow(1.0 - pow(smoothed.x * smoothed.y, 0.5), choppiness);
}

float fbm(vec2 uv) {
    float height = 0.6;
    float amplitude = 0.9;
    const int octaves = 5;
    float frequency = 0.16;
    float value = 0.0;
    float choppiness = 4.0;
    vec2 shift = vec2(100.0, 0.0);
    for (int i = 0; i < octaves; i++) {
        float d = wave((uv + time) * frequency, choppiness);
        d += wave((uv - time * 0.8) * frequency, choppiness);
        uv = 2.0 * rot2d(45.0) * uv + shift;
        value += height * d;
        frequency *= 2.0;
        height *= 0.22;
        choppiness = mix(choppiness, 1.0, 0.2);
    }
    return value;
}
// === WAVE CODE END === //

float sol(vec3 p) {
    return p.y - fbm(p.xz);
}

vec2 map(vec3 p) {
    float id = -1.0;
    float closest = 1000.0;
    
    float dist = sol(p);
    if (dist < closest) { closest = dist; id = 0.5; }
    
    return vec2(closest, id);
}

vec2 intersect(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth);
        if (info.x <= 0.0001) {
            id = info.y;
            break;
        }
        depth += clamp(info.x, 0.01, 2.0);
    }
    return vec2(depth, id);
}

vec3 getColor(float id, vec3 p, vec3 rd) {
    if (id < -0.5) { return getSkyColor(rd); }
    if (id < 1.0) { return vec3(0.25, 0.55, 1.0); }
    return vec3(1.0, 0.0, 0.0);
}

vec3 getNormal(vec3 p) {
    const float epsilon = 0.001;
    return normalize(vec3(
        map(p).x - map(vec3(p.x - epsilon, p.yz)).x,
        map(p).x - map(vec3(p.x, p.y - epsilon, p.z)).x,
        map(p).x - map(vec3(p.x, p.y, p.z - epsilon)).x
    ));
}

void main() {
    vec2 xy = uv * 2.0 - 1.0;

    vec3 ro = vec3(0.0, 5.0, 5.0);
    vec3 center = vec3(0.0, 0.0, 0.0);
    
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));

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
    float diffuse = max(dot(n, lightDir), 0.0);
    float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
    float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
    
    light += ambient * vec3(0.0, 0.0, 0.0);
    light += diffuse * vec3(1.2, 1.2, 1.2);
    light += back * vec3(0.52, 0.42, 0.34);
    light += dome * vec3(0.1, 0.1, 0.1);
    if (info.y < -0.5) {
        light = vec3(1.0);
    }

    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = pow(objColor, vec3(0.4545));

    color = vec4(objColor, 1.0);
}
```

{% include glsl.html %}

We've done the water body geometry, but nothing else. Today, we are going to add details to our ocean!

## Implementation, II

We all know fBm's noise increases as there are more and more octaves on-screen. But every iteration is quite expensive on our GPU. That's why we can go easy on the original geometry itself, and add details only when we are calculating normals. This not only saves calculation, but it actually increases the quality of raymarching. Because without small bumps here and there, raymarching can go further.

### More Detailed Normal Function, Less Detailed Geometry

So here's what we are going to do. When we are raymarching for geometry, the fBm function should contain less octaves; and when we are looking for normals, the fBm function should contain more octaves. And that's why we should "parameterize" the fBm function. As marching is wayyyy cheaper now, we can finally view the ocean at an horizontal angle:

```glsl
mat2 rot2d(float deg) {
    float rad = radians(deg);
    float a = sin(rad), b = cos(rad);
    return mat2(b, a, -a, b);
}

mat2 scl2d(float times) {
    return mat2(times, 0.0, 0.0, times);
}

vec3 getSkyColor(vec3 rd) {
    vec3 sky = vec3(0.58, 0.77, 1.0);
    return mix(sky, vec3(1.0), clamp(rd.y * 1.5, 0.0, 1.0));
}

// === WAVE CODE START === //
float rand2d(vec2 p) {
    return fract(sin(
        dot(p, vec2(12.345, 67.890))
    ) * 41234.45) * 2.0 - 1.0;
}

float perlin(vec2 p) {
    vec2 u = floor(p);
    vec2 f = fract(p);
    vec2 s = smoothstep(0.0, 1.0, f);
    
    float a = rand2d(u);
    float b = rand2d(u + vec2(1.0, 0.0));
    float c = rand2d(u + vec2(0.0, 1.0));
    float d = rand2d(u + vec2(1.0, 1.0));
    
    return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

float wave(vec2 uv, float choppiness) {
    uv += perlin(uv); // offset by itself
    vec2 a = 1.0 - abs(sin(uv));
    vec2 b = abs(cos(uv));
    vec2 smoothed = mix(a, b, a);
    return pow(1.0 - pow(smoothed.x * smoothed.y, 0.5), choppiness);
}

float fbm(vec2 uv, int octaves);
// === WAVE CODE END === //

float sol(vec3 p, int octaves);

vec2 map(vec3 p, int octaves) {
    float id = -1.0;
    float closest = 1000.0;
    
    float dist = sol(p, octaves);
    if (dist < closest) { closest = dist; id = 0.5; }
    
    return vec2(closest, id);
}

vec2 intersect(vec3 ro, vec3 rd);

vec3 getColor(float id, vec3 p, vec3 rd) {
    if (id < -0.5) { return getSkyColor(rd); }
    if (id < 1.0) { return vec3(0.25, 0.55, 1.0); }
    return vec3(1.0, 0.0, 0.0);
}

vec3 getNormal(vec3 p);

void main() {
    vec2 xy = uv * 2.0 - 1.0;

    vec3 ro = vec3(0.0, 4.0, 50.0);
    vec3 center = vec3(0.0, 1.0, 0.0);
    
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));

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
    float diffuse = max(dot(n, lightDir), 0.0);
    float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
    float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
    
    light += ambient * vec3(0.0, 0.0, 0.0);
    light += diffuse * vec3(1.2, 1.2, 1.2);
    light += back * vec3(0.52, 0.42, 0.34);
    light += dome * vec3(0.1, 0.1, 0.1);
    if (info.y < -0.5) {
        light = vec3(1.0);
    }

    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = pow(objColor, vec3(0.4545));

    color = vec4(objColor, 1.0);
}
```

```glsl
float fbm(vec2 uv, int octaves) {
    float height = 0.6;
    float amplitude = 0.9;
    float frequency = 0.16;
    float value = 0.0;
    float choppiness = 4.0;
    vec2 shift = vec2(100.0, 0.0);
    for (int i = 0; i < octaves; i++) {
        float d = wave((uv + time) * frequency, choppiness);
        d += wave((uv - time * 0.8) * frequency, choppiness);
        uv = scl2d(2.0) * rot2d(45.0) * uv + shift;
        value += height * d;
        frequency *= 2.0;
        height *= 0.22;
        choppiness = mix(choppiness, 1.0, 0.2);
    }
    return value;
}

float sol(vec3 p, int octaves) {
    return p.y - fbm(p.xz, octaves);
}

// raymarching for geometry: less octaves
vec2 intersect(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth, 3); // octaves: 3
        if (info.x <= 0.0001) {
            id = info.y;
            break;
        }
        depth += clamp(info.x, 0.01, 2.0);
    }
    return vec2(depth, id);
}

// raymarching for normal: more octaves
vec3 getNormal(vec3 p) {
    const float epsilon = 0.001;
    int octaves = 5;
    return normalize(vec3(
        map(p, octaves).x - map(vec3(p.x - epsilon, p.yz), octaves).x,
        map(p, octaves).x - map(vec3(p.x, p.y - epsilon, p.z), octaves).x,
        map(p, octaves).x - map(vec3(p.x, p.y, p.z - epsilon), octaves).x
    ));
}
```

{% include glsl.html %}

Same details, but cheaper. Great! Of course, if your GPU is fancy, nevermind all that!

### Lighting

And this brings us to the almost final stage of rendering water body: lighting. All the way from the top, we are using really, really primitive lighting, consists of basic directional lights only. Now, we need to take a few more lighting calculations into our code:

1. specular lighting
2. water reflection
3. water refraction

So, let's implement them one by one! 

#### Specular Lighting

Implementing specular lighting is fairly easy:

```glsl
mat2 rot2d(float deg) {
    float rad = radians(deg);
    float a = sin(rad), b = cos(rad);
    return mat2(b, a, -a, b);
}

mat2 scl2d(float times) {
    return mat2(times, 0.0, 0.0, times);
}

vec3 getSkyColor(vec3 rd) {
    vec3 sky = vec3(0.58, 0.77, 1.0);
    return mix(sky, vec3(1.0), clamp(rd.y * 1.5, 0.0, 1.0));
}

// === WAVE CODE START === //
float rand2d(vec2 p) {
    return fract(sin(
        dot(p, vec2(12.345, 67.890))
    ) * 41234.45) * 2.0 - 1.0;
}

float perlin(vec2 p) {
    vec2 u = floor(p);
    vec2 f = fract(p);
    vec2 s = smoothstep(0.0, 1.0, f);
    
    float a = rand2d(u);
    float b = rand2d(u + vec2(1.0, 0.0));
    float c = rand2d(u + vec2(0.0, 1.0));
    float d = rand2d(u + vec2(1.0, 1.0));
    
    return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

float wave(vec2 uv, float choppiness) {
    uv += perlin(uv); // offset by itself
    vec2 a = 1.0 - abs(sin(uv));
    vec2 b = abs(cos(uv));
    vec2 smoothed = mix(a, b, a);
    return pow(1.0 - pow(smoothed.x * smoothed.y, 0.5), choppiness);
}

float fbm(vec2 uv, int octaves) {
    float height = 0.6;
    float amplitude = 0.9;
    float frequency = 0.16;
    float value = 0.0;
    float choppiness = 4.0;
    vec2 shift = vec2(100.0, 0.0);
    for (int i = 0; i < octaves; i++) {
        float d = wave((uv + time) * frequency, choppiness);
        d += wave((uv - time * 0.8) * frequency, choppiness);
        uv = scl2d(2.0) * rot2d(45.0) * uv + shift;
        value += height * d;
        frequency *= 2.0;
        height *= 0.22;
        choppiness = mix(choppiness, 1.0, 0.2);
    }
    return value;
}
// === WAVE CODE END === //

float sol(vec3 p, int octaves) {
    return p.y - fbm(p.xz, octaves);
}

vec2 map(vec3 p, int octaves) {
    float id = -1.0;
    float closest = 1000.0;
    
    float dist = sol(p, octaves);
    if (dist < closest) { closest = dist; id = 0.5; }
    
    return vec2(closest, id);
}

vec3 getColor(float id, vec3 p, vec3 rd) {
    if (id < -0.5) { return getSkyColor(rd); }
    if (id < 1.0) { return vec3(0.12, 0.345, 0.67); }
    return vec3(1.0, 0.0, 0.0);
}

// raymarching for geometry: less octaves
vec2 intersect(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth, 3); // octaves: 3
        if (info.x <= 0.0001) {
            id = info.y;
            break;
        }
        depth += clamp(info.x, 0.01, 2.0);
    }
    return vec2(depth, id);
}

// raymarching for normal: more octaves
vec3 getNormal(vec3 p) {
    const float epsilon = 0.001;
    int octaves = 5;
    return normalize(vec3(
        map(p, octaves).x - map(vec3(p.x - epsilon, p.yz), octaves).x,
        map(p, octaves).x - map(vec3(p.x, p.y - epsilon, p.z), octaves).x,
        map(p, octaves).x - map(vec3(p.x, p.y, p.z - epsilon), octaves).x
    ));
}

float specular(vec3 rd, vec3 lightDir, vec3 n);

void main() {
    vec2 xy = uv * 2.0 - 1.0;

    vec3 ro = vec3(0.0, 4.0, 50.0);
    vec3 center = vec3(0.0, 1.0, 0.0);
    
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));

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
    float diffuse = max(dot(n, lightDir), 0.0);
    float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
    float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
    // float specular = max(
    //    pow(dot(rd, normalize(reflect(-lightDir, n))), 8.0)
    //, 0.0);
    float specular = specular(rd, lightDir, n);
    
    light += ambient * vec3(0.0, 0.0, 0.0);
    light += diffuse * vec3(1.2, 1.2, 1.2);
    light += back * vec3(0.52, 0.42, 0.34);
    light += dome * vec3(0.1, 0.1, 0.1);
    light += specular * vec3(3.0, 3.0, 3.0);
    if (info.y < -0.5) {
        light = vec3(1.0);
    }

    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = pow(objColor, vec3(0.4545));

    color = vec4(objColor, 1.0);
}
```

```glsl
float specular(vec3 rd, vec3 lightDir, vec3 n) {
    return max(
        pow(dot(rd, normalize(reflect(-lightDir, n))), 8.0)
    , 0.0);
}
```

{% include glsl.html %}

#### Water Reflection

Reflecting in this scene is also not that hard. Just render the sky color of the reflected position:

```glsl
vec3 reflection = getSkyColor(reflect(rd, n));
```

However, it can't be used immediately, as water is not a perfect reflector. It only partially reflects, and partially refracts. That's why we also need to implement refraction first.

#### Water Refraction

As the water body we are rendering does not really have a seabed at the very bottom, we are just going to make it our default diffuse color. __However__, if there are something at the bottom, we need to shoot a ray to there and sample it, too.

#### [Fresnel Equations](https://en.wikipedia.org/wiki/Fresnel_equations)

As we get our water reflection and refraction already, we need to blend them together using fresnel equations. And I am going to steal this directly from [Seascape](https://www.shadertoy.com/view/Ms2SD1): 

```glsl
float fresnel = clamp(1.0 - dot(n,-eye), 0.0, 1.0);
fresnel = pow(fresnel,3.0) * 0.5;
```

With all those things blended together, changing the ocean color a bit, & saturate the result color, here's what we are gonna get:

```glsl
```

```glsl
mat2 rot2d(float deg) {
    float rad = radians(deg);
    float a = sin(rad), b = cos(rad);
    return mat2(b, a, -a, b);
}

mat2 scl2d(float times) {
    return mat2(times, 0.0, 0.0, times);
}

vec3 getSkyColor(vec3 rd) {
    vec3 sky = vec3(0.58, 0.77, 1.0);
    return mix(sky, vec3(1.0), clamp(rd.y * 1.5, 0.0, 1.0));
}

// === WAVE CODE START === //
float rand2d(vec2 p) {
    return fract(sin(
        dot(p, vec2(12.345, 67.890))
    ) * 41234.45) * 2.0 - 1.0;
}

float perlin(vec2 p) {
    vec2 u = floor(p);
    vec2 f = fract(p);
    vec2 s = smoothstep(0.0, 1.0, f);
    
    float a = rand2d(u);
    float b = rand2d(u + vec2(1.0, 0.0));
    float c = rand2d(u + vec2(0.0, 1.0));
    float d = rand2d(u + vec2(1.0, 1.0));
    
    return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

float wave(vec2 uv, float choppiness) {
    uv += perlin(uv); // offset by itself
    vec2 a = 1.0 - abs(sin(uv));
    vec2 b = abs(cos(uv));
    vec2 smoothed = mix(a, b, a);
    return pow(1.0 - pow(smoothed.x * smoothed.y, 0.5), choppiness);
}

float fbm(vec2 uv, int octaves) {
    float height = 0.6;
    float amplitude = 0.9;
    float frequency = 0.16;
    float value = 0.0;
    float choppiness = 4.0;
    vec2 shift = vec2(100.0, 0.0);
    for (int i = 0; i < octaves; i++) {
        float d = wave((uv + time) * frequency, choppiness);
        d += wave((uv - time * 0.8) * frequency, choppiness);
        uv = scl2d(2.0) * rot2d(45.0) * uv + shift;
        value += height * d;
        frequency *= 2.0;
        height *= 0.22;
        choppiness = mix(choppiness, 1.0, 0.2);
    }
    return value;
}
// === WAVE CODE END === //

float sol(vec3 p, int octaves) {
    return p.y - fbm(p.xz, octaves);
}

vec2 map(vec3 p, int octaves) {
    float id = -1.0;
    float closest = 1000.0;
    
    float dist = sol(p, octaves);
    if (dist < closest) { closest = dist; id = 0.5; }
    
    return vec2(closest, id);
}

vec3 getColor(float id, vec3 p, vec3 rd) {
    if (id < -0.5) { return getSkyColor(rd); }
    if (id < 1.0) { return vec3(0.32, 0.645, 0.87) * 0.77; }
    return vec3(1.0, 0.0, 0.0);
}

// raymarching for geometry: less octaves
vec2 intersect(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth, 3); // octaves: 3
        if (info.x <= 0.0001) {
            id = info.y;
            break;
        }
        depth += clamp(info.x, 0.01, 2.0);
    }
    return vec2(depth, id);
}

// raymarching for normal: more octaves
vec3 getNormal(vec3 p) {
    const float epsilon = 0.001;
    int octaves = 5;
    return normalize(vec3(
        map(p, octaves).x - map(vec3(p.x - epsilon, p.yz), octaves).x,
        map(p, octaves).x - map(vec3(p.x, p.y - epsilon, p.z), octaves).x,
        map(p, octaves).x - map(vec3(p.x, p.y, p.z - epsilon), octaves).x
    ));
}

vec3 saturate(vec3 color, float adjustment) {
    const vec3 c = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(color, c));
    return mix(intensity, color, adjustment);
}

void main() {
    vec2 xy = uv * 2.0 - 1.0;

    vec3 ro = vec3(time, 1.0, 50.0);
    vec3 center = vec3(0.0, 1.0, 0.0);
    
    vec3 lightDir = normalize(vec3(0.0, 1.0, 4.0));

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
    float diffuse = max(dot(n, lightDir), 0.0);
    float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
    float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
    float specular = max(
        pow(dot(rd, normalize(reflect(-lightDir, n))), 60.0)
    , 0.0);
    
    vec3 diffuseColor = diffuse * vec3(1.2, 1.2, 1.2);
    float fresnel = clamp(1.0 - dot(n, -rd), 0.0, 1.0);
    fresnel = pow(fresnel, 3.0) * 0.5;
    vec3 reflectColor = getSkyColor(reflect(rd, n)) * 2.0;

    light += ambient * vec3(0.0, 0.0, 0.0);
    light += mix(diffuseColor, reflectColor, fresnel);
    light += back * vec3(0.52, 0.52, 0.54);
    light += dome * vec3(0.1, 0.1, 0.1);
    light += specular * vec3(1.1, 1.1, 1.1);

    
    if (info.y < -0.5) {
        light = vec3(1.0);
    }

    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = saturate(objColor, 2.0);
    objColor = pow(objColor, vec3(0.4545));

    color = vec4(objColor, 1.0);
}
```

{% include glsl.html %}

### Anti Aliasing

Finally, anti aliasing. The ocean as we see now is a bit jagged, and we don't want that. Fortunately, anti aliasing is really easy on raymarching: we just need to sample the neighbours and average them out (__EXTREMELY LAGGY WARNING__):

```glsl
mat2 rot2d(float deg) {
    float rad = radians(deg);
    float a = sin(rad), b = cos(rad);
    return mat2(b, a, -a, b);
}

mat2 scl2d(float times) {
    return mat2(times, 0.0, 0.0, times);
}

vec3 getSkyColor(vec3 rd) {
    vec3 sky = vec3(0.58, 0.77, 1.0);
    return mix(sky, vec3(1.0), clamp(rd.y * 1.5, 0.0, 1.0));
}

// === WAVE CODE START === //
float rand2d(vec2 p) {
    return fract(sin(
        dot(p, vec2(12.345, 67.890))
    ) * 41234.45) * 2.0 - 1.0;
}

float perlin(vec2 p) {
    vec2 u = floor(p);
    vec2 f = fract(p);
    vec2 s = smoothstep(0.0, 1.0, f);
    
    float a = rand2d(u);
    float b = rand2d(u + vec2(1.0, 0.0));
    float c = rand2d(u + vec2(0.0, 1.0));
    float d = rand2d(u + vec2(1.0, 1.0));
    
    return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

float wave(vec2 uv, float choppiness) {
    uv += perlin(uv); // offset by itself
    vec2 a = 1.0 - abs(sin(uv));
    vec2 b = abs(cos(uv));
    vec2 smoothed = mix(a, b, a);
    return pow(1.0 - pow(smoothed.x * smoothed.y, 0.5), choppiness);
}

float fbm(vec2 uv, int octaves) {
    float height = 0.6;
    float amplitude = 0.9;
    float frequency = 0.16;
    float value = 0.0;
    float choppiness = 4.0;
    vec2 shift = vec2(100.0, 0.0);
    for (int i = 0; i < octaves; i++) {
        float d = wave((uv + time) * frequency, choppiness);
        d += wave((uv - time * 0.8) * frequency, choppiness);
        uv = scl2d(2.0) * rot2d(45.0) * uv + shift;
        value += height * d;
        frequency *= 2.0;
        height *= 0.22;
        choppiness = mix(choppiness, 1.0, 0.2);
    }
    return value;
}
// === WAVE CODE END === //

float sol(vec3 p, int octaves) {
    return p.y - fbm(p.xz, octaves);
}

vec2 map(vec3 p, int octaves) {
    float id = -1.0;
    float closest = 1000.0;
    
    float dist = sol(p, octaves);
    if (dist < closest) { closest = dist; id = 0.5; }
    
    return vec2(closest, id);
}

vec3 getColor(float id, vec3 p, vec3 rd) {
    if (id < -0.5) { return getSkyColor(rd); }
    if (id < 1.0) { return vec3(0.32, 0.645, 0.87) * 0.77; }
    return vec3(1.0, 0.0, 0.0);
}

// raymarching for geometry: less octaves
vec2 intersect(vec3 ro, vec3 rd) {
    float depth = 0.0;
    float id = -1.0;
    for (int i = 0; i < 200; i++) {
        vec2 info = map(ro + rd * depth, 3); // octaves: 3
        if (info.x <= 0.0001) {
            id = info.y;
            break;
        }
        depth += clamp(info.x, 0.01, 2.0);
    }
    return vec2(depth, id);
}

// raymarching for normal: more octaves
vec3 getNormal(vec3 p) {
    const float epsilon = 0.001;
    int octaves = 5;
    return normalize(vec3(
        map(p, octaves).x - map(vec3(p.x - epsilon, p.yz), octaves).x,
        map(p, octaves).x - map(vec3(p.x, p.y - epsilon, p.z), octaves).x,
        map(p, octaves).x - map(vec3(p.x, p.y, p.z - epsilon), octaves).x
    ));
}

vec3 saturate(vec3 color, float adjustment) {
    const vec3 c = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(color, c));
    return mix(intensity, color, adjustment);
}

vec3 getFragColor(vec2 xy) {
    vec3 ro = vec3(time, 1.0, 50.0);
    vec3 center = vec3(0.0, 1.0, 0.0);
    
    vec3 lightDir = normalize(vec3(0.0, 1.0, 4.0));

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
    float diffuse = max(dot(n, lightDir), 0.0);
    float back = max(dot(n, vec3(-lightDir.x, 0.0, -lightDir.z)), 0.0);
    float dome = 0.2 + 0.8 * clamp(n.y, 0.0, 1.0);
    float specular = max(
        pow(dot(rd, normalize(reflect(-lightDir, n))), 60.0)
    , 0.0);
    
    vec3 diffuseColor = diffuse * vec3(1.2, 1.2, 1.2);
    float fresnel = clamp(1.0 - dot(n, -rd), 0.0, 1.0);
    fresnel = pow(fresnel, 3.0) * 0.5;
    vec3 reflectColor = getSkyColor(reflect(rd, n)) * 2.0;

    light += ambient * vec3(0.0, 0.0, 0.0);
    light += mix(diffuseColor, reflectColor, fresnel);
    light += back * vec3(0.52, 0.52, 0.54);
    light += dome * vec3(0.1, 0.1, 0.1);
    light += specular * vec3(1.1, 1.1, 1.1);

    
    if (info.y < -0.5) {
        light = vec3(1.0);
    }

    vec3 objColor = getColor(info.y, pos, rd) * light;
    objColor = saturate(objColor, 2.0);
    return objColor;
}
```

```glsl
void main() {
    vec2 xy = uv * 2.0 - 1.0;
    vec3 result = vec3(0.0);
    float nudge = 1.0 / 500.0;

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            result += getFragColor(vec2(xy.x + float(x) * nudge,
                xy.y + float(y) * nudge));
        }
    }
    result /= 9.0;
    result = pow(result, vec3(0.4545));

    color = vec4(result, 1.0);
}
```

{% include glsl.html %}

## That's All!

That's all for now. Man, this is kinda like the biggest thing I've done since I started raymarching. I might not have explained everything clearly, because I don't understand everything, too; but it has been a very, very fun experience since I really love ocean! Even though I didn't really reach the level of [Seascape](https://www.shadertoy.com/view/Ms2SD1) (because that's so cool), I am working on it. So fingers crossed! 

## Conclusion

Water body is something really tricky to render, as it has a few annoying properties, such as always morphing body and such. Rendering shadows/ambient occlusion might not fit for water rendering. But who knows? I am just getting started anyway!

## References

1. [Seascape, TDM, Shadertoy](https://www.shadertoy.com/view/Ms2SD1)
2. [Frensel equations, Wikipedia](https://en.wikipedia.org/wiki/Fresnel_equations)
