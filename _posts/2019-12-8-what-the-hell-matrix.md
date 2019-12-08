---
layout: post
title: "Matrix: What The Hell?"
featured: /assets/tyler-easton-faixctm2YRQ-unsplash.png
---

Let's take a look at Linear Algebra. Too hard. Bye bye.

__Just joking!__ Hahaha! Of course there is no detour. Youd have to learn it. So today let's review a few most basic matrix operations, in case I lost my memories.

## Addition

Matrix addition is straightforward and stupid:

$$
    \begin{bmatrix}
    A \ B\\
    C \ D
    \end{bmatrix} + \begin{bmatrix}
    E \ F\\
    G \ H
    \end{bmatrix} = \begin{bmatrix}
    A + E \ B + F\\
    C + G \ D + H
    \end{bmatrix} 
$$

That was straightforward.

## Subtraction

Subtraction works the same way.

$$
    \begin{bmatrix}
    A \ B\\
    C \ D
    \end{bmatrix} - \begin{bmatrix}
    E \ F\\
    G \ H
    \end{bmatrix} = \begin{bmatrix}
    A - E \ B - F\\
    C - G \ D - H
    \end{bmatrix} 
$$

## Multiplication

Here's where things begin to get funny (or annoying). However, according to [3b1b](https://www.3blue1brown.com/), this could be very much interpreted in a very intuitive way.

First, let's take a look at a regular vector: $$\vec{a} = \begin{bmatrix}x \\ y\end{bmatrix}$$. It is easy to find out that all of those regular vectors could be represented in a __special__ way: $$\vec{a} = \vec{i} * x + \vec{j} * y$$, in which $$\vec{i}$$ is perpendicular to the y-axis and its length is 1; and $$\vec{j}$$ is perpendicular to the x-axis and its length is also 1. Now, image you scale the $$\vec{i}$$ by a scalar of 2. Then you will find out according to the formula above, $$\vec{a}$$'s x component has been scaled by a magnitude of 2! Isn't that interesting?

The Linear Algebra multiplication mechanism is built around this: by morphing the basic vector of all vectors, we could morph the __world__ indirectly (since those basic vectors could represent __all__ vectors in the world coordinate). and here's what we do during matrix multiplication.

$$
    \begin{align}
        \vec{i} = \begin{bmatrix}i \\ j\end{bmatrix},
        \vec{j} = \begin{bmatrix}k \\ l\end{bmatrix}, \\
            \because \vec{a} = \vec{i} * x + \vec{j} * y, \\
            \therefore \vec{a} = \begin{bmatrix} \vec{i} \ \vec{j} \end{bmatrix} * \begin{bmatrix}x \\ y\end{bmatrix} \\
                               = \begin{bmatrix} i \ k \\ j \ l\end{bmatrix} * \begin{bmatrix}x \\ y\end{bmatrix}
    \end{align}
$$

Not hard to understand, huh? Because that's the way it is intended to be. Normally, we would know that $$\vec{i} = \begin{bmatrix}1 \\ 0\end{bmatrix}$$ and $$\vec{j} = \begin{bmatrix}0 \\ 1\end{bmatrix}$$, which translates the equation above to

$$
    \vec{a} = \begin{bmatrix} 1 \ 0 \\ 0 \ 1\end{bmatrix} * \begin{bmatrix}x \\ y\end{bmatrix}
$$

Look at that! A unit vector multiplication. We all know what that means. However, what if we become a little bit creative and swap $$\vec{i}$$ and $$\vec{j}$$? You know that would mean changing the equation to 

$$
    \vec{a} = \begin{bmatrix} 0 \ 1 \\ 1 \ 0\end{bmatrix} * \begin{bmatrix}x \\ y\end{bmatrix}
$$

, right?

As the basic vectors got swapped, we will see that what's the original component of $$x$$ becomes that of $$y$$, and what's the original component of $$y$$ becomes that of $$x$$. That means the $$\vec{a}$$ had been flipped to the other side of $$y = x$$! __Badass__! If this is a set of vectors, changing the basic vector would necessarily means transforming the __whole world__! And that's why multiplcation of matrices works like this. Of course we can make the basic vectors parallel, such as $$\begin{bmatrix} 1 \ 0 \\ 1 \ 0\end{bmatrix}$$. But that would mean the space has been squished onto the line where vector $$\begin{bmatrix} 1 \\ 0\end{bmatrix}$$ rests and the space will devolve into a one-dimension line, along with all vectors oringinally resides on that 2D plane. So fun!

Well, that very much concludes the matrix multiplication. We should not understand it in a way where your left finger is moving left and your right finger moving down; nope. Understand it in this way! For this, I really appreciate [3b1b](https://www.3blue1brown.com/).

## Unfinished!

Aww! This is not done yet! I still gotta write about the inverse matrix. That's also kinda fun! But I don't really have much time now. So see you soon!
