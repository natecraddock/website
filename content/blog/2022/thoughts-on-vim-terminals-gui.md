+++
title = "My thoughts on Vim, terminals, and GUI editors"
date = 2022-05-18T20:28:16-06:00
tags = ["neovim", "tools", "editors", "rant"]
+++

Since investing time last year to _really_ learning vim, I find it hard to go
back to other editors.

It's not that I find vim more _efficient_ or that I think using vim makes me
more efficient. Rather, I think the vim editing language is well-suited to its
task. It was (and is) designed by people who want to edit text.

But I have a problem with vim: **it is tied to a terminal**.

Now, terminals are not without their benefits. They are:
* commonplace
* usually lightweight
* accessible remotely over ssh
* arguably simple (a grid of characters)

So vim in a terminal _is_ very handy as a developer. Pop onto a remote machine
and fire up vim (nearly always installed!) to make a quick edit. I do this all
the time for my homelab machine.

But when I sit down to write code for more than a quick edit, the vim
environment has always felt sort of clumsy to me. Maybe it has to do something
with my use of many GUI editors (notepad++, Atom, Sublime, VSCode, etc.) before
moving to vim. But over the last few months my brain has wandered often on what
I think would be the _perfect_ editor, and it certainly isn't a terminal running
vim.

So here's my rambling thoughts on vim, editors, terminals, and GUIs. I'm not
going to try to back up anything I say, just write my opinions. I am not writing
to convince anyone I'm right either. Maybe someone will enjoy these thoughts,
but more likely they will be lost in the abyss of the internet. At the very
least, I have written them down and got them out of my head so I can focus on
other things. Perhaps one day I will make these thoughts a reality.

## Vim

Let's talk about bindings. This has been beaten to death online. Some people
love it, some hate it. I happen to be one of those that enjoy editing text with
vim.

Again, I _don't_ claim that the vim bindings make me overall more efficient. I
just think they make sense. I love composing things like `ci"` to edit a string.
It's almost like a game, learning the vim editing language and trying to get
some action done in the fewest number of keystrokes. I'm by no means a stickler
who never uses `hjkl`, but it's certainly fun to learn new tips and tricks about
vim! If I want to increment the next number in the line, why not use `<c-a>`?
Not necessary, but I think it's fun!

There are some things about vim that I do find truly powerful like macros. I
don't use them super regularly, but I am always grateful when I can compose a
mini program and repeat over several lines to make a tedious edit painless.

And like a good unix tool, I can always make use of shell commands from vim. Vim
doesn't know how to enter an ISO timestamp, but I can always capture the output
of `date -Is` and place it directly in my editor when needed.

I really don't have much else to say here. **I think vim is great for editing
text, and I want to continue using it**.

## The mouse

In some circles, there seems to be a stigma toward using a mouse. With a tiling
window manager, vim, a special browser (or extensions), and plenty of time to
configure and practice, it is possible to forgo a mouse and still use a computer
with amazing efficiency. Sometimes I think this is taken to an extreme. I say
this with respect though. Some tiling WM setups are honestly beautiful works of
art! It's just not for me.

As a teaching assistant I would sometimes watch students as I guided them
through debugging (C++ is not a forgiving learning language!). These students
would slowly use the mouse to select a word or line to delete, or click to move
the cursor a few characters to the right to make an insertion.

The vim side of my brain would sometimes get a bit frustrated. I wished I could
show them the vim replacements for the "slow" mouse edits: `<esc>dd` or
`<esc>t)i"<esc>` for example. But the funny thing is, none of these students
ever turned in an assignment late because "using the mouse wasn't fast enough".

So my brain (and fingers) have learned vim. I even think in vim when I see
other's type. In a nutshell: **I love the vim editing language, and don't want
to go back**. My perfect editor would have _perfect_ vim bindings.

But I also see a second lesson from my experience as a TA: **the mouse is not my
enemy**. These beginning students were taught CLion, and I would use it
alongside them to show how autocomplete, debuggers, formatting, and other
features worked. Throughout teaching I used the IdeaVim plugin for my familiar
vim keys, but I used my mouse to interact with the GUI frequently. Overall this
was a great experience! Clicking the debug icon (rather than memorizing the
shortcut key) perhaps wasted a few seconds of my life, but it worked well
enough, and the students were never lost because they could follow my mouse on
the screen.

So from this I think that an editor with flawless vim bindings, but a
more-or-less typical GUI surrounding the text editing window is a good
combination. I've got more thoughts on _why_ coming up, but I still have a few
things I want to say about the mouse.

