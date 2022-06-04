+++
title = "Drawing the Road"
date = 2022-06-04T13:37:44-06:00
draft = true
tags = ["zig", "reckless-drivin", "c"]
+++

It's time for a long-awaited [Reckless Drivin'](https://github.com/natecraddock/open-reckless-drivin) progress update! There are actual pixels drawn to the screen!

{{< raw >}}
    <video controls muted width=100%
            src="/videos/reckless-demo-trim.m4v"
            poster="/videos/reckless-demo-poster.jpg">
    </video>
{{< /raw >}}

*This video just pans the camera, there is still no gameplay.*

After nearly two years, it's very rewarding to finally see these sprites and textures revealed from the opaque bytes I've been working with this whole time.

## More undefined behavior goodies

I [recently shared](/blog/2022/zig-cc-undefined-behavior/) how Zig helped me catch some undefined behavior in Reckless Drivin', and it has happened again.

This time it was an issue with how the original code handled overflow of integers. Here's a simplified C version of the original code, with many parameters omitted for clarity:

```c
void drawRoadBorderLine(int x1, int x2, float zoom) {
    int leftBordEnd = x1 + 16 / zoom;
    int rightBordEnd = x2 - 16 / zoom;
    // continues ...
}
```

The purpose of this code is to draw a single line of the road or background pixels, with `x1` and `x2` being the left and right boundaries. One of the calls to this function passes in `0x7fffffff` (`INT_MAX`) for the value of `x2`, which means that the line extends from `x1` to the edge of the screen. The value of `zoom` is roughly 2.1.

So I translated this to Zig, including the required explicit casts.

```zig
fn drawRoadBorderLine(x1: i32, x2: i32, zoom: f32) void {
    var left_border_end = @floatToInt(i32, @intToFloat(f32, x1) + 16.0 / zoom);
    var right_border_end = @floatToInt(i32, @intToFloat(f32, x2) - 16.0 / zoom);
    // continues ...
}
```

When testing this code, there would be a runtime overflow error reported (thanks for checking Zig!), so I had to investigate why this wouldn't work.

The issue is with how this code calculates the value of `rightBordEnd`. Let's look at the C version again, with the values of `x2` and `zoom` substituted with the values at the time of the error.

```c
int rightBordEnd = 0x7fffffff - 16.0 / 2.1;
```

Executing this code results in `rightBordEnd` storing the value `2147483639` or `0x7ffffff7`, just below `INT_MAX`.

But the same thing in Zig gives a runtime error:

```text
./main.zig:4:21: error: integer value '2147483648' cannot be stored in type 'i32'
    print("{}\n", .{@floatToInt(i32, @intToFloat(f32, 0x7fffffff) - 16.0 / 2.1)});
                    ^
```

The result of the expression before casting to an `i32` is `2147483648`, which is `0x80000000` (the bit representation of `INT_MIN`).

Zig and C handle this case differently. So from what I see, we just need to handle the case where the float is greater than the largest `i32` and in that case just return the maximum integer. Effectively it is a saturating cast.

```zig
fn drawRoadBorderLine(x1: i32, x2: i32, zoom: f32) void {
    var left_border_end = @floatToInt(i32, @intToFloat(f32, x1) + 16.0 / zoom);
    var right_border_end = blk: {
        const value = @intToFloat(f32, x2) - 16.0 / zoom;
        if (value >= @intToFloat(f32, math.maxInt(i32))) break :blk math.maxInt(i32);
        break :blk @floatToInt(i32, value);
    };
    // continues ...
}
```

Strangely, small changes to the C code change the result wildly!

```c
float intermediate = 0x7fffffff - 16.0 / 2.1;
int rightBordEnd = intermediate;
printf("%d\n", rightBordEnd);
```

This code prints `-2147483648` which is `INT_MIN`!

This has taught me to be very careful with overflow and casting. This hasn't been the only case where int/float casts have caused an issue in Reckless Drivin', and I'm sure it won't be the last! Though it does make me more confident in my rewrite that Zig does error checking for casts.

## So what's next?

I recently nerd-sniped myself and wrote a [Zig Lua binding](https://github.com/natecraddock/ziglua) library. I also will be starting my first full-time engineering position soon which means my daytime hours are no longer free to work on Reckless Drivin'. But now that I have drawing code in place I have some momentum.

So I expect that the rate of progress will slow, but I will still make *consistent* progress.
