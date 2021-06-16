---
layout: base.njk
templateEngineOverride: njk
description: The homepage of Nathan Craddock
active_nav: blog
---

{% set postlist = collections.posts %}
{% include "postlist.njk" %}