In vim (well neovim, but that's really not super important) I use the mouse to
navigate code. It's not that I never use binds like `<c-d>` or `<c-o>` to move
around, but I have always prefered piloting my way around with my mouse. When I
used VSCode I would ctrl+click functions to jump to definition, and click the
`back` button on my mouse to return.

I have bindings to do the same in vim. I use `s` or `S` to vim-sneak around my
file, then `gd` to go to definition, followed by a `<c-t>` to jump back in the
tag stack. But this has always felt like there is more _friction_ than when I
used my mouse for navigation in VSCode. Again, I _love_ vim keys for editing
text, but it seems that for navigation purposes, keyboard shortcuts leave
something to be desired.

Nothing beats a quick `gg` to view the top of a file, but when I am _reading_
code to understand, I am far more comfortable using my mouse.

So back to vim. I _do_ use the mouse for code navigation. I scroll and select
and click. But using a terminal with a mouse is not a perfect experience. While
truly excellent UIs have been developed as part of plugins for neovim, mouse
support is either minimal or nonexistent.

## Terminals

That brings me to terminals.

Terminals and shells are not perfect. The more I learn about escape sequences
the more of an ugly hack it feels like. But it (overall) does work! When I think
of the steps that complex TUI programs like vim go through to draw a UI, it's
pretty incredible.

But being text and cell based, a terminal is severely limited. There are various
extensions for full 24-bit colors, undercurls, and inline image drawing, but
those are exceptions not the rule. As far as I am aware, it isn't possible to
support multiple font faces and/or sizes in a terminal. Drawing any sort of line
or border requires the width of a full character. The list of limitations goes
on.

There are many very powerful plugins I use in neovim to make it feel a bit more
like a proper editor. I have a file tree, a diagnostic list, a fuzzy finder, and
others. I've never gone "all in" on making neovim into an IDE though, I think I
keep things somewhere in the middle.

But while many of these plugins are great, some introduce friction into my
workflow. To navigate my file tree in VSCode I use a mouse, and optionally a
keyboard. In neovim my file tree is keyboard-first. I can open and close folders
and open files with my mouse just fine, but that's the limit. I can't drag and
drop, there isn't a context menu with more actions, etc. It's a great work of
engineering, but at the end of the day it's just a vim text buffer (for better
or worse).

I enjoy an integrated terminal in my editor. But nesting a terminal inside
neovim inside a terminal has some rough edges.

In short: **using vim to make a quick edit to a file in the terminal is great!
Using vim to maintain a project in the terminal is a subpar experience**.

## GUI

So what about a graphical interface makes a better editor? Let's look at my file
tree example again.

In most text editors I can make my editor font a bit larger, with a taller line
spacing, but keep my file tree in a small font with narrow line spacing. A
terminal is entirely incapable of this!

**A GUI is capable at drawing at the pixel level, a terminal can only draw at
the cell/character level**.

So in a GUI you can draw and have full control over the scale and size of the UI
elements. This flexibility, kept within the bounds of some good UI guidelines,
can make a much more pleasant and usable interface. Add to that the capabilities
of an operating system, and there are many fantastic features that are
impossible in a terminal:

* drag and drop integration with the operating system
* resize that isn't tied to a cell grid
* smooth pixel-level scrolling of text
* menu bars and context menus
* non-monospaced fonts for UI elements
* better signifiers of possible actions
  * interface updates on hover
  * scroll bars
  * icons (without a hacked nerdfont)
* etc

Maybe not all of that is _necessary_ for an editor. Some of it might be
addressable at the vim level. One of my biggest frustrations with vim is
proportional scaling with splits. When I split my windows in VSCode, a window
resize tries to keep all splits visible, maintaining the proportions. In vim,
everything just gets scrunched up to the top left. Maybe that can be solved in
vim.

## My perfect editor

So in the context of all those thoughts, here's my dream editor: A simple,
native GUI editor with a vim core. Here's more details on that idea:

I don't think I will ever stop opening vim in my terminal for fast edits. So I
want my editor to perfectly capture my preferred vim bindings (like swapping `0`
and `^` for example) so I can move between the two with less friction.

