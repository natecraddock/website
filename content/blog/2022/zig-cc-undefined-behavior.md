+++
title = "Catching undefined behavior with zig cc"
date = 2022-03-23T18:57:12-06:00
tags = ["c", "zig", "reckless-drivin"]

aliases = [
    "/blog/zig-cc-undefined-behavior/"
]
+++

I just resolved an issue in [Reckless
Drivin'](https://github.com/natecraddock/open-reckless-drivin) that I struggled
with for two weeks. I figured I would take this opportunity to document the
problem and its solution, and to share two insights from this experience.


## What is `zig cc`?

`zig cc` is a wrapper around the Clang compiler bundled with Zig. Andrew Kelly
explains this thoroughly in [his blog
post](https://andrewkelley.me/post/zig-cc-powerful-drop-in-replacement-gcc-clang.html),
so I won't go into many details. In short `zig cc`
* has outstanding cross-compilation support and
* enables compiling a mixed Zig and C project with only Zig as a dependency.

I rely on the second point to compile a C decompression algorithm alongside my
Zig code.


## The problem

Reckless Drivin' stores all of its game assets compressed by the
[LZRW3-A](https://web.archive.org/web/20181230011418/http://www.ross.net/compression/lzrw3a.html)
algorithm. Part of the initialization process of the game is to decompress all
the assets.

Written in the 1990s, the LZRW3-A algorithm as implemented by Ross Williams is
optimized for speed. The code is full of macros and hand-unrolled loops. Because
of this emphasis on speed, there are no safety checks in the code. If the
decompression function is given an invalid slice of bytes, the algorithm is
likely to crash with a segmentation fault, or worse, return a false positive
successful decompression. Beyond inspecting the output bytes, there is no way
for the caller to guarantee that the decompression was successful.

While I may one day port the LZRW3-A code to Zig to make the algorithm safer, I
wanted to use this as an opportunity to try [Zig's C source code integration
capabilities](https://ziglang.org/learn/overview/#integration-with-c-libraries-without-ffibindings).

I have been working on Reckless Drivin' for almost two years now, and I have
already verified that the decompression code works when called from C. I figured
it would be trivial to connect the library to Zig, but once I had integrated
LZRW3-A with my Zig code, my decompression test cases would fail with `SIGABRT`
illegal instruction errors.

I stepped through the test binaries with `gdb` but was unable to determine why it
would crash. I rewrote the interface between Zig and C multiple times trying to
see if I had a possible bug. I eventually wrote a small C program that tested
the LZRW3-A algorithm in isolation, which worked fine.

My last attempt was to use the `zig cc` compiler on my isolated C program,
rather than `gcc` or `clang`. This executable crashed on illegal instructions
just like my Zig program! Because the Zig project emphasizes catching undefined
behavior I figured there were some compiler flags being enabled in `zig cc` that
weren't by default in `gcc` and `clang`.

At this point I finally decided to ask for help.

A couple of minutes after posting a question on the Zig Discord server,
[Loris Cro](https://kristoff.it) had helpfully referred me to a [FAQ on the Zig
wiki](https://github.com/ziglang/zig/wiki/FAQ#why-do-i-get-illegal-instruction-when-using-with-zig-cc-to-build-c-code).
From the wiki:

> When compiling without `-O2` or `-O3`, Zig infers Debug Mode. Zig passes
> `-fsanitize=undefined -fsanitize-trap=undefined` to Clang in this mode. This
> causes Undefined Behavior to cause an Illegal Instruction.

So my intuition was correct. All I needed to do is pass
`-fno-sanitize=undefined`[^is this good] to the C compiler to prevent undefined
behavior from becoming illegal instructions.

[^is this good]: In my case with Reckless Drivin', I have verified that my
  LZRW3-A decompression works for my dataset, even with undefined behavior.
  Weighing the options, I think it is best to disable the safety checks in the C
  library rather than rewrite LZRW3-A in Zig. Perhaps one day I'll dig into it,
  but it is low priority.

```zig
exe.linkLibC();
exe.addIncludeDir("src/c/");
exe.addCSourceFile("src/c/lzrw.c", &.{
    "-fno-sanitize=undefined",
});
```

When adding a C library to a `build.zig` file, any desired compiler flags can be
passed as an array to `addCSourceFile`.


## The insights

This is why Zig is often considered better at compiling C code than a typical C
compiler! Stephen Gutekanst has a nice writeup on [building GLFW with
Zig](https://devlog.hexops.com/2021/perfecting-glfw-for-zig-and-finding-undefined-behavior)
and running into the exact same problem as me, in his case discovering and
[fixing](https://github.com/glfw/glfw/pull/1986) undefined behavior in GLFW.

So the first thing I learned (and I'm borrowing this from Stephen) is that Zig's
defaults are very good. Even though I am choosing to not fix the undefined
behavior in LZRW3-A, Zig warned me about this by default, something that other
compilers don't do. Zig is making safety both the easy and the default path.

The second lesson is to ask for help! I am guilty of wanting to solve
everything by myself. I don't want to be annoying by asking too many questions
all of the time. But in this case I wrestled with this problem for two weeks
before even thinking to ask for help. Within ten minutes of asking I had an
answer and a solution.

There is definitely a balance here. Too many questions will indeed annoy some
people and hinder the learning process. On the other hand, sometimes all a
problem needs is for someone else to take a look.
