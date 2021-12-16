+++
title = "No Macros? No Problem"
date = 2021-11-05T22:21:20-06:00
draft = true
tags = ["zig", "c", "comptime", "plt"]
+++

Over the last several months I have been learning [Zig](https://ziglang.org),
and I am having an absolute blast with the language. The language checks all the
boxes for me. It is readable, small (easy to fit the language inside my head),
low-level (I enjoy programming with pointers!), and strikes a good balance
between safety and simplicity. Zig gives me the same control as C, prevents many
of C's worst possible errors, and adds a few small concepts like tagged unions
that make coding safer and easier. But even more interesting to me than all of
the improvement's to C's footguns, is Zig's compile time (comptime) language.

While developing [zf](https://github.com/natecraddock/zf), my replacement for
fzf and fzy written in Zig, I wrote a small function that I previously would
have written as a `#define` macro in C. The function is used to convert an ascii
representation of a letter to the expected code for that letter when holding the
ctrl key.

{{< sidenote >}}
Terminal applications like zf and fzf often use keybindings that require holding
the `ctrl` key while pressing another character, like pressing `ctrl` and `n` to
move down a line. The character `n` has an ascii value of 110, but when holding
`ctrl` the value sent by the terminal is 14. This transformation is done by
masking the value of the letter with `0x1f` to only include the lower 5 bits.
{{</ sidenote >}}

This example is small, but still provides context for discussing many reasons
why Zig's comptime evaluation is one of the language's greatest strengths. Here
is code in both C and Zig that shows an example of how I would write code to get
the ctrl key code from an ascii character.

```c
// main.c
#define CTRL(c) ((c) & 0x1f)

void handleKeypress(unsigned char key) {
  switch (key) {
    case CTRL('n'):
      break;
    case CTRL('p'):
      break;
    default:
      break;
  }
}
```

```zig
// main.zig
fn ctrl(key: u8) u8 {
    return key & 0x1f;
}

fn handleKeypress(key: u8) void {
    switch (key) {
        ctrl('p') => {},
        ctrl('n') => {},
        else => {},
    }
}
```

Besides some syntactic differences, the `handleKeypress` function is very
similar in C and Zig. The interesting part is the implementation of the function
to convert a char to it's equivalent ctrl code.

In C the macro `CTRL` is used. This macro is expanded by the preprocessor before
compile time, replacing `CTRL('p')` with `(('p')) & 0x1f)` in the switch
statement.

In Zig the `ctrl` function will run at compile time because it is called from a
compile time context, the case of a switch. `ctrl` returns the result of
the bitwise AND between `0x1f` and the char. The call to the function will be
replaced with the return value in the switch case.

Even with this simple example, I have identified three strengths to Zig's
approach of the `ctrl` function:

1. **Versatility:** In Zig `ctrl` is a function rather than a text replacement
   run before the compiler. Because `ctrl` is a function, we are not limited to
   calling it at compile time. This could also be used at runtime with no
   modifications.

   {{< sidenote >}}
   For runtime use, C may have the advantage here. Because `CTRL` is not a
   function, runtime use will never create a new stack frame. If the Zig
   compiler does not inline the call to `ctrl` then the C implementation would
   be more optimal for a runtime call.
   {{</ sidenote >}}

   Now with this trivial example, both `CTRL` and `ctrl` will both work during
   and before runtime. Zig functions however can be extended with additional
   logic that will run at compile time. For example, we could restrict the use
   of `ctrl` to only work for the chars `a` through `z`.

   ```zig
   fn ctrl(comptime key: u8) u8 {
       if (key < 'a' or key > 'z') @compileError("Invalid key code");
       return key & 0x1f;
   }
   ```

2. **Safety:** If an invalid argument is passed to `ctrl`, or `ctrl` is run
   from an incorrect context the compiler will report a clear error.

   Attempting to compile the following in Zig
   ```zig
   ctrl("hello");
   ```

   yields the following error

   ```text
   ./main.zig:14:20: error: expected type 'u8', found '*const [5:0]u8'
    ctrl("hello");
         ^
   ```

   Attempting the same in C gives the following error

   ```text
   main.c: In function ‘main’:
   main.c:3:21: error: invalid operands to binary & (have ‘char *’ and ‘int’)
       3 | #define CTRL(c) ((c)&0x1f)
         |                  ~  ^
         |                  |
         |                  char *
   ```

   While it is nice that C gives an error here, it leaks the implementation
   details of `CTRL`. Ideally, the user of `CTRL` shouldn't need to know that
   the macro is implemented with a bitwise AND to debug improper use.

   C also fails to restrict the macro's argument to unsigned 8 bit integers.
   Passing `1000` or `true` to the macro gives no warnings, while in Zig the
   code fails to compile.

3. **Consistency:** In C using the preprocessor requires learning another
   language. Zig's "preprocessor" is Zig itself! There is only one language to
   learn. I wrote the function I wanted and called it at compile time. This
   helps Zig remain simple and readable.

I originally titled this post "Better Macros with Zig", but I realized that
might be confusing because Zig's homepage makes it very clear that Zig does not
have a preprocessor or macros. By "macro" I meant that Zig has some features to
manipulate code at compile time just like might be done with the C preprocessor.
The C preprocessor is a lexical macro system that performs text expansions on
text. Macros can be defined to modify the language or make control flow more clear,
like a `#define forever while (1)` or the `LISTBASE_FOREACH` macro that I used
frequently in Blender's source code to iterate over linked lists.

```c
#define LISTBASE_FOREACH(type, var, list) \
  for (type var = (type)((list)->first); var != NULL; var = (type)(((Link *)(var))->next))

LISTBASE_FOREACH (TreeElement *, element, listbase) {
  // iterate over listbase assigning to element
}
```

The preprocessor is not aware of the syntax or semantics of the C programming
language, which is why it is easy to introduce errors through the use of macros.
The preprocessor will not prevent mistakes like `#define false 1` or `#define
private public`. Unlike the C preprocessor, Zig restricts it's metaprogramming
to not allow arbitrary syntax manipulation. This does prevent modifications to
the syntax, but Zig more than makes up for it with a more powerful language and
compile time evaluation.

Beyond simple macro-like comptime evaluation, Zig also offers type generics
and partial evaluation in its metaprogramming model.
