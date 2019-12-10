---
layout: post
title: "Matrix: What The Hell?"
featured: /assets/tyler-easton-faixctm2YRQ-unsplash.png
---

Let's take a look at Linear Algebra. Too hard. Goodbye.

__Just joking!__ Hahaha! Of course there is no detour. You have to learn it. So today let's review a few most basic matrix operations, in case I lost my memories.

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

## Inverse!

Matrix inverse has always been brought forward by a very weird topic, which is solving multiple equations. Such as:

$$
    \begin{equation}
        \begin{cases}
        A_1x + B_1y + C_1z + \dots = \alpha \\
        A_2x + B_2y + C_2z + \dots = \beta \\
        A_3x + B_3y + C_3z + \dots = \gamma \\
        \end{cases}
    \end{equation}
$$

If one or more variable is lacking from one or more cases, just assume its coefficient is 0 (because it is). And then we can begin constructing it into our little matrix!

As you might notice the pattern already, the coefficients could be easily formed into a matrix:

$$
    A = \begin{bmatrix}
        A_1 \ A_2 \ A_3 \ \dots \ A_n \\
        B_1 \ B_2 \ B_3 \ \dots \ B_n \\
        C_1 \ C_2 \ C_3 \ \dots \ C_n \\
        \dots \\
        N_1 \ \dots \ \dots \ \dots \ N_n
    \end{bmatrix}
$$

And so does the variable, it could be formed into a $$ N * 1 $$ vector just easily:

$$
    x = \begin{bmatrix}
        x \\
        y \\
        z \\
        \dots
    \end{bmatrix}
$$

And the result, as well!

$$
    B = \begin{bmatrix}
        \alpha \\
        \beta \\
        \gamma \\
        \dots
    \end{bmatrix}
$$

And now all of these becomes an __easy__ matrix multiplication!

$$
    Ax = B
$$

And we know that solve for $$x$$ exists if $$det(A) > 0$$.

## Wait, what the hell is $$det$$?

Oh yeah, sorry about that. $$det$$ stands for determinant, which in turn stands for the size ratio of the rectangle between scaled basic vector and the original basic vector.

However, as this is about matrix, I am not gonna dive deep here. If you are interested, go to [here](https://www.youtube.com/watch?v=Ip3X9LOh2dk&list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab&index=6) to learn more. Please, knock yourself out.

## Back to inverse matrix!

As I was just sayin', solve for $$x$$ exists if and only if $$det(A) > 0$$. So how could we solve $$x$$? With this newly-introduced concept of matrix inverse, of course!

As we all know, matrix could be transformed in this way:

$$
    AB = C
$$

So is there a way to __reverse__ this transformation?

Turns out there are! And it is known by $$A^{-1}$$, which means $$A^{-1}C = B$$. It is also not hard to infer that $$E^{-1} = E$$, since $$EB = EC$$. It is thus could be inferred that $$A \cdot A^{-1} = E$$. Thus is how a very important equation borned:

$$
    \begin{align}
        AB = C \\
        A^{-1} \cdot AB = A^{-1} \cdot C \\
        EB = A^{-1} \cdot C \\
        B = A^{-1} \cdot C
    \end{align}
$$

Applying to our equation above means:

$$
    \begin{align}
        Ax = B \\
        A^{-1} \cdot Ax = A^{-1} \cdot B \\
        x = A^{-1} \cdot B
    \end{align}
$$

... And that's how its done. The definition of inverse matrix. Have a lot of fun!

## So much to do!

There is still so much in the world of linear algebra! And as this thing is getting more and more gargantuan, I guess I am gonna stop right here. Ponder the wonder of algebra and eat an egg!

See you!
