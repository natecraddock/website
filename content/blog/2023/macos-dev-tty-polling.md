+++
title = "macOS doesn't like polling /dev/tty"
description = "Solution for macOS not supporting kqueue or poll for the /dev/tty file and using select instead"
date = 2023-07-11T17:50:03-06:00
tags = ["macos", "programming", "unix"]
+++

macOS (more specifically [Darwin](https://en.wikipedia.org/wiki/Darwin_(operating_system))) doesn't support using [kqueue(2)](https://man.openbsd.org/kqueue.2) or [poll(2)](https://man.openbsd.org/poll.2) to monitor the `/dev/tty` file.[^null] You are required to use [select(2)](https://man.openbsd.org/select.2) or [pselect(2)](https://man.openbsd.org/select.2) instead. [See below](/blog/2023/macos-dev-tty-polling/#possible-solutions) for some possible solutions I am aware of.

[^null]: `/dev/null` ([and maybe other files?](https://github.com/libuv/libuv/commit/731adacad2426d349d4c51ca608184f7e01c93c6)) are also unsupported.

I recently ran into this issue while updating [zf](https://github.com/natecraddock/zf) to support `SIGWINCH` (terminal window resize) signal handling. I couldn't find much information about the `/dev/tty` issue online, so hopefully what I write here will save others the trouble I went through.

## Why use /dev/tty

Many common command line tools read from stdin and write to stdout. The device file [`/dev/tty`](https://man7.org/linux/man-pages/man4/tty.4.html) represents the terminal for the current process. Even if a program has input or output redirected, using the `/dev/tty` file always allows reading or writing to the terminal.

Here's an example shell session that illustrates this:

```bash
$ # execute pwd in a shell
$ bash -c 'pwd'
/Users/nathan

$ # execute pwd in a shell that has stdout redirected to /dev/null (no output)
$ bash > /dev/null -c 'pwd'

$ # this time redirect pwd to explicitly write to the terminal device file /dev/tty
$ bash > /dev/null -c 'pwd > /dev/tty'
/Users/nathan
```

Even though the bash subprocess was redirecting all stdout to `/dev/null`, we were still able to write directly to the terminal with `/dev/tty`.

So why is this useful? Any program that wants to control _both_ the terminal and support I/O redirection needs to use `/dev/tty`.

Example programs that rely on `/dev/tty` include fuzzy finders like fzf or zf. That is why you can run `vim $(fd -tf | fzf)` without issue: fzf will read the list of files on stdin and open the selected file in vim while the interactive fuzzy finding interface uses `/dev/tty` to directly access the terminal.

## macOS makes things difficult

If you only need access to `/dev/tty` in the main loop of your program, then there isn't an issue. Read and write to that file like normal and smile because you don't have to worry about the `/dev/tty` polling problem.

But many programs need to asynchronously monitor events like multiple files, signals, sockets, etc. To monitor multiple events efficiently on macOS you would typically use [kqueue(2)](https://man.openbsd.org/kqueue.2). Sadly, macOS doesn't allow using [kqueue(2)](https://man.openbsd.org/kqueue.2) or even [poll(2)](https://man.openbsd.org/poll.2) to monitor `/dev/tty` events.

I cannot find any authoritative documentation describing this limitation. If there is a good source to document this, please [let me know](mailto:nathan@nathancraddock.com) and I will update this post. Most mentions I found online were issues in open source projects that are in various stages of dealing with this issue: [crossterm](https://github.com/crossterm-rs/crossterm/issues/500) and [helix](https://github.com/helix-editor/helix/pull/996#issuecomment-962518802) for example.[^just-today]

[^just-today]: Coincidentally, there was [an issue](https://github.com/ziglang/zig/issues/16382) created just today on the Zig repository to add a [select(2)](https://man.openbsd.org/select.2) wrapper to the standard library motivated by the `/dev/tty` limitation on macOS. It links to [this wonderful blog post](https://code.saghul.net/2016/05/libuv-internals-the-osx-select2-trick/) which I would have loved to find sooner.

    I had already written a draft of this post so I figured I would share it anyway. I struggled to find information on this issue, and it doesn't hurt to put more out there in case it helps others.

If you want to poll `/dev/tty` on macOS, you must use [select(2)](https://man.openbsd.org/select.2) or [pselect(2)](https://man.openbsd.org/select.2). These functions have limitations, primarily being the max file descriptor number they can monitor. From the [Linux `select(2)` manual page](https://www.man7.org/linux/man-pages/man2/select.2.html#DESCRIPTION):

> WARNING: `select()` can monitor only file descriptors numbers that are less than `FD_SETSIZE` (1024)—an unreasonably low limit
> for many modern applications—and this limitation will not change. All modern applications should instead use `poll(2)` or
> `epoll(7)`, which do not suffer this limitation.

Another limitation is that [kqueue(2)](https://man.openbsd.org/kqueue.2) offers built-in support for monitoring signals, file vnode events (update, rename, etc.), while [select(2)](https://man.openbsd.org/select.2) only supports file descriptors.

## Possible solutions

Here are some ideas on how to work around these limitations:

* On macOS you can define `_DARWIN_UNLIMITED_SELECT` to bypass the file descriptor limit, but this isn't portable.

* For me, a max file descriptor limit is not an issue because zf shouldn't require file descriptors anywhere near the limit of 1024. To handle `/dev/tty` events and `SIGWINCH` I am using [pselect(2)](https://man.openbsd.org/select.2), which is explained well in this [LWN.net article](https://lwn.net/Articles/176911/). This relies on [pselect(2)](https://man.openbsd.org/select.2) being more predictable with signal handling by atomically masking signals and waiting at the kernel level.

* An alternative when [pselect(2)](https://man.openbsd.org/select.2) is not available is the [self-pipe trick](https://man7.org/tlpi/code/online/dist/altio/self_pipe.c.html). This uses a non-blocking pipe in a signal handler that writes a byte. The read end of the pipe is monitored by [select(2)](https://man.openbsd.org/select.2).

* [libuv](https://libuv.org) is an example of a library that needs to support large file descriptor numbers, and also offers support for `/dev/tty`. To do this they create a separate thread that uses [select(2)](https://man.openbsd.org/select.2) and the self-pipe trick to communicate with the main event loop. See [this blog post](https://code.saghul.net/2016/05/libuv-internals-the-osx-select2-trick/) or [this commit](https://github.com/libuv/libuv/commit/731adacad2426d349d4c51ca608184f7e01c93c6) for more details. You could also use libuv or another similar library directly.

Hopefully this helps point you in the right direction if you are struggling with this problem like I was!
