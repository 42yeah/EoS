---
layout: post
title: Fruxis Broke Down
featured:
---

```glsl
#version 300 es
precision mediump float;

in vec2 uv;
out vec4 color;

void main() {
    color = vec4(uv, 0.0, 1.0);
}
```

{% include glsl.html %}

