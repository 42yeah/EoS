---
layout: post
title: Writing an Evaders Game In OCaml With TSDL
featured: /assets/bernice-tong-VPTSmbGba7Q-unsplash.jpg
---

So, writing an _Evaders_ game in OCaml. Whenever I learn a new language, I will try to write a really basic game, which looks a little bit like Space Invaders, and I will implement it from scratch (apart from graphics libraries). So let's get started!

## Introduction

You know, _Evaders_ isn't __that__ like Space Invaders: you cannot shoot. Blocks simply comes from another direction, and you need to dodge them. And as game progresses, more and more enemies will appear, and you will need to dodge more and more. I've made one before for Java (probably for Android, too), and you can get it from [here (it's in Chinese)](https://42yeah.coding.net/p/EvadersEvolution).

## Implementation

Well, OCaml is a __really hard__ language in my perspective; as I've never really touched any ML family languages before. But I guess I will learn to play with it on the way. The first thing we need to do is creating a new project with `dune`.

### Project Creation

`dune` is a project manager of OCaml. By the way, we also need an `SDL` wrapper for OCaml, and we will use `TSDL` here. If you didn't have them, you can get it by typing

```sh
opam install dune tsdl
```

And if you don't know `opam`, it stands for **O**Caml **PA**ckage **M**anager. You can get it [here](https://opam.ocaml.org/). After getting it, we can start a new dune project by 

```sh
dune init project evaders
```

This will create a folder named `evaders`. And it's time to mess up some stuffs inside!

### Dependency

Inside there will be a variety of files presented. To check if the project creation step is successful, you might want to run

```sh
cd evaders
dune build
./_build/default/bin/main.exe
```

to check whether there's a "hello world" output. Note that the executable will have an extension of .exe regardless of the operating system. And now, we need to tell `dune` we are using this `TSDL` library, otherwise the build will fail when we are trying to use `TSDL` functionalities. Go to `dune`, which is a file under `evaders/bin`, __not the file under `evaders/lib`__. It should look kinda like this:

```lisp
(executable
 (public_name evaders)
 (name main)
 (libraries evaders)) 
```

Look at the line `libraries`. This is the line `dune` looks up when it is linking libraries (duh). Right now our binary depends on one library, `evaders`, which really is just the files under `evaders/lib` (and we are not using that folder, by the way). Modify the line so it includes `tsdl` as well. And while we are at it, we might also want to include `unix`, because of some features we will be needing later:

```
 (libraries evaders tsdl unix))
```

after that, try to run `dune build` again. If any error pops up, try to resolve it. And after that, we are so ready to move onto the next step!

### Initialization

Now, we can jump into `evaders/bin/main.ml` and start editing it. First we gotta delete everything inside it. Then, we need to include Tsdl by adding the first line:

```ocaml
open Tsdl

(* follow up code... *)
```

then, we need to initialize SDL and the window:

```ocaml
let _ =
  begin match Sdl.init Sdl.Init.everything with
  | Error (`Msg e) -> prerr_endline ("Failed to initialize SDL: " ^ e); exit 2
  | _ -> ();
  end;
  let (w, r) = match Sdl.create_window_and_renderer ~w:640 ~h:480 Sdl.Window.shown with
  | Error (`Msg e) -> prerr_endline ("Could not create window and renderer: " ^ e); exit 2
  | Ok (w, r) -> (w, r) in
  (* render function *)
  Sdl.quit ();
  Gc.compact ()
```

The `Sdl.init` line initializes `SDL`, and is an equivalent to `SDL.Init(SDL_INIT_EVERYTHING);`. When it goes wrong, the error was printed, and the program quits. The initialization was followed by a window __and__ renderer creation. Isn't that cool? Of course if you are not as lazy as me, you can always call them separately:

```ocaml
  let w = match Sdl.create_window "Window title" ~w:640 ~h:480 w_props with
  | Error (`Msg e) -> (* handle the error *) exit 2;
  | Ok w -> w in
  let r = match Sdl.get_renderer w with
  | Error (`Msg e) -> (* handle the error *)
  | Ok r -> r in
  (* render function *)
```

Well, that's a bit too much `match` for me. In anyway you like, a window should be created. And if you want to change the title of that window, you can 

```ocaml
Sdl.set_window_title w "evaders";
```

If we run the program now, there should be a black frame appearing before disappearing real quick. So our next step should be not letting this black frame disappear that quick, aka implementing the game loop!

### The Game Loop

[Here's an awesome article about game loop.](https://gameprogrammingpatterns.com/game-loop.html) Bob Nystorm is really cool! I learned a lot from his book. So go check it out! A game loop, if you are too lazy to read that (or you already know what that is), is basically an endless loop which picks up events and draw stuffs onto the screen. And we are going to make a very simple one, for now:

```ocaml
  ...
  let r = match Sdl.get_renderer w with
  | Error (`Msg e) -> (* handle the error *)
  | Ok r -> r in
  (* render function *)
  let rec loop w r =
    Sdl.pump_events ();
    if Sdl.has_event Sdl.Event.quit then () else
    loop w r in
  loop w r;
  Sdl.quit ();
  ...
```

This is a recursive function which utilises the tail recursive optimization of OCaml, which basically allows it to call itself forever. And inside the loop, we will first call `Sdl.pump_events ()`, which is just an event poll. After that, we will check if the window should close. Simple as that! And when we compile & run it, __BOOM__! a black window that's not gonna close itself anytime soon!

![Empty window](/assets/evaders/empty.png)

And try hitting the red cross button. The program finishes! What's gonna happen next?

### Texture Loading

Texture Loading! But before that, we will need an additional function named `unwrap`, and it should be placed before `let _` (or wherever you like, just before other `unwrap` function calls):

```ocaml
open Tsdl

let unwrap what =
  match what with
  | Error (`Msg e) -> prerr_endline ("Unwrap failed: " ^ e); exit 2
  | Ok w -> w

let _ =
  (* snip *)
```

As texture loading contains bunch of exceptions and stuffs, this function can really compactify the code. Such as all initialization function calls could now be replaced by:

```ocaml
(* snip *)
let _ =
  unwrap (Sdl.init Sdl.Init.everything);
  let (w, r) = unwrap (Sdl.create_window_and_renderer ~w:640 ~h:480 Sdl.Window.shown) in
  (* snip *)
```

I mean, if any of these goes wrong, there is no way for the game to survive, right? And now, here's an ~~awesome~~ awful texture I drew which consists of __2__ sprites!

<img src="/assets/evaders/planes.bmp" width="512px" height="256px" alt="planes" style="image-rendering: pixelated">

The white plane, obviously the good guy, should evade hordes of red planes. Those are the rules! And now, to load it into the game, we add those before the game loop:

```ocaml
(* snip *)
let (w, r) = unwrap (Sdl.create_window_and_renderer ~w:640 ~h:480 Sdl.Window.shown) in
let plane_surfaces = unwrap (Sdl.load_bmp "assets/planes.bmp") in
let plane_textures = unwrap (Sdl.create_texture_from_surface r plane_surfaces) in

let rec loop w r =
(* snip *)
```

The path is relative. I created a folder named `assets`, and put the `planes.bmp` inside, but it is up to you really. And to test the loaded texture, we are going to test render it.

```ocaml
(* snip *)
let rec loop w r =
  unwrap (Sdl.render_clear r);
  Sdl.pump_events ();
  if Sdl.has_event Sdl.Event.quit then () else (
    unwrap (Sdl.render_copy 
      ~src:(Sdl.Rect.create ~x:0 ~y:0 ~w:16 ~h:16)
      ~dst:(Sdl.Rect.create ~x:10 ~y:10 ~w:16 ~h:16) 
      r plane_textures);
    Sdl.render_present r;
    loop w r 
  ) in
loop w r;
(* snip *)
```

See? `unwrap`s everywhere! That is quite useful. Of course you could use `ignore`, but that's not as cool as `unwrap`, as `unwrap` could notice errors. Compile and run it and here's what you should be able to see:

![White plane here](/assets/evaders/white.plane.png)

Yay!

### Move Around

And now we are getting closer to core aspects of this game: to be able to move around. First, we need to define a data type for the plane on top of our main entry:

```ocaml
type plane = { mutable x: float; mutable y: float }

let _ =
  (* snip *)
```

They are mutable so they could be changed. Sweet! And now, we can define the player before our game loop. We also want to define the speed of the player:

```ocaml
(* put this after the texture load, or whatever *)
let player = { x = 314.0; y = 450.0 } in
let speed = 128.0 in
```

and as `Sdl.render_copy` only accepts __integer rect__, we need to add a `round` function to manually round up the numbers, so the plane doesn't move that jaggy. You can also use `int_of_float`, as 1 pixel really doens't make that much of a difference.

```ocaml
let round x = (int_of_float (floor (x +. 0.5)))
(* snip *)
```

And here's how we are going to refine our `Sdl.render_copy` code of our previous section:

```ocaml
unwrap (Sdl.render_copy 
        ~src:(Sdl.Rect.create ~x:0 ~y:0 ~w:16 ~h:16)
        ~dst:(Sdl.Rect.create ~x:(round player.x) ~y:(round player.y) ~w:16 ~h:16) 
        r plane_textures);
```

Compile & run it, and the player should be at the near bottom of the screen now. Change the `player`'s data to see how it teleports around.

![Bottom](/assets/evaders/bottom.png)

And now, as the plane thing needs to move around, we will want it to be moving at a steady speed. In order to achieve that, we could implement either a delta time system, or just delay a little bit each loop for a 60fps effect. I am going for the delta time here, as I am familiar with that, and implementing one isn't that hard. We just need to add this before the game loop:

```ocaml
let last_instant = ref (gettimeofday ()) in
(* snip *)
```

And add those at the beginning of the game loop:

```ocaml
let rec loop w r =
  let this_instant = gettimeofday () in
  let delta_time = this_instant -. !last_instant in
  last_instant := this_instant;
  (* snip *)
```

And the delta time system is done!

Now we have both the plane position and a delta time system. The next thing will be implementing the real moving around! And that's quite easy. I am just going to present my `loop` to you, and you will understand in an instant:

```ocaml
let rec loop w r =
  let this_instant = gettimeofday () in
  let delta_time = this_instant -. !last_instant in
  last_instant := this_instant;
  unwrap (Sdl.render_clear r);
  Sdl.pump_events ();
  if Sdl.has_event Sdl.Event.quit then () else (
    let keyboard_states = Sdl.get_keyboard_state () in
    if keyboard_states.{Sdl.Scancode.w} = 1 then (
      player.y <- player.y -. delta_time *. speed
    );
    if keyboard_states.{Sdl.Scancode.a} = 1 then (
      player.x <- player.x -. delta_time *. speed
    );
    if keyboard_states.{Sdl.Scancode.s} = 1 then (
      player.y <- player.y +. delta_time *. speed
    );
    if keyboard_states.{Sdl.Scancode.d} = 1 then (
      player.x <- player.x +. delta_time *. speed
    );
    unwrap (Sdl.render_copy 
      ~src:(Sdl.Rect.create ~x:0 ~y:0 ~w:16 ~h:16)
      ~dst:(Sdl.Rect.create ~x:(round player.x) ~y:(round player.y) ~w:16 ~h:16) 
      r plane_textures);
    Sdl.render_present r;
    loop w r
  ) in
```

So, whenever W is pressed, the player's y is decreased by speed * delta time. The same goes for A, S and D. So it's quite obvious now that WASD moves around, right? You can totally check it out!

### Enemies

Moving around wih no obvious targets isn't what we are going for here. We need enemies to destroy this plane! To do that, we can add our very first eneny, and encase it in a list:

```ocaml
(* snip *)
let speed = 128.0 in
let enemies = ref [{ x = (Random.float 640.0); y = 0.0 }] in
let last_instant = ref (gettimeofday ()) in
(* snip *)
```

Enemies come from the very top of the screen. Now, in the game loop, we need to render the enemy so that we can see it:

```ocaml
(* snip *)
unwrap (Sdl.render_copy 
  ~src:(Sdl.Rect.create ~x:0 ~y:0 ~w:16 ~h:16)
  ~dst:(Sdl.Rect.create ~x:(round player.x) ~y:(round player.y) ~w:16 ~h:16) 
  r plane_textures);
List.iter(fun enemy -> (
  (* move enemy... *)
  unwrap (Sdl.render_copy 
  ~src:(Sdl.Rect.create ~x:16 ~y:0 ~w:16 ~h:16)
  ~dst:(Sdl.Rect.create ~x:(round enemy.x) ~y:(round enemy.y) ~w:16 ~h:16) 
  r plane_textures);
)) !enemies;
```

Note now the source rect changed and become (16, 0). That's the enemy sprite. We also need to move the enemy down, otherwise it will just sit there & do nothing:

```
List.iter(fun enemy -> (
  enemy.y <- enemy.y +. delta_time *. speed;
  unwrap (Sdl.render_copy 
  ~src:(Sdl.Rect.create ~x:16 ~y:0 ~w:16 ~h:16)
  ~dst:(Sdl.Rect.create ~x:(round enemy.x) ~y:(round enemy.y) ~w:16 ~h:16) 
  r plane_textures);
```

And when you run the game, you can see one enemy heading downwards. Easy as that!

![Incoming!!](/assets/evaders/incoming.png)

### Enemy Generation

The game has been quite easy with only __one__ enemy. And after it goes out of the screen, there is no more coming. Not funny! So, let's add a couple of rules here:

1. At first there's only one enemy
2. When one enemy's dead, the revenge meter will add one
3. For every (0.1s - revenge meter), two enemies are spawned, and the revenge meter will minus one

Cool, right? So as more enemies failed, more enemies will come! HA HA HAA! And here's how we are going to do it. First, we add two variables before the game loop:

```ocaml
let accu = ref 0.0 in
let revenge = ref 0 in
```

And `accu` was increased by `delta_time` every loop:

```ocaml
let this_instant = gettimeofday () in
let delta_time = this_instant -. !last_instant in
last_instant := this_instant;
accu := !accu +. delta_time;
unwrap (Sdl.render_clear r);
```

When one enemy was out of bounds, the revenge meter goes up. We also filter away the out of bounds enemy:

```ocaml
List.iter(fun enemy -> (
  enemy.y <- enemy.y +. delta_time *. speed;
  unwrap (Sdl.render_copy 
  ~src:(Sdl.Rect.create ~x:16 ~y:0 ~w:16 ~h:16)
  ~dst:(Sdl.Rect.create ~x:(round enemy.x) ~y:(round enemy.y) ~w:16 ~h:16) 
  r plane_textures);
)) !enemies;
enemies := List.filter (fun enemy ->
  if enemy.y > 500.0 then (
    revenge := !revenge + 1;
    false
  ) else true
) !enemies;
```

After `filter`ing, dead enemies are gone, and revenge meter goes up.

The enemy generation follows after `filter`:

```ocaml
if !accu > (0.1 -. ((float !revenge) /. 1000.0 *. 0.1)) then (
  if !revenge > 0 then (
    enemies := { x = (Random.float 640.0); y = 0.0 }::
    { x = (Random.float 640.0); y = 0.0 }::!(enemies);
    revenge := !revenge - 1;
  );
  accu := 0.0;
);
```

And when we run it, enemies will begin to revenge their dead comrades! They will go wave after wave, until there is so many enemies that wave does not matter anymore:

![Revenge](/assets/evaders/revenge.png)

### Death Condition

So there are hordes of enemies now. But the player still does not have the ability to die! It is invincible. However as we are approaching the end now, that becomes quite easy. We just need to add an intersection check. Adding it into our enemy update & render phase, and it should look like this:

```ocaml
let player_rect = Sdl.Rect.create ~x:(round player.x) ~y:(round player.y) ~w:16 ~h:16 in
List.iter(fun enemy -> (
  enemy.y <- enemy.y +. delta_time *. speed;
  let enemy_rect = Sdl.Rect.create ~x:(round enemy.x) ~y:(round enemy.y) ~w:16 ~h:16 in
  if Sdl.has_intersection player_rect enemy_rect then (
    (* Whoops! You are dead! *)
  );
  unwrap (Sdl.render_copy 
  ~src:(Sdl.Rect.create ~x:16 ~y:0 ~w:16 ~h:16)
  ~dst:enemy_rect
  r plane_textures);
)) !enemies;
```

Again, as we are approaching to the end now, I am going to be lazy. The game, once over, simply quits and prints out the score. That's why we need yet another variable before the game loop:

```ocaml
(* snip *)
let revenge = ref 0 in
let alive = ref true in
let rec loop w r =
(* snip *)
```

And the condition to end the loop now becomes:

```ocaml
if Sdl.has_event Sdl.Event.quit || not !alive then () else (
```

Finally, after the loop is done, we prints out the revenge meter. You can also print out all enemies killed, whatever.

```ocaml
(* snip *)
loop w r;
print_endline ("Game over! Your score: " ^ ((string_of_int !revenge)));
Sdl.quit ();
(* snip *)
```

... And thy game is done!

![4s? Really?](/assets/evaders/dead.png)

## Complete Source

Woah! Can't believe I finished this in an afternoon! This must be a very low-quality post. Anyway, read it at your leisure. Here's the full, ugly, very imperative implementation:

```ocaml
open Tsdl
open Unix


let unwrap what =
  match what with
  | Error (`Msg e) -> prerr_endline ("Unwrap failed: " ^ e); exit 2
  | Ok w -> w

let round x = (int_of_float (floor (x +. 0.5)))

type plane = { mutable x: float; mutable y: float; }

let _ =
  unwrap (Sdl.init Sdl.Init.everything);
  let (w, r) = unwrap (Sdl.create_window_and_renderer ~w:640 ~h:480 Sdl.Window.shown) in
  let plane_surfaces = unwrap (Sdl.load_bmp "assets/planes.bmp") in
  let plane_textures = unwrap (Sdl.create_texture_from_surface r plane_surfaces) in
  Sdl.set_window_title w "evaders";

  Random.init (round (gettimeofday ()));
  let player = { x = 314.0; y = 450.0 } in
  let speed = 128.0 in
  let enemies = ref [{ x = (Random.float 640.0); y = 0.0 }] in
  let last_instant = ref (gettimeofday ()) in
  let accu = ref 0.0 in
  let revenge = ref 0 in
  let alive = ref true in
  let rec loop w r =
    let this_instant = gettimeofday () in
    let delta_time = this_instant -. !last_instant in
    last_instant := this_instant;
    accu := !accu +. delta_time;
    unwrap (Sdl.render_clear r);
    Sdl.pump_events ();
    if Sdl.has_event Sdl.Event.quit || not !alive then () else (
      let keyboard_states = Sdl.get_keyboard_state () in
      if keyboard_states.{Sdl.Scancode.w} = 1 then (
        player.y <- player.y -. delta_time *. speed
      );
      if keyboard_states.{Sdl.Scancode.a} = 1 then (
        player.x <- player.x -. delta_time *. speed
      );
      if keyboard_states.{Sdl.Scancode.s} = 1 then (
        player.y <- player.y +. delta_time *. speed
      );
      if keyboard_states.{Sdl.Scancode.d} = 1 then (
        player.x <- player.x +. delta_time *. speed
      );
      let player_rect = Sdl.Rect.create ~x:(round player.x) ~y:(round player.y) ~w:16 ~h:16 in
      unwrap (Sdl.render_copy 
        ~src:(Sdl.Rect.create ~x:0 ~y:0 ~w:16 ~h:16)
        ~dst:player_rect
        r plane_textures);
      List.iter(fun enemy -> (
        enemy.y <- enemy.y +. delta_time *. speed;
        let enemy_rect = Sdl.Rect.create ~x:(round enemy.x) ~y:(round enemy.y) ~w:16 ~h:16 in
        if Sdl.has_intersection player_rect enemy_rect then (
          alive := false
        );
        unwrap (Sdl.render_copy 
        ~src:(Sdl.Rect.create ~x:16 ~y:0 ~w:16 ~h:16)
        ~dst:enemy_rect
        r plane_textures);
      )) !enemies;
      enemies := List.filter (fun enemy ->
        if enemy.y > 500.0 then (
          revenge := !revenge + 1;
          false
        ) else true
      ) !enemies;
      if !accu > (0.1 -. ((float !revenge) /. 1000.0 *. 0.1)) then (
        if !revenge > 0 then (
          enemies := { x = (Random.float 640.0); y = 0.0 }::
          { x = (Random.float 640.0); y = 0.0 }::!(enemies);
          revenge := !revenge - 1;
        );
        accu := 0.0;
      );
      Sdl.render_present r;
      loop w r
    ) in
  loop w r;
  print_endline ("Game over! Your score: " ^ ((string_of_int !revenge)));
  Sdl.quit ();
  Gc.compact ()
```

The full source repository is [here](https://github.com/42yeah/Evaders.OCaml). You can check it out if you want.

## Conclusion

You might notice there are quite a few differences, as I've changed a lot of things on the flight. If there aren't, lucky me! 

OCaml is a very beautiful and elegant language. I am sorry I abused it in such an ugly way. Truth is, I just started learning it, and that's why I need those little exercises. Another reason would be little to none documentation & community tutorials. But this is one cool hidden gem, and it is really, really cool! I hope I can really get the gist of it one day, and dive into a huge, diverse ML family.

## References

1. [OCaml](https://ocaml.org/)
2. [TSDL, Thin SDL Layer](https://github.com/dbuenzli/tsdl/)
3. [OPAM, OCaml Package Manager](https://opam.ocaml.org/)
4. [Dune, A Composable Build System For OCaml](https://github.com/ocaml/dune)
5. [Game Programming Patterns, Robert Nystorm](https://gameprogrammingpatterns.com)
6. [SDL, Simple Directmedia Layer](https://www.libsdl.org/)
7. [Full GitHub source code](https://github.com/42yeah/Evaders.OCaml)