My editor would be **fast and responsive**. Among all the editors I have tried,
the closest to what I imagine my editor to be is [Lite
XL](https://lite-xl.com/). If you have never tried Lite XL, I suggest you do. I
don't think the editor is perfect, but it's amazing how fast it opens and
initializes! My editor would also open and be usable quickly.

This dream editor would be **opinionated**, or in other words, minimal
configuration if any. If I'm making an editor for myself, most things shouldn't
need a config option, unless it's something I adjust relatively frequently. I
can place any sidebars and panels where I prefer them and not have to worry
about reordering things. That makes the UI more predictable, and also makes it
easier to implement.

I would add just enough features, but no more. Looking at my most-used features
of VSCode and vim, here's what I would want:

* responsive, lightweight, pretty UI
* vim-based editor
* workspace/session tracking
* fuzzy find (files, project text)
* LSP
* debugger
* integrated terminal
* file tree
* window management (tabs, splits)
* statusbar

That is a decent list, but much smaller than most editors. And each feature
would be tailored to my use cases. Some of these even come for free if I
integrate with neovim. Maybe it's more important to say what I _don't_ want.

* Extensions
* Babysitting (Do you trust this directory?)
* IDE-like project management
* Excess color schemes (two is enough)
* Excess configuration
* Electron

Maybe this already exists! I hope so. But if not, I do think it would be fun to
someday make this dream a reality.

## Building this dream editor

At this moment in my life, I don't have the time to build this editor. I think
it would be a very fun and fulfilling project, so I hope to get to it one day.

There are currently
[many](https://github.com/neovim/neovim/wiki/Related-projects#gui) neovim GUI
wrappers. Nearly all are incomplete or are simply a GUI shell around neovim.
Very few have built custom UI elements like a file tree.

I have read neovim's GUI and API docs many times. I think it would be ideal to
design my editor on top of neovim, though I do have some concerns.

If neovim is the owner of the text buffers, but I want a GUI that isn't a simple
replacement of neovim, would there be contention between neovim and the GUI. Who
is in control of what? How much would I implement compared to just reusing what
is already in neovim.

Here is a concrete example. Say I decide my editor should have a terminal window
along the bottom (similar to the default in VSCode). Sending API commands to a
neovim subprocess to open a terminal window is easy. Then I could track this
window from the GUI and show and hide as needed. But what if the user decides to
open a new terminal? Is this something that should be allowed? Or what if the
terminal buffer/window is deleted through Lua or a command? Things could get
messy if I decide to manage neovim windows in a vim-unlike way.

More possible issues:

* How to handle editor tabs (open buffers) when vim has a different (and
  sometimes useful) idea of tabs?
* transient buffers

So this won't be easy.

A possible solution for rogue user commands messing up the layout would be to
disable user commands! A sort of shocking idea, but it could work. The idea here
isn't to make a GUI for vim. It is to make a gui editor with a perfect vim
_editing_ experience. If I find vim commands I need I could expose them in a
sort of command palette like is common in many editors.

Even if I were the only one using the editor these are problems I would want to
solve. It would be very possible to mess things up myself without safeguards.

It's sort of a tradeoff. Would it be more difficult to implement a very good vim
emulation inside an editor, or hack neovim into an editor in ways it was never
designed for? I think the latter, but it could very well be buggy if handled
poorly.

The benefits of using a neovim subprocess over RPC as the core editor: buffers,
editing, character placement, **vim/neovim plugins**, and more are all handled
and would save a lot of implementation work of an editor. My work would be
integration, GUI, and tools like a file tree.

## What about $EDITOR?

There are already a TON of editors, many with vim bindings. So why am I not
completely satisfied with any of them?

* Electron is basically Chrome and is not as fast as a native editor. So that
  rules out VSCode. I won't discount the incredible work of the VSCode team
  though. It's a great editor, and I can very clearly see why it is so popular.
  But if I can get an editor that is more lightweight, with better vim
  integration I'll take it any day.
* Jetbrains products are really great! And IdeaVim is an excellent plugin. But
  some cost money, and are full-blown IDEs. I'm not against spending money, but
  if there is a better free and open source alternative I'll take that. And I'm
  looking for an editor, not an IDE. If I need all those features, I'll use an
  IDE.
* Lots of other editors come close in some ways, but fall short of my dream

Of all the editors, Onivim 2 and Lite XL (perhaps a hybrid of the two) are
probably the closest in spirit to my dream editor. But development appears to
have recently stagnated on Onivim, and the UI isn't very pleasing to me at this
early stage in the project.

And vim emulation plugins, while good, are often lacking in some ways, and can
integrate strangely with the editor.

## End

This was a fun brain-dump to write. I find I write much better in a
conversational tone which is why this reads more like a blog post than a plan to
make an editor.

Which leads me to the purpose of this post. There really isn't a point here. No
lessons learned, just a rant on text editors, vim, GUIs, and terminals. I am
posting this because I think these thoughts are interesting, and I may want to
share them at some point. Having them already public makes that easier.

If people find this, and it somehow makes the rounds on the orange site, I hope
any potential conversations are kept civil. Text editors can be a passionate
topic! :)
