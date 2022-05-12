+++
title = "Moving to Zig"
date = 2022-02-28T15:42:20-07:00
tags = ["reckless-drivin", "c", "zig"]

aliases = [
    "/blog/moving-to-zig/"
]
+++

It has been half a year since I last made a [commit on Reckless
Drivin'](https://github.com/natecraddock/open-reckless-drivin/commit/e98b9e6820091142333ea982caacf18093052b3e).
This is mostly due to being busy with school, but I have also reached a point in
the reimplementation where I need to decide how to draw to the screen. I see two
options:

* Draw to a simple framebuffer.
* Use (and learn) OpenGL.

When making a [CHIP-8 interpreter](https://en.wikipedia.org/wiki/CHIP-8) I used
SDL surfaces, so I am familiar with the basics. The original Reckless Drivin'
game drew to the screen in similar ways, and that was on 2000's hardware, so
there isn't any performance penalty for doing it this way. However, I would like
to learn OpenGL (even if I am only drawing 2D sprites), so I am leaning toward
this route.

This time away from the project has also led me to think about a full rewrite in
[Zig](https://ziglang.org), rather than porting the original C source. Since
learning it last summer I have been using Zig for more and more of my projects.
I really enjoy the language, and that it addresses many of the downsides of C
while still staying simple.

Here are some of the benefits I see for moving to Zig:

* I am currently super excited about Zig, so the more opportunities to write Zig
  code the better!
* I would be indirectly supporting Zig. Working on a larger project like
  Reckless Drivin' is likely to find bugs or areas where Zig can improve, and I
  would love to help.
* Stellar support for cross-compilation. This has already been helpful while
  working on [zf](https://github.com/natecraddock/zf), and I wouldn't want to
  give that up on Reckless Drivin'.
* [mach-glfw](https://github.com/hexops/mach-glfw) bindings for GLFW for better
  typing, errors, slices, packed structs for bit masks, etc. which seems to be a
  more productive developer experience over working directly in C.
* Unit testing integrated into the language.

Downsides:

* More work up front. I expect that converting all the code I have now (loading
  the resource data, decompression, decryption, preferences saving and loading,
  CMake configurations, tests, etc.) will not be a simple task. The improved
  safety of Zig will likely find many bugs I have lingering around (Which is
  good!) and those will take time to fix.
* A rewrite in C would likely stay close to the general structure of the
  original project. A rewrite in Zig might require modifying more of the
  architecture of the code, due to things like the lack of a global allocator.
  This is a good thing, but is again more work.
* Zig is an unstable, changing language. Any language changes would likely
  require making large changes across the project.

After considering the above points for some time, I have decided to rewrite in
Zig![^riiz] While this does mean Open Reckless Drivin' will be farther removed from the
original source from Jonas, I think this is the best option.

So why am I writing this? At this point, I don't think many (or any) people are
following my blog or project closely.[^email] But working in public motivates me
to stick to my goals, which now include rewriting Open Reckless Drivin' in Zig
starting
[today](https://github.com/natecraddock/open-reckless-drivin/commit/bac32b5bab78af42271173990536814e46a3d321)!
Here is the plan:

* The project isn't far enough along to merit making a *new* project, so all
  work will continue in the same repo.
* Work through the code in the same order I did in C. So resource loading,
  decompression, decryption, and preferences loading.
* Once I have made it that far, it will be time to learn OpenGL!

I am excited to see where this goes!

[^riiz]: Seems similar to rewrite it in Rust, so I named my branch riiz for
  rewrite it in Zig!

[^email]: If you are, awesome! Feel free to say hi!
