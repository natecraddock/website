+++
title = "Exploring Zig's Metaprogramming Model"
date = 2021-11-05T13:20:13-06:00
draft = true
tags = ["zig", "comptime", "c", "programming", "plt"]
math = true
+++

I have written about Zig's type system, including support for generics, and uses
of Zig's comptime language for simple function calls. Now I would like to
discuss Zig's metaprogramming model in more depth to try to understand exactly
what the language is offering.

## Metaprogramming in Zig

In addition to simply learning and using Zig over the last several months, I
have been trying to understand exactly what Zig means in the claim, "A fresh
approach to metaprogramming based on compile-time code execution and lazy
evaluation." While that does accurately explain that Zig supports compile time
evaluation of code, it does not precisely describe where Zig falls on the
spectrum of [metaprogramming](https://en.wikipedia.org/wiki/Metaprogramming).
Metaprogramming refers to programs that can manipulate programs, or a
transformation from code to code. This can be done through simple text
replacement like C's preprocessor, or through powerful syntax macros like in
Racket.

Zig's metaprogramming model is built on the ability to evaluate code at compile
time. By also allowing manipulation of types as first-class values at compile
time, Zig affords conditional compilation, generics, and partial evaluation.

### Generics

Generic programming is a form of polymorphism, and is the style of writing
programs in such a way that the types can be specified or inferred at a later
time. Take for example the implementation of `max` from the Zig standard
library. The two parameters `x`, and `y`, are specified to be `anytype`, and the
return value is a type that both `x` and `y` may be coerced to.

```zig
pub fn max(x: anytype, y: anytype) @TypeOf(x, y) {
    return if (x > y) x else y;
}
```

This function works for any types for which the greater-than relation is
defined. By writing the function once, new instantiations of the function will
be created at compile time through monomorphization for each type used in the
code. The following code would result in two concrete implementations of `max`
in the emitted code, one for integers, and one for floating point numbers.

```zig
_ = max(1, 2);
_ = max(2.0f, 1.9f);
```

Zig also supports creating generic types by returning a struct from a function,
and then evaluating that function at compile time to create new types on demand.

```Zig
fn Pair(comptime a: type, comptime b: type) type {
    return struct {
        first: a,
        second: b,
    };
}

test "pairs" {
    var pair: Pair(i32, bool) = .{ .first = 100, .second = true };
}
```

This `Pair` function can be called anywhere a type is expected to create a new
pair of types.

### Partial evaluation

[Partial evaluation](https://en.wikipedia.org/wiki/Partial_evaluation) is the
process of specializing a program to a specific set of inputs. Given a program $P$
and a set of inputs $I$, $P$ may be *specialized* to the static members of $I$ to
create a new program $P'$ which is optimized to process the dynamic members of $I$.
For example, a program to match regular expressions might take two inputs, a
regular expression *a* and a string *b* to match. This program may be *specialized*
to a new program that only matches against the given regular expression *a*, but
is more optimized.

Zig supports partial evaluation at the function level. When one or more function
parameters are comptime known, the function can be partially evaluated to
generate a new specialized version of that function for the specific task. One
example is Zig's format string implementation. The Zig
[documentation](https://ziglang.org/documentation/0.8.1/) says,

>Zig does not special case string formatting in the compiler and instead exposes
>enough power to accomplish this task in userland. It does so without
>introducing another language on top of Zig, such as a macro language or a
>preprocessor language. It's Zig all the way down.

This is a powerful concept. Unlike other format string implementations like C's
`printf` or Rust's `fmt!` macro, Zig does not need to handle format strings in
the compiler because the comptime language is powerful enough.

TODO: Sidenote
Tom Stuart has very in depth presentation on partial evaluation and the Futamura
projections titled [Compilers for Free](https://tomstu.art/compilers-for-free)
which I highly recommend. Tom has included some wonderful animations that help
explain some of the applications of partial evaluation.

In solving Advent of Code problems this year, I have utilized Zig's partial
evaluation and type reflection on a number of occasions. The Advent of Code
problems involve parsing an input string, and I often want to parse a line into
a struct. I wrote a `parseInto` utility function to assist in this. I have
included a simplified copy below.

```zig
pub fn parseInto(comptime T: type, string: []const u8, delim: []const u8) !T {
    const info = @typeInfo(T).Struct;

    var split = std.mem.split(string, delim);
    var item: T = undefined;
    inline for (info.fields) |field| {
        var s = split.next().?;
        switch (@typeInfo(field.field_type)) {
            .Int => {
                @field(item, field.name) = try std.fmt.parseInt(field.field_type, s, 10);
            },
            .Float => {
                @field(item, field.name) = try std.fmt.parseFloat(field.field_type, s, 10);
            },
            else => @compileError("unsupported type"),
        }
    }

    return item;
}
```

Now an example of this function in use

```zig
const Point = struct {
    x: i32,
    y: i32,
};

pub fn main() !void {
    const data = "32 -> 10";
    var point = parseInto(Point, data, " -> ");
    std.debug.print("({},{})\n", .{ point.x, point.y });
}
```

As mentioned, `parseInto` makes uses of both partial evaluation and type
reflection. The first line of the function accesses the Struct data of the given
type. Zig is duck typed at compile time, so if the given type is not a struct
this will fail, otherwise the fields of the struct may be inspected.

Using an `inline for` at compile time will unroll the loop into sequential
statements. This loop iterates over the fields of the given struct, which are
then handled with a switch.

Currently `parseInto` only supports ints, floats, and (in my full version)
strings. Inside the switch branches the `@field()` builtin is used to access the
fields of a type through a string.

When using this function with the `Point` type, it is partially evaluated into
the following function which I have named `parseIntoPoint`.

```zig
pub fn parseIntoPoint(string: []const u8, delim: []const u8) !Point {
    var split = std.mem.split(string, delim);
    var item: T = undefined;
    {
        var s = split.next().?;
        item.x = try std.fmt.parseInt(i32, s, 10);
    }
    {
        var s = split.next().?;
        item.y = try std.fmt.parseInt(i32, s, 10);
    }
    return item;
}
```

The generic `parseInto` function has been specialized into a function made
specifically for parsing a string into a `Point` struct. This specialization
occurs at compile time, so any call to this specialized version will not incur
runtime costs of type reflection (which Zig doesn't support anyway).

### Conditional compilation

With an understanding of partial evaluation, it becomes clear that Zig's
conditional compilation is implemented through partial evaluation of functions.

```zig
fn complexCode() void {
    if (std.builtin.mode == .Debug) {
        std.debug.print("started the complex function\n", .{});
    }
    //...
}
```

Regardless of the compilation mode, this if statement will be elided from the
final executable. In Debug mode the print statement will remain, and in any
other mode the print statement will also be elided. This is done through partial
evaluation of the function.

## Limitations

As of version 0.8.1, Zig has a few restrictions on the comptime evaluator which
makes certain patterns of metaprogramming impossible.

## Metaprogramming model

From what I have seen and experienced, Zig's metaprogramming model is based
on partial evaluation of compile time function execution.

Zig is not without rough edges. The language is still stabilizing and anything
could change at a moment's notice. I even ran into a possible bug in the Zig
compiler while writing this post. But I am exited for the language's future and
I hope to see it succeed as a widely supported alternative to C.

Both while researching Zig and while writing this post I have come across bugs
in the Zig compiler, always related to comptime. Maybe this is because I have
done most of my experimenting in comptime, or perhaps due to an oversight in the
implementation of comptime. I have also found comptime restrictions that I
believe may easily be lifted and still fit within Zig's comptime model.

Looking forward, I will be reducing the bugs I found to simple reproducible
cases and reporting them. I also want to continue to refine my understanding of
Zig's comptime so I can confidently suggest improvements to the ergonomics of
the language, and help others have a more confident understanding of how
comptime behaves.
