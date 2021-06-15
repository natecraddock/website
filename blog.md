---
layout: base.njk
templateEngineOverride: njk
description: The homepage of Nathan Craddock
---

{% set postlist = collections.posts %}
{% include "postlist.njk" %}
