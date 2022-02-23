+++
title = "Exploring the Inner-workings of Custom Git Commands"
date = 2022-02-23T08:29:32-07:00
draft = false
tags = ["git", "fish", "tools"]
+++

Git allows creating custom commands, but this feature is undocumented. I have
known about [Git aliases](https://git-scm.com/book/en/v2/Git-Basics-Git-Aliases)
for a while now, but custom commands go a little beyond what aliases can
do.[^caveat]

[^caveat]: As I discuss later, a Git command isn't *that* special, just a
  way to run an executable on your path. Also, aliases starting with a
  `!` will be run as a shell command which is *similar* to custom commands.

I recently encountered Git custom commands while looking through
[matze/git-utils](https://github.com/matze/git-utils) on GitHub, which provides
`git pick` as a custom command presenting an interactive display for
cherry-picking. Curious, I started looking into how Git knew to run the
`git-pick` binary when running `git pick`.

Searching online for "Git custom commands" will pull up several webpages that
explain how to make a custom Git command. These were helpful for me in learning
how to make my own custom command, but they left me wondering how it worked and
where it was documented, if anywhere. According to [this Stack Overflow
question](https://stackoverflow.com/questions/10978257/extending-git-functionality),
there is no documentation for custom commands besides the source code. I find
Git custom commands useful, and think they should be more well known, so I'm
writing this post to both increase the exposure of this feature of Git, and to
fill in the gaps on how it works.

If my search engine skills have failed me and this *is* in fact documented
somewhere outside the source code, I would love to know!

## How Git runs commands

In order to better understand how Git custom commands work, this section
contains a detailed look at how Git runs commands. If you would rather just
learn *how* to make a custom command, [skip
ahead](#writing-a-custom-git-command).

The core of Git's command processing is in [`static int
run_argv()`](https://github.com/git/git/blob/e6ebfd0e8cbbd10878070c8a356b5ad1b3ca464e/git.c#L767)
in
[`git.c`](https://github.com/git/git/blob/e6ebfd0e8cbbd10878070c8a356b5ad1b3ca464e/git.c).
To focus on the code that matters most, I have replicated a *sweetened
condensed* version below, with most error and edge-case handling omitted, and a
few rewritten lines for clarity. See the full source for more details.

```c
static int run_argv(int *argcp, const char ***argv)
{
    /* tracks if aliases have been expanded */
    int done_alias = 0;

    while (1) {
        if (!done_alias) {
            /* if not an alias, try running a builtin command */
            handle_builtin(*argcp, *argv);
        }
        else if (get_builtin(**argv)) {
            /* otherwise run the aliased command in a subprocess */
            run_command(*argv);
        }

        /* not a builtin, try an external (custom) command */
        execv_dashed_external(*argv);

        /* omitted code for expanding aliases */
        if (!handle_alias(argcp, argv)) {
            /* no alias to expand, invalid command */
            break;
        }

        /* alias found, try again */
        done_alias = 1;
    }

    return done_alias;
}
```

I have an alias `git st` to run `git status`, and we will use that as a working
example when walking through this code. Here is what happens when I run `git
st`.

Because no alias has been expanded yet, `handle_builtin()` will be called.
Inside this function Git searches through the registered builtin commands stored
in `struct cmd_struct commands[]` for a matching name. The `commands` array
stores the name of the command like `log` or `status`, a function pointer to the
command, and various option flags for the command. If a match is found, the
function pointer is executed in [`static int
run_builtin()`](https://github.com/git/git/blob/e6ebfd0e8cbbd10878070c8a356b5ad1b3ca464e/git.c#L419),
passing in any arguments to the command. In our case, `st` isn't recognized as a
builtin command, so `handle_builtin()` will return without calling `exit()`,
allowing the remainder of `run_argv()` to continue.

If no matching builtin command is found, the
[`execv_dashed_external()`](https://github.com/git/git/blob/e6ebfd0e8cbbd10878070c8a356b5ad1b3ca464e/git.c#L721)
function is run. This is where external or custom commands are executed. The
name of the command is appended to the string `git-` and a subprocess is started
with a call to `execve()` in a forked child. Here an attempt to execute `git-st`
will fail and continue onto alias expansion.

If no external command is found, Git attempts to expand any aliases. After a
successful alias expansion the while loop restarts and Git attempts to process
the expanded command. Because of side effects of expanding aliases, it is no
longer safe to invoke builtin functions via the function pointers.[^comment] For
builtin commands of expanded aliases, Git will spawn a subprocess to handle the
command. Here `st` will expand to `status`. This is recognized as a builtin
command, and a subprocess will be spawned to run `git status`.

[^comment]: This information is from a comment in `run_argv()`. I'm not exactly
  sure why this would cause issues.

As a recap, when running `git <name>`:

1. Git first attempts to run the builtin command *name*.
2. If the builtin was not found, Git attempts to run the external command
   "git-*name*".
3. If no external command was found, aliases are expanded and the process
   repeats.
4. Both external commands and expanded aliases are run as subprocesses.

This process can be seen by setting the `GIT_TRACE` environment variable to
true.

```shell
$ GIT_TRACE=true git status
19:56:51.952359 git.c:458               trace: built-in: git status
...
```

With the full command, Git simply calls the builtin function. Here is the output
from running my `git st` alias.

```shell
$ GIT_TRACE=true git st
19:57:46.125010 git.c:745               trace: exec: git-st
19:57:46.125057 run-command.c:654       trace: run_command: git-st
19:57:46.125216 git.c:396               trace: alias expansion: st => status
19:57:46.125227 git.c:806               trace: exec: git status
19:57:46.125232 run-command.c:654       trace: run_command: git status
19:57:46.126791 git.c:458               trace: built-in: git status
...
```

With an alias, an attempt to exec the nonexistent `git-st` command is made. Then
"st" is expanded to "status" and `git status` is made with an `execve()` call.
The final log line is output from the subprocess, reflecting the same output as
running `git status` in the previous example.

I found this process very interesting, and it helps to understand how Git
handles custom commands before writing your own.

## Writing a custom Git command

A custom Git command is an executable on your PATH that starts with `git-`.
That's it. So long as the file can be located and is executable, the contents of
the file do not matter, nor does the programming language.

The example that first taught me about custom commands
([matze/git-utils](https://github.com/matze/git-utils)) is written in Rust. As
an example I will recreate the basics of matze's `git pick` command for cherry
picking, but written as a [fish shell](https://fishshell.com) script instead.
Here is my final script, saved as `~/.local/bin/git-pick`.

```fish
#!/usr/bin/env fish
if test -z "$argv"
    echo "usage: git pick [branch]"
    exit 1
end

set hash (git log -n 100 --format=reference $argv | zf --plain --keep-order | cut -f1 -d" ")

if test -n "$hash"
    git cherry-pick $hash
end
```

This script pipes the output of `git log` to my [zf fuzzy
finder](https://github.com/natecraddock/zf) to select a hash. If a hash was
selected, `git cherry-pick` is executed. With this `git-pick` script on my PATH,
running `git pick` will execute this script. Here's a short demo:

![GIF demonstration of the git pick command](/images/git-pick.gif)

I also wrote fish completions for `git pick` so I can get branch
suggestions on `tab`.

I won't go into more detail because there are
[many](https://www.atlassian.com/git/articles/extending-git)
[other](https://wilsonmar.github.io/git-custom-commands/)
[articles](http://thediscoblog.com/blog/2014/03/29/custom-git-commands-in-3-steps/)
that sufficiently cover this process. Please refer to those or others for more
information!

## Thoughts

Arguably Git custom commands aren't the most effective solution. I could instead
rename my `git-pick` command to `pick` and have less to type. Or I could just as
easily run `git-pick` instead of `git pick` to get the same effect. It is
nevertheless satisfying to easily make my own commands that *feel* like they are
part of Git. Additionally, if I create a `git-pick` man page, running `git pick
--help` will show the man page for help.

On the other hand, Git does provide support for external commands. This isn't
just a side effect, it seems to be intentional based on the function names in
the code. Overall, I appreciate that Git offers this feature. It allows
extension of the core Git tools in a way that feels native, regardless of the
actual utility of the final result.
