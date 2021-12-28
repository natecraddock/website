+++
title = "A More Consistent Developer Experience with Zig"
date = 2021-12-14T17:50:29-07:00
draft = true
tags = ["plt", "zig", "c"]
+++

One of the articles that first got me interested in Zig is [Kevin Lynagh's
post on writing keyboard firmware in Zig](https://kevinlynagh.com/rust-zig/)
which frequently emphasizes the consistency of the language:

> The language is so small and consistent that after a few hours of study I was
> able to load enough of it into my head to just do my work. ... It feels like
> Zig is a language that I’d be able to master; to fully internalize such that I
> can use it without thinking about it. This feels super exciting and
> empowering.

Around this time I was in the process of learning Rust. I had a fair grasp on
the concepts of ownership and lifetimes, along with the syntax of the language,
but I didn't yet feel comfortable creating my own projects. Reading this
enthusiastic praise from Kevin motiviated me to try Zig.

{{< sidenote >}}
I don't want to sound like I'm bashing Rust here. I love the goals and
capabilities of the language! But with its guarantees and features Rust is a
larger, more complex language than C or Zig. For me Zig hits the sweet spot of
fixing major problems in C, while staying small, consistent, and easy to fit the
language inside my head unlike C++ or Rust.
{{</ sidenote >}}

Now half a year later I have spent quite a bit of time reading, writing, and
studying the Zig programming language. Like C I find the language to be small
and simple. Like Kevin, I am very enthusiastic about using Zig, and I found
myself comfortable and productive early in the learning process. Many aspects of
the language excite me, especially the capabilities of compile-time
metaprogramming, but for this post I will focus on the areas of Zig that I find
lead to a consistent developer experience.

Because I have a lot of C experience, and Zig is a systems language, many of the
examples I share will compare Zig to C. In that context I find it important to
recognize that Zig is only 5 years old, while C is approaching 50 years. In
comparing the two languages I find it encouraging to see the progress made over
the decades. With the knowledge and progress we have today it is very easy to
look at C as lacking through the lens of the present. I hope to not forget the
circumstances surrounding C's creation while also recognizing that mistakes were
made and can be improved on.

## Consistency In Types

In many ways Zig has a very consistent type system. Although distinct from the
behaviors of the language, I find that Zig's syntax for declaring types is very
readable and consistent, and contributes positively to Zig's developer
experience. To start simple, compare declaring an int between C and Zig.

```c
// c
int value = 0;
```

```zig
// zig
var value: i32 = 0;
```

There are a couple differences in this simple example. C places the type on the
left of the identifier, while Zig requires a type annotation appended to the
name. Many variables types can be inferred in Zig, but in this situation the
type must be specified to determine how much storage to allocate on the stack
for `value`. Zig also uses `var` to introduce a variable declaration. At this
point, there isn't anything worth noting about the developer experience between
the languages, so let's move on to array syntax.

The following code snippets both declare integer arrays of size 2 and initialize
with zeros.

```c
// c
int values[2] = { 0, 0 };
```

```zig
// zig
var values: [2]i32 = .{ 0, 0 };
```

Here we begin to see some larger differences between C and Zig. With the
introduction of arrays C begins to fragment the type information between the two
sides of the array name. The datatype on the left, and the size of the array on
the right.

Zig stays consistent with the simpler example, prefixing the annotation with
`[2]` to indicate an array of size 2 of 32 bit signed integers. The data is
initialized with an [anonymous list
literal](https://ziglang.org/documentation/0.8.1/#Anonymous-List-Literals) (the
`.{}`) which infers its type from context. Here Zig starts to show one of my
favorite consistencies of the language: **types read from left to right**. To
illustrate this further, here's an example of a more complex type:

```zig
var to_make_a_point: ?*[]?std.ArrayList(u8) = undefined;
```

This reads from left to right as *an optional pointer to a slice of
optional ArrayLists of u8*. I can't think of an example of where this would be
used, but it is a valid type!

On the subject of pointers, Zig breaks away from conventional syntax for
dereferencing. As a teaching assistant for a C++ introduction course, I have
seen many students confused by the overloaded use of `*` for both declaring
pointers and dereferencing pointers. Zig removes the possibility of ambiguity by
appending `.*` to dereference a pointer.

```zig
var number: i32 = 32;
var ptr: *i32 = &number;
ptr.* += 10;
```

This is another example of a small change that adds to the great developer
experience in Zig.


## Defining Types

Now let's take a look at defining new types.

```c
// c
typedef struct Point {
    int x,
    int y,
} Point;
```

```zig
// zig
const Point = struct {
    x: i32,
    y: i32,
};
```

At a glance these two look quite similar, but there are a few important
differences to point out. In C this is actually a combination of a `typedef` and
a `struct` declaration. In Zig `struct {}` declares a type and can be used
anywhere a type is valid. The following function is valid.

```zig
fn getFieldA(x: struct { a: i32 }) i32 {
    return x.a;
}

pub fn main() !void {
    var x = getFieldA(.{ .a = 500 });
}
```

{{< sidenote >}}
When writing this post I hadn't ever tried using `struct {}` as a function
parameter's type like in `getFieldA(x: struct { a: i32}) i32`. But fitting with
the theme of consistency in Zig, I tried this and it worked as expected which
was satisfying but not surprising.
{{</ sidenote >}}

Storing the type as a constant with `const Point = struct {}` allows for reuse.
This same syntax applies to enums, unions, and errors in Zig.


## Generic Types

Zig also has support for generic types through its compile time features. This
is another instance where Zig's consistency shines. Languages like Rust and C++
use templating syntax with `<>` characters to mark a struct as generic. In Zig,
generics are implemented with compile-time function calls (compile-time
functions are memoized). This is a generic `Pair` struct.

```zig
fn Pair(comptime A: type, comptime B: type) type {
    return struct {
        a: A,
        b: B,
    };
}

pub fn main() !void {
    var a: Pair(bool, i32) = .{ .a = true, .b = 301 };
}
```

Rather than modifying the struct syntax to support generics, Zig stays
remarkably consistent regarding `struct {}` as a value at compile time. The
`Pair` function is evaluated at compile time which returns a new type defined by
the arguments to the function.

{{< sidenote >}}
An interesting side-effect of Zig's use of functions for type generics is the
naming conventions of the language. A function names in camelCase is a typical
function, but a function in TitleCase is a function that returns a type. The
same applies to variable names, snake_case for typical variables, and TitleCase
for variables that store types. While this isn't *required* for code to compile,
syntax highlighters do examine the casing to determine what part of the language
a given identifier represents.
{{</ sidenote >}}

Continuing the pattern of consistency, the result of the `Pair()` function can be
stored in a variable for reuse, creating a new type that can be used anywhere.

```zig
const Vec2d = Pair(i64, i64);

pub fn main() !void {
    var a: Vec2d = .{ .a = -1, .b = 2 };
}
```

This only scratches the surface of Zig's consistent developer experience.
Looking only at the syntax for declaring types, Zig shows how a simple concept
used consistently reduces the surface area of a programming language. Once you
understand both how to declare a struct and define a function, declaring generic
structs comes for free with no new added syntax.

The more I learn Zig the more I love the language and I am excited to see where
Zig goes in the coming years. My understanding is that the language will likely
remain very similar to today, with small improvements until the stable 1.0
release. Whatever changes, I hope that consistency remains a strong foundation
of the Zig programming language.
