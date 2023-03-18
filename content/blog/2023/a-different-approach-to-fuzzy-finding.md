+++
title = "A different approach to fuzzy finding"
date = 2023-03-17T00:00:00-07:00
tags = ["programming", "zf", "cli"]
+++

After growing frustrated by various fuzzy finders not being as accurate as I expected, I designed a new [fuzzy finder called zf](https://github.com/natecraddock/zf). I have mentioned zf in passing many times, but until now I haven't taken the time to write about it in detail. In short, zf is a new terminal fuzzy finder with **a ranking algorithm designed specifically for filtering filepaths**. It has been rewarding to develop and use, and perhaps you will enjoy it too!

The rest of this post describes what motivated me to create zf, what makes zf different from other fuzzy finders, and some things I learned along the way.

But first, a short demo video of zf in action:

{{< raw >}}
    <video controls muted width=100%
            src="/videos/zf-demo.mp4">
    </video>
{{< /raw >}}

## Two observations on fuzzy finding

In the summer of 2021 I noticed many of my fuzzy file searches didn't sort the file I wanted as the first result. Motivated by frustration[^frustration] I thought, "surely I can make something better," and I began thinking of alternate algorithms for fuzzy finding.

[^frustration]: Perhaps we can call this frustration-driven-development?

I previously [wrote about my research](https://nathancraddock.com/blog/2021/in-search-of-a-better-finder/) in detail:

> I theorized that prioritizing matches on file names would yield the best results. I figured that in the majority of cases, the queried name would be unique among all other file names. If this is most often the case, then it makes sense to optimize the algorithm to match based on the file name.

To test my theory I analyzed many repositories from GitHub and found that **in a typical codebase the majority of filenames are unique**.

After some experimentation,[^story] I also realized that **most of my fuzzy finding involved files**, so it would make sense to design a fuzzy finder around the use case of filepath matching.

[^story]: I [created a file finder](https://nathancraddock.com/blog/2021/creating-a-better-file-finder/) for Neovim with an algorithm based on my findings. I used this for three months with great success! Then I noticed two issues with my approach: first I was maintaining both the user interface for a file picker and the fuzzy matching algorithm. Second, I couldn't use my algorithm outside of Neovim.

## Designing a filename fuzzy finder

My two observations guided the initial development of zf:

1. Fuzzy finding is most commonly used to filter files
2. Most filenames are unique in a given codebase

Like any typical terminal fuzzy finder, zf accepts a list of newline-separated **candidates** on `stdin`. The selected candidate is written to `stdout`. The **query** is made of space-separated **tokens**. Each query token is ranked separately, and any candidate that does not match all query tokens is discarded.

The algorithm to prioritize filenames is simple. It first attempts a match on the filename. If there is no match, it retries on the full candidate string. If the match was on the filename, it is given a better ranking. This simple behavior alone makes zf much more accurate for filtering by filename. And when there isn't a filename match it fails gracefully and operates just like a typical fuzzy finder.

### Filename matching

Here is an example of zf giving better rankings than other fuzzy finders. Note that although I find zf to give better results than the other fuzzy finders, that doesn't make the alternatives _bad_. These other tools are wonderful projects![^fair]

[^fair]: And to be fair, most fuzzy finders I have tried do find the correct file with 95%+ accuracy. I'm solving for those frustrating edge cases where things don't behave as expected!

The first frustrating fuzzy find I remember is searching for the `GNUMakefile` in Blender's source code. The prefix `GNU` is a bit uncommon, and it throws off both fzf and fzy.[^vscode]

[^vscode]: VSCode gets an award for ranking `GNUMakefile` first though.

```text
$ fd -t f | fzf --height 16 --reverse --info hidden
> makefile
> source/blender/makesdna/DNA_fileglobal_types.h
  source/blender/makesdna/DNA_packedFile_types.h
  source/blender/makesdna/DNA_genfile.h
  source/blender/makesdna/DNA_cachefile_types.h
  source/blender/makesdna/DNA_cachefile_defaults.h
  source/blender/makesdna/DNA_curveprofile_types.h
  source/tools/utils_maintenance/cmake_sort_filelists.py
  source/blender/makesdna/intern/dna_genfile.c
  source/blender/makesrna/intern/rna_cachefile.c
  source/blender/makesrna/intern/rna_packedfile.c
  source/blender/makesrna/intern/rna_curveprofile.c
  build_files/cmake/Modules/FindLevelZero.cmake
  GNUmakefile
  build_files/cmake/Modules/FindLibEpoxy.cmake


$ fd -t f | fzy
> makefile
source/blender/makesdna/DNA_fileglobal_types.h
source/blender/makesdna/DNA_packedFile_types.h
GNUmakefile
source/blender/makesdna/DNA_genfile.h
```

Notice that both fzf and fzy ranked `source/blender/makesdna/DNA_fileglobal_types.h` higher than `GNUMakefile`. I believe this is because `/make` and `_file` in that path are on word boundaries and are ranked higher than `UMakefile` that is not on a word boundary.

On the other hand, zf ranks `GNUMakefile` first.

```text
$ fd -t f | zf
> makefile
GNUmakefile
source/tools/utils_maintenance/cmake_sort_filelists.py
```

Also notice that the second result is `cmake_sort_filelists.py` as well, another _filename_ that matches `makefile`. The other fuzzy finders give higher precedence to the `makesdna/*` and `makesrna/*` paths.

### Space-separated tokens

Although filename priority matching usually works well, there are still plenty of cases where there are similar filenames throughout a project. For example, `__init__.py` files in a Python project. This is why zf treats the query as whitespace separated tokens. It makes narrowing down search results trivial.

Imagine searching for an `__init__.py` file in a Python project.

```text
$ fd -t f | zf
> init
__init__.py
ui/__init__.py
data/__init__.py
config/__init__.py
```

At this point you can either move the selected row down to find `config/__init__.py`, or you can add a new token to the query string.

```text
$ fd -t f | zf
> init c
config/__init__.py
```

Note that feature isn't unique to zf. Most fuzzy finders that I have tried (except fzy) treat the query as whitespace separated tokens. I do think it is important behavior though.

For over a year these two features worked well for me in my fuzzy finding needs. I felt like zf was mostly feature complete. I did add small UI features and other improvements to zf, but the ranking algorithm didn't change much from the first version back in 2021.

But a few months ago I started working on another feature.

## Making filepath matches more accurate

I recently had a discussion with [Pistos on lobste.rs](https://lobste.rs/s/x9mztx/find_anything_you_need_with_fzf_linux#c_hyhqmi) on an article about fzf. Their idea was to increase file *path* matching accuracy. I'll explain the specifics in a moment.

Because zf already focused on file *name* matching this seemed like a natural extension of the project. So I now had two new observations:

1. Fuzzy finders also deal with file _paths_
2. Collaboration is great because other people have amazing ideas that you had never considered

Pistos' idea boils down to this: When the user of a fuzzy finder includes path separators in the query, their *intent* is to filter on file *paths*. I refer to this feature as "strict path matching".

Strict path matching means that the path segments of the query token cannot overlap between path segments in the candidate. As a trivial example, `asdf/` would match `asdf/main.zig` but not `as/df/main.zig`. This is because `asdf` is a single path segment and should not cross between segments of the candidate.

It's hard to illustrate how useful this is in small project trees, so I'll use Blender's source code again. In this scenario I'm trying to find the files in the `space_outliner/` directory using the query `sout/`.

```text
# Without strict path matching
$ fd -t f | zf
> sout/
release/scripts/addons_contrib/lighting_hdri_shortcut/__init__.py
source/tools/readme.rst
source/tools/pyproject.toml
source/tools/utils/git_log.py
source/tools/utils/blend2json.py
source/tools/modules/blendfile.py
source/tools/utils/cycles_timeit.py
source/tools/utils/weekly_report.py
source/tools/git/git_sort_commits.py
source/tools/utils/autopep8_clean.py

# With strict path matching
❯ fd -t f | zf
> sout/
source/blender/editors/space_outliner/CMakeLists.txt
source/blender/editors/space_outliner/tree/common.cc
source/blender/editors/space_outliner/tree/common.hh
source/blender/editors/space_outliner/outliner_ops.cc
source/blender/editors/space_outliner/outliner_draw.cc
source/blender/editors/space_outliner/outliner_edit.cc
source/blender/editors/space_outliner/outliner_sync.cc
source/blender/editors/space_outliner/outliner_tree.cc
source/blender/editors/space_outliner/outliner_query.cc
source/blender/editors/space_outliner/outliner_tools.cc
```

Without strict path matching the results are the shortest matches for the query (`sout/` matching `source/tools/` for example). This makes sense, but doesn't capture my intent. With strict path matching the directory I was looking for is the top result! And there are no results where the characters `sout` are spread across multiple path segments.

I'm grateful I ran into Pistos' suggestion on lobste.rs. It gave me an opportunity to refine my project and taught me about user intent.

At the core of zf's design is *intention*. If you type something that looks like a filename, you probably want to prioritize filename matches. When your search query looks like a filepath, you probably want to use an algorithm designed for filepath matching. This makes zf a "do what I mean" program.

Developing zf has been a fun and rewarding process. I don't expect zf to ever become widely used (fzf has way more features than I'm ever willing to implement), but it has been very helpful to me. I hope it can be helpful for others too!

If you are interested in trying it out, [take a look at zf on GitHub](https://github.com/natecraddock/zf) for more info! There are packages for Arch Linux and Homebrew, and integrations with both Vim and Neovim. I appreciate suggestions and feedback!
