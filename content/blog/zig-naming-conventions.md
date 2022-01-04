+++
title = "Zig Naming Conventions"
date = 2022-01-03T21:30:52-07:00
draft = true
tags = ["programming", "zig"]
+++

Occasionally I see confusion surrounding Zig's naming conventions, especially
with those new to the language. This post explains Zig's naming conventions in
hopes of reducing any confusion, and also my thoughts on why I think it works
well for Zig.

Zig's [style guide](https://ziglang.org/documentation/master/#Names) in the
language reference lists the following naming guidelines:

> * If `x` is a type then `x` should be `TitleCase`, unless it is a `struct`
>   with 0 fields and is never meant to be instantiated, in which case it is
>   considered to be a "namespace" and uses `snake_case`.
> * If `x` is callable, and `x`'s return type is `type`, then `x` should be
>   `TitleCase`.
> * If `x` is otherwise callable, then `x` should be `camelCase`.
> * Otherwise, `x` should be `snake_case`.

Simply put, **the naming convention used for a given identifier depends on the
type**. Let's take a look at these points to explore why this naming pattern
makes sense for Zig.

## Types and namespaces

> If `x` is a type then `x` should be `TitleCase` ...

The first part of this guideline is straightforward and similar conventions are
found in languages like C, C++, Rust, and Java. Non-primitive types in Zig like
`struct`, `union`, `enum`, and `error` should be written in title case.

```zig
const Point = struct {
    x: i32,
    y: i32,
};

const Color = enum {
    blue,
    red,
    green,
};

const Data = union {
    int: i64,
    boolean: bool,
};

const FileError = error {
    FileNotFound,
    AccessDenied,
};
```

Here `Point`, `Color`, `Data`, and `FileError` are types and are written in
title case. The field names reflect their types, with the exception of error
names which are always title case.

Title case names are also used for function parameters and variables that store
types.

```zig
const print = @import("std").debug.print;

// returns the signedness of a integer type
fn isSigned(comptime T: type) bool {
    return @typeInfo(T).Int.signedness == .signed;
}

pub fn main() void {
    const SignedInt = i32;
    print("{}\n", .{isSigned(SignedInt)});
}
```

> ... unless it is a `struct` with
> 0 fields and is never meant to be instantiated, in which case it is considered
> to be a "namespace" and uses `snake_case`.

Zig uses 0-field structs as namespaces with the `@import()` builtin function.
These structs use snake case naming. Here is a simple example.

{{< code lang="zig" header="other.zig" >}}
pub fn addOne(val: i32) i32 {
    return val + 1;
}

pub const value = 10;
{{</ code >}}

{{< code lang="zig" header="main.zig" >}}
const print = @import("std").debug.print;
const other = @import("other.zig");

pub fn main() void {
    var sum = other.addOne(other.value);
    print("{}\n", .{sum});
}
{{</ code >}}

[Zig source files are implicitly
structs](https://ziglang.org/documentation/master/#import) with no fields. The
code in `other.zig` is wrapped in a struct with the public functions and data
visible from other files. Because the `other` struct is a namespace and not
intended to be instantiated, snake_case naming is used. A more detailed example
of this is [`std.zig` from the Zig standard
library](https://github.com/ziglang/zig/blob/master/lib/std/std.zig) which
exposes a hierarchy of namespace structs.

## Functions and types

> If `x` is callable, and `x`'s return type is `type`, then `x` should be
> `TitleCase`. If `x` is otherwise callable, then `x` should be `camelCase`.

The naming for functions depends on the return type of the function. This is a
side effect of Zig's use of compile time evaluation of functions for generics.
Most functions will be written in camelCase style, but any function that returns
a type should be written in TitleCase. A good example of this is the many
[builtin functions](https://ziglang.org/documentation/master/#Builtin-Functions)
available in Zig. Most builtin functions like `@sin()` or `@clz()` are camel
case because they return regular values, but a few are in title case because
they return types. For example, `@Type()` reifies type info into a type and
`@TypeOf()` returns the type of the given expression.

Let's explore this more with the `Point` struct example from earlier, but making
the point generic instead.

```zig
const print = @import("std").debug.print;

// here both the function and parameter names are in title case because they
// refer to types
fn Point(comptime T: type) type {
    return struct {
        x: T,
        y: T,
    };
}

// these constants are also in title case because they are struct types
const IntPoint = Point(i32);
const FloatPoint = Point(f64);

pub fn main() void {
    const p = IntPoint{ .x = 10, .y = -12 };
    print("({}, {})\n", .{ p.x, p.y });
}
```

This is probably the greatest deviation from naming conventions in other
languages, but it is consistent with Zig's model of generics.

## Variables and other identifiers

If no other guideline applies, everything else in Zig should use snake case.
This applies to variables, fields, and even constants.

```zig
var a_variable: i64 = 1001;
const a_constant: bool = false;
```

Neither the Zig compiler nor `zig fmt` enforce these naming conventions. You are
welcome to name identifiers however you like; however, the majority of Zig code
does follow these guidelines and understanding *why* these conventions exist
helps in understanding code.

The style guide mentions that exceptions are allowed:

> These are general rules of thumb; if it makes sense to do something different,
> do what makes sense. For example, if there is an established convention such
> as `ENOENT`, follow the established convention.

See the Zig [language
reference](https://ziglang.org/documentation/master/#Examples) for more examples
of style conventions.

## Why?

Now, Zig could get by fine using camelCase for all callables, and snake_case for
variables and parameters. So why are these conventions beneficial? For me, it
encodes additional information in the name of an identifier. When I see a
function name in TitleCase I immediately know that function returns a type. A
function that takes a type as a parameter, but is in camelCase implies no type
is returned.
