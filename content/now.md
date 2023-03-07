+++
title = "Now"
type = "plain"
lastmod = 2023-03-07
+++

## Now

Here are the projects I'm focused on right now

### zf

[zf](https://github.com/natecraddock/zf) is a terminal fuzzy finder written in
Zig. For a few years now I have tried to use fzf and fzy, but a few small
annoyances were enough of an excuse to write my own! The fuzzy finder is
minimalist compared to fzf, and has an algorithm optimized for matching filepaths.

I'm currently making zf even more powerful for path matching, and adding some new UI features.

### ziglua

[Ziglua](https://github.com/natecraddock/ziglua) is a full wrapper around Lua 5.1
through 5.4 in Zig. It exposes the entire C API in idiomatic Zig. It is fully documented now and ready to use!

### Open Reckless Drivin'

A reimplementation a Macintosh game from the early 2000s by Jonas Echterhoff. I
sometimes [write about interesting things I learn](/tags/reckless-drivin)
related to this project on my blog.

Now that the Zig compiler bugs are resolved, I'll be getting back to this project soon.
My first goal is to remove SDL2 and use [raylib](https://www.raylib.com) for graphics so the
game can be more easily statically linked. Raylib is also smaller and I'm interested in learning it.

## Past

These are things that I'm no longer actively focused on, but still update from time to time.

### Neovim Plugins

I maintain a couple of Neovim plugins. I don't actually use the editor anymore,
but I had the foresight to make the plugins simple enough that it really isn't
a maintenance burden to keep the repos up. I still get people starring them
regularly, so I guess the plugins are a sort of success?
* [telescope-zf-native.nvim](https://github.com/natecraddock/telescope-zf-native.nvim)
* [workspaces.nvim](https://github.com/natecraddock/workspaces.nvim)
* [sessions.nvim](https://github.com/natecraddock/sessions.nvim)
