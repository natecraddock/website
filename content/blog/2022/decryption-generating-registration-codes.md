+++
title = "Decryption and Generating Registration Codes"
date = 2022-04-19T13:25:27-06:00
tags = ["zig", "reckless-drivin"]

aliases = [
   "/blog/decryption-generating-registration-codes/"
]
+++

As mentioned in my post about [unpacking LZRW compressed game
assets](/blog/resource-forks-and-lzrw-compression) for Reckless Drivin', levels
4 through 10 are encrypted and can only be played with valid registration
information. Jonas released free registration information once he discontinued
selling the game: the code `B3FB09B1EB` registered to `Free`. Thanks to this
free registration information, it is relatively simple to both decrypt the
remaining levels, and to create a program to generate new registration codes.

## Decryption

The original source code includes a function called `CryptData()` which is used
to decrypt a stream of bytes using a global decryption key. The decryption is
done through a simple XOR with the key four bytes at a time, with some
additional logic to handle streams that aren't a multiple of four in length. As
the bytes are decrypted, a check value[^check] is also computed and is used to verify
valid decryption for level 4.

[^check]: The computed value is the resource `Chck 128` which contains the exact
  check value expected from the decryption of level 4. Valid registration
  information is determined by comparing these two values.

```c
UInt32 CryptData(UInt32 *data, UInt32 len) {
    UInt32 check = 0;
    data += kUnCryptedHeader / 4;
    len -= kUnCryptedHeader;

    while (len >= 4) {
        *data ^= gKey;
        check += *data;
        data++;
        len -= 4;
    }

    if (len) {
        *((UInt8*)data) ^= gKey >> 24;
        check += (*((UInt8*)data)++) << 24;

        if (len > 1) {
            *((UInt8*)data) ^= (gKey >> 16) & 0xff;
            check += (*((UInt8*)data)++) << 16;

            if (len > 2) {
                *((UInt8*)data) ^= (gKey >> 8) & 0xff;
                check += (*((UInt8*)data)++) << 8;
            }
        }
    }

    return check;
}
```

The global decryption key `gKey` is computed by a simple formula involving an
XOR relationship between the name and registration code: `gKey = name ^ code`.
The actual process is a little more involved, but the name and code can be used
to generate the decryption key (and the decryption key, once known, can be
combined with any name to generate a registration code).

The exact steps to generate the decryption key are:
1. Remove spaces and uppercase the name.
2. Ensure the name is at least 4 characters long.
3. Bitcast the last 4 letters in the name to an int. The name `FREE` is
   represented in hex as `0x46 0x52 0x45 0x45` which yields the int
   `0x46524545`.
4. Create a mask by repeating the last byte of the registration code 4 times.
   The registration code `B3FB09B1EB` gives the mask `0xEBEBEBEB` by repeating
   the last byte `0xEB` four times.
5. Compute the XOR of the first 4 bytes of the registration number and the mask.
   In this case that would be `0xB3FB09B1 ^ 0xEBEBEBEB = 0x5810E25A`.
6. XOR this new value with the number generated from the name to compute the
   decryption key. `0x5810E25A ^ 0x46524545 = 0x1E42A71F`.

Valid registration data will always result in a key of `0x1E42A71F` which is
used to decrypt levels 4 through 10 before decompression.

Even though Jonas released the registration information for free, I thought it
would be fun to generate new registration codes.

## Generating registration codes

Because `gKey = name ^ code`, and XOR is its own inverse, we can compute
registration codes easily with `code = gKey ^ name`. The process is very similar
to the above. Given a name of at least 4 characters (stripped of whitespace):
1. Uppercase the name.
2. Bitcast the last 4 letters in the name to an int.
3. XOR this number with the global key.
4. Generate a mask of 4 repeating bytes (more on this later) and mask the number
   from the previous step.
5. Append the repeated mask byte to the number to generate the registration
   code.

Because the mask[^masking] is just a repeated byte, and is also appended to the
registration code, there isn't any way to know how Jonas originally generated
these codes. I chose to sum the bytes in the name mod `0xFF` to generate the
mask byte. As a concrete example, let's use my name: `NATHAN`.

[^masking]: Without a mask, the process to generate the decryption key would be to simply
XOR the first 4 bytes of the registration code with the last four bytes of the
name. This process is obfuscated slightly with a mask which alters the
registration code so it no longer generates the key without unmasking it.

The last four characters of my name are the integer `0x5448414E`. This number
XORed with the key is `0x4A0AE651`. Summing (mod `0xFF`) the characters in my
name gives `0xBB` which creates the mask `0xBBBBBBBB`. These numbers XORed
together `0x4A0AE651 ^ 0xBBBBBBBB` results in `0xF1B15DEA`. The mask byte
appended to this number (as a string) is the registration code: `F1B15DEABB`.

![Menu showing registered to Nathan Craddock in the lower
right](/images/registered-to-nathan.jpg)

Using one of these codes I generated, we can see that the game (running in a
virtual machine) shows my name in the lower right corner!

## Thoughts

Because I am [rewriting in Zig](/blog/moving-to-zig) this is the second time I
have implemented this decryption and registration logic. The first time the
decryption code was written in C, and the registration code generator in Python.
Implementing both in Zig was a good exercise. Here are some of my thoughts:

* Zig makes me much more aware of memory allocations by requiring passing an
  allocator to any functions that allocate memory. This means I can look at a
  piece of code and know how many allocations it makes without needing to
  traverse all function calls. If a function doesn't take an allocator, neither
  it nor any child function calls will allocate.
* When computing the decryption check value, the value ends up overflowing a
  `u32` multiple times. In C this behavior was assumed but went undetected. My
  Zig implementation uses the `+%=` operator to explicitly allow overflow
  wrapping. Without this, debug and test builds would crash with [runtime
  overflow
  protection](https://ziglang.org/documentation/0.9.1/#Integer-Overflow).
* Continuing this trend, Zig requires me to be much more explicit when casting
  integers.
* I was able to take advantage of the `-|` operator to subtract while saturating
  at 0 to prevent underflow.

Sometimes Zig feels more verbose than C. Reckless Drivin' involves a lot of bit
casting, something that I once thought trivial in C. For example, Zig has forced
me to acknowledge and specify the alignment of byte streams. Even though there
is more up-front work than C, I really appreciate that the language is designed
in a way to more precisely express to the compiler how I want to transform data.
This has led me to write better code as I rewrite Reckless Drivin` in Zig.
