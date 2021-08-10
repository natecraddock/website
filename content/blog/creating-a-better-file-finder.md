+++
title = "Creating a Better File Finder"
date = 2021-06-29
tags = ["neovim", "programming", "python", "linux"]
description = "A neovim file finder that fits my needs"

aliases = [
  "/posts/creating-a-better-file-finder/"
]
+++

About a week after [setting out to make a better file finder](/posts/in-search-of-a-better-finder/)
I had a working prototype as a Neovim plugin. Now after a month of using and developing the plugin I would like to
share my thoughts on the file finder, and Neovim plugins in general.

![a gif showing the plugin and search results](/images/nvim-find.gif)

## The Algorithm

The file finding algorithm is very simple. Given a list of file paths and a query string:

1. Split the query string into whitespace-separated tokens.
2. For each file path, compare the basename of the path with the first token.
   If there is no match the path is discarded.
3. Any remaining tokens are matched against the full string of any remaining paths. If any
   don't match, the path is discarded.
4. If there are no results, begin matching with tokens again against the entire path,
   rather than against the basename only.

This algorithm is very strict. Searching for "outliner draw" in Blender only returns one
match, while in VSCode I am presented with a list of 18 results, plus more potential matches
available by scrolling down due to the fuzzy nature of the file search.

In developing my plugin I realized that some degree of fuzziness or sloppiness is helpful.
There are two small adjustments to string matching I implemented that allow the plugin to
be a little more forgiving.

1. If the query contains no delimiter characters (`-_.`), then those characters are ignored
   when path matching.
2. The search is case insensitive unless at least one uppercase character is found in the query.

With those adjustments it is possible to search for "outlinerdrawc" to match "outliner_draw.c",
or "gnumakefile" to match "GNUMakefile".

I am considering adding a small amount of fuzziness as well to handle character-swap typos, but
I want to avoid too much fuzziness because that leads to cases where too many matches are found
that bear no resemblance to the desired file.

## Neovim and Lua

This is my first time developing a Vim/Neovim plugin, and my first time learning Lua. I really have
come to love the simplicity of the language. If I ever need to add an embedded scripting language
to a future project I am very confident I will choose Lua. And although the Neovim API is still
young and changing, it was very easy to get up and running with a basic plugin. After seeing some
of the source code of Vim plugins, I am grateful for the developers choosing Lua as an alternative
scripting language which definitely made my life easier.

I have extended my plugin beyond file finding, and it now also utilizes [ripgrep](https://github.com/BurntSushi/ripgrep)
for project search. The plugin is available at [https://github.com/natecraddock/nvim-find](https://github.com/natecraddock/nvim-find).

## Conclusion

After using my file finder for the last month, I am very pleased with the results. It is very fast,
and filters down to exactly what I am looking for. In the rare case that multiple files have the same
name, I can quickly type part of the path I want to further filter, or select the line I want from the
results. Of course, I designed this finder and algorithm specifically for my needs and conceptual
model of file-finding, so I would hope that I enjoy using it!
