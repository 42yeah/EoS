---
layout: post
title: Object Selection With Ray Marching
featured: /assets/oswrm/red.tree.png
---

There are loads of objection selection algorithms out there... I guess? I didn't check! Anyway, I am making this game, and I need objection selection. So I said to myself, why not use ray marching? Because they fit! So I implemented it. This methods might not be the __best__ method out there (trust me, it will not be), and it might be the worst. But it works!

## Introduction

I don't know, I might be the first guy to use such a method. I mean there are ray __tracing__ object pickings out there, but I am a bit lazy to pick up. So here we are! Object picking with ray marching. Now how does that work?

## Implementation

First, we gotta know the definition of Ray Tracing. It is a technique for displaying 3D stuffs commonly used in demoscenes, but we are not gonna cover it completely today. A graph will tell you why is it suitable for object selection (but __not__ optimal):

![SDF explained](/assets/shaders/3.jpg)

Ray marching is good because it's suitable for irregular materials. If you've got a way to calculate said irregular materials's distance to the camera, ray marching could be really precise. But we are just giving a general idea here.

In object selection, because the direction will __always__ be the camera front direction (because you walk in that way). So it becomes easier! We will need a camera position, which we already have, and a camera front direction for ray marching, which we also already have.

Now we will define this variable named _depth_. _depth_ would have an initial value of 0. Then we will have an _index_ variable, so that the loop will quits when an object is picked:

```c++
float depth = 0.0f;
int index = -1;
int maxMarches = 25; // Doesn't need to be very big
for (int i = 0; i < maxMarches && index == -1; i++) {
    // Ray marching here
}
```

So how do we do the ray marching? Well, the concept is also __very__ simple:

```c++
vec3 nCamPos = camera.position + depth * camera.front;
float closest = 10000.0f; // Just a very big value
for (int j = 0; j < objects.size(); j++) {
    float dst = distanceOf(objects[i], nCamPos);
    if (dst < closest) {
        closest = dst;
        if (collides(objects[i], nCamPos)) {
            // Object has been picked; time to bail
            index = j;
        }
    }
}
depth += dst;
```

How to explain the code above? Well, we find a object that is closest to the current camera. If it is indeed so close to the camera that it __engulfs__ the camera, the object is picked! Good! If it is not, that means we have yet to encounter objects. So we add the distance to depth, and march once more.

That's it. Not complex at all! The problem is sometimes it is a little bit imprecise:

<video width="400" height="300" src="/assets/oswrm/selection.mp4" controls></video>

And an easy explanation would be the ray __marched a little bit too much__. 

![Too much marching](/assets/oswrm/crossed.jpg)

And one will to dial it down is make the _depth_ advances more slowly:

```c++
depth += dst / 4.0f;
```

Well, it worked for me!

## Conclusion

So yeah, a novel object picking technique. Or is it? Easy to implement, hard on CPU (that's a loop in a loop for __every frame__), unstable, and you gotta implement collision, too. As my world is basically cubes, here's one for your convenience:

```c++
bool collides(vec3 nCamPos, Object object) {
    return (!(nCamPos.x < object.position.x - object.width ||
            nCamPos.x > object.position.x + object.width ||
            nCamPos.z < object.position.z - object.height ||
            nCamPos.z > object.position.z + object.height ||
            nCamPos.y < object.position.y - object.depth ||
            nCamPos.y > object.position.y + object.depth));
}
```

## References

There are virtually no references for this one. It just came up. But I would gladly takes you to [other posts](http://schabby.de/picking-opengl-ray-tracing/) where there are more reliable ways to pick objects, though.

1. [Ray Marching, Jamie Wong](http://jamie-wong.com/2016/07/15/ray-marching-signed-distance-functions/)
2. [OpenGL Object Picking in 3D, Schabby](http://schabby.de/picking-opengl-ray-tracing/)
