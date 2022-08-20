+++
title = "Open Reckless Drivin'"
date = 2021-08-09T17:58:55-06:00
draft = false
tags = ["reckless-drivin", "c", "programming", "reversing", "games"]

aliases = [
  "/posts/reckless-drivin-cleanup/",
  "/blog/reckless-drivin-cleanup/",
  "/posts/reckless-drivin-decompression/",
  "/blog/reckless-drivin-decompression/",
  "/posts/reckless-drivin-decryption/",
  "/blog/reckless-drivin-decryption/",
  "/blog/open-reckless-drivin/"
]
+++

This is the second time I have started writing about [Open Reckless
Drivin'](https://github.com/natecraddock/open-reckless-drivin), my attempt to
reimplement Jonas Echterhoff's Macintosh racing game. In my first blog posts
(which I have deleted[^1]), I attempted to describe the process of rewriting the
game's code in as much detail as possible. That was the wrong choice for many
reasons, but mostly because my desire to share each step of the journey required
enough effort to discourage me from writing as frequently as I wanted.

[^1]: I made sure to redirect the deleted post URLs to this page, in case there
was actually anyone following along before I started sharing these posts.

So I have started again with the goal to write more frequently, and not be
focused on explaining everything that I do (the commit logs are better suited to
that task anyway). Instead I will focus on what I find most interesting in the
process of understanding and rewriting C code originally intended for PowerPC
Macs. I hope this leads to more interesting posts. Besides, who really wants to
read about restructuring a project from CodeWarrior to CMake and replacing
Macintosh-specific types like `UInt32` anyway?

## An Introduction to Reckless Drivin'

Reckless Drivin' is a simple top-down racing game created in 2000 by Jonas
Echterhoff. The goal of the game is simple: drive to the end of the level as
fast as you can, doing as much damage to other vehicles as possible, while
avoiding the police. Originally released as shareware on the Macintosh, Jonas
later released the game for free once he no longer found the time to update it
for newer graphics cards. The last released version and a free registration code
can be found on the [game's
website](http://jonasechterhoff.com/Reckless_Drivin.html). An archived
[interview](https://web.archive.org/web/20090417081552/http://www.coolmacintosh.com/jonasinterview.html)
with Jonas claims that the game had over 140,000 downloads by the year 2002.

![Reckless Drivin' menu](/images/reckless-drivin-menu.jpg)

I enjoyed playing the game on my dad's Apple PowerBook G4 when I was younger,
but I could only play the first three levels because we hadn't purchased the
game. Years later when my dad gave me the laptop I found the free registration
information Jonas had released and I was able to play all ten levels. That
laptop is long gone, but Reckless' Drivin remains one of my favorite games. Even
though Reckless Drivin' is simple, the homemade charm of the graphics and sound
effects will always be a great childhood memory.

During the summer of 2020 I had the idea to try reverse engineering the Reckless
Drivin' binary so I could play the game again. Not knowing how difficult that
task would be I started learning some reverse engineering basics. In this
searching I stumbled across [a GitHub
repository](https://github.com/jechter/RecklessDrivin), where Jonas had uploaded
the original source code for Reckless Drivin v1.4.4 the year before. This made
reversing the game a more reachable goal, and I immediately cloned and started
cleaning up the code. Thank you Jonas for open-sourcing the game!

## The Road to Open Reckless Drivin'

I'm writing this post over a year later, with many of the difficult
reimplementation tasks completed. I plan to write some posts in the coming days
on the following topics that I found most interesting in the last year of
development.

* Reading the LZRW compressed game data (levels, sprites, sounds, etc.) from the
  resource fork.
* Decrypting the levels and generating valid registration codes.
* Writing a basic QuickDraw image reader.

There is still a ton of work left before Open Reckless Drivin' is playable.
Currently the game loads the preferences file from disk, reads the game data
into memory, and checks for valid registration information. I am in the process
of implementing the game loop, starting with drawing sprites to the screen with
SDL. If you are interested in helping, and aren't intimidated by the idea of
grokking an old codebase loaded with Hungarian notation globals, then feel free
to contribute!

I hope to post more updates of the project's status here. This time
I'll take care to only share what's interesting rather than overwhelming myself
with the goal of sharing everything! 😄
