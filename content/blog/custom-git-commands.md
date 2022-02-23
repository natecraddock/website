+++
title = "The Missing Documentation for Git Custom Commands"
date = 2022-02-22T17:41:44-07:00
draft = false
tags = ["git", "fish", "linux", "tools"]
+++

I recently learned about an undocumented feature of [Git](https://git-scm.com/)
that I wish I had known about much sooner: the ability to create custom
commands. I have known about [Git
aliases](https://git-scm.com/book/en/v2/Git-Basics-Git-Aliases) for a while now,
but custom commands go beyond what aliases can do.

If my search engine skills have failed me and this *is* in fact documented
somewhere outside the source code, I would love to know!

I first learned about Git custom commands while looking through
[matze/git-utils](https://github.com/matze/git-utils) on GitHub, which provides
`git pick` as a custom command presenting an interactive display for
cherry-picking. Curious, I started looking into how Git knew to run the
`git-pick` binary when running `git pick`.

Per [this superuser.com](https://superuser.com/a/1418573) answer, there is no
documentation for git custom commands. Searching online for "Git custom
commands" will pull up several webpages that explain how to make a custom Git
command. These were helpful for me in learning how to to make my own custom
command, but they left me wondering how it worked and where it was documented,
if anywhere. I think Git custom commands are super powerful and should be more
well known, so I'm writing this to both increase the exposure of this feature of
Git, and to fill in the gaps on how it works.

## How Git dispatches commands

In order to better understand how Git custom commands work, here is a detailed
look at how Git runs commands. If you would rather just learn *how* to make a
custom command, [skip ahead](#writing-a-custom-git-command).

The `git` command is composed of many commands like `log`, `commit`, and
`switch`. Let's step through the most important parts of the source
code[^git-source] to learn how Git runs its commands. I have an alias `git
st` to run `git status`, and we will use that as a working example.

[^git-source]: [Here's a
  link](https://github.com/git/git/blob/e6ebfd0e8cbbd10878070c8a356b5ad1b3ca464e/git.c)
  to the full source code of `git.c` at the time of writing.

The core of git's command processing is in [`static int
run_argv()`](https://github.com/git/git/blob/e6ebfd0e8cbbd10878070c8a356b5ad1b3ca464e/git.c#L767).
Inside a while loop Git first processes builtin commands. To focus on the code
that matters most, I have replicated a *sweetened condensed* version below, with
error and edge-case handling omitted. See the full source for more details.

```c
static int run_argv(int *argcp, const char ***argv)
{
    /* tracks if aliases have been expanded */
    int done_alias = 0;

    while (1) {
        /* if not an alias, try running a builtin command */
        if (!done_alias)
            handle_builtin(*argcp, *argv);

        /* otherwise run the aliased command in a subprocess */
        else if (get_builtin(**argv)) {
            i = run_command(args.v);
            if (i >= 0 || errno != ENOENT)
                exit(i);
            die("could not execute builtin %s", **argv);
        }

        /* not a builtin, try an external (custom) command */
        execv_dashed_external(*argv);

        /* omitted code for expanding aliases */
        if (!handle_alias(argcp, argv))
            break;

        /* alias found, try again */
        done_alias = 1;
    }

    return done_alias;
}
```

To run `git st`, Git first searches through the registered builtin commands
stored in `struct cmd_struct commands[]` for a matching name. The `commands`
array stores the name of the command like `log` or `status`, a function pointer
to the command, and various option flags for the command. If a match is found,
the function pointer is executed in [`static int
run_builtin()`](https://github.com/git/git/blob/e6ebfd0e8cbbd10878070c8a356b5ad1b3ca464e/git.c#L419),
passing in the remaining args to the command.

If no matching command is found, the
[`execv_dashed_external()`](https://github.com/git/git/blob/e6ebfd0e8cbbd10878070c8a356b5ad1b3ca464e/git.c#L721)
function is run. This is where external or custom commands are executed. We will
come back to this in a moment.

If both the builtin and external commands were not found, Git attempts to expand
aliases. After a successful alias expansion the loop restarts and Git attempts
to process the expanded alias. Because of side effects of expanding aliases, it
is no longer safe to invoke builtin functions via the function pointers. For
builtin commands of expanded aliases, Git will spawn a subprocess to handle the
command.

Back to the external commands. Before an attempt to expand aliases, an attempt
is made to run the command as a subprocess. The name of the command is appended
to the string "git-" and via a chain of function calls a subprocess is started
with a call to `execve()` in a forked child.

As a recap, when running `git <name>`:

1. Git first attempts to run the builtin command *name*.
2. If the builtin was not found, Git attempts to run the external command
   "git-*name*".
3. If no external command was found, aliases are expanded and the process
   repeats.

This process can be seen by setting the `GIT_TRACE` variable to true.

```shell
$ GIT_TRACE=true git status
19:56:51.952359 git.c:458               trace: built-in: git status
...
```

With the full command, git just calls the builtin function. Here is the output
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
an example I will recreate the `git pick` command for cherry picking, but
written as a [fish shell](https://fishshell.com) script instead. Here is my
final script, saved as `~/.local/bin/git-pick`.

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
selected, `git cherry-pick` is executed.

![GIF demonstration of the git pick command](/images/git-pick.gif)

I won't go into much more detail because there are
[many](https://www.atlassian.com/git/articles/extending-git)
[other](https://wilsonmar.github.io/git-custom-commands/)
[articles](http://thediscoblog.com/blog/2014/03/29/custom-git-commands-in-3-steps/)
that sufficiently cover this process. Please refer to those or others for more
details on the process!

Arguably Git custom commands aren't the most effective solution. I could instead
rename my `git-pick` command to `pick` and have less to type. Or I could just as
easily run `git-pick` instead of `git pick` to get the same effect. It is
nevertheless satisfying to easily make my own commands that *feel* like they are
part of Git.
