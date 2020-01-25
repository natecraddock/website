---
title: "Test of Hugo Features"
date: 2020-01-24T16:42:10-07:00
draft: false
tags: ["testing"]
---

This is my page to test random Hugo features

Syntax highlight just works out of the box. How nice!

```c
#include <stdio.h>
int main() {
    printf("Hello world! This is a long string %d\n", 1002);
    return 0;
}
```

Highlighting can also be done starting from a specific number!

{{< highlight c "linenostart=52" >}}
void a_function() {
    printf("I am a function");
}
{{< / highlight >}}

It also seems that `inline code` works just fine too! Well.. my webpage is all monospace, so that isn't a fair comparison.

I may have to do a little bit of **bolding** to make code stand out.

# 1st level heading

## 2nd Level heading
### Subheading
* This has a bulleted list
* Two
    * Hey
    * Another bullet

#### Can I throw this down here?
##### 5 heading
###### 6 heading (probably won't use that much)

---

Fancy horizontal rule!

Tweets
{{< tweet 1214907129917657089 >}}

Youtube embeds
{{< youtube SXRYoay-rNo >}}

This one smart guy said once,
> Does a quote work?

Looks like quotes do work!
