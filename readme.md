# website

I grew tired of fighting hugo. Now this website is built using a very simple build.lua file.
It is messy, but it works and I understand every line of it.

Rather than use markdown, I now use [djot](https://djot.net). It is wonderful. You should give it a try.

It's an order of magnitude slower, but in the end it doesn't matter too much. I have a few
ideas on how to make it faster if I really need it.

I don't rely on a git-push-deploy workflow anymore. Rather I use wrangler-cli locally to push.
This makes deploys much easier, and I can publish drafts in seconds.
