+++
title = "Reckless Drivin' - LZRW Decompression"
date = 2021-03-03
tags = ["reckless-drivin", "c", "code", "reverse-engineering"]
series = "Reckless Drivin"

aliases = [
  "/posts/reckless-drivin-decompression/"
]
+++

With the information from the resource fork extracted into `unpacked_data` it is now time to
convert this into a readable format.

Rather than trying to understand the structure of the resource fork binary used to generate
`unpacked_data`, I found it simpler
to parse `unpacked_data` into my own format. I created
[scripts/convert.py](https://github.com/natecraddock/open-reckless-drivin/blob/master/scripts/convert.py) for the purpose. I took each
resource like `data 'Pack' (128, "Object Definitions") {...}` and converted it into a struct like
the following.

```c
struct Data {
    char type[8];
    uint32_t id;
    uint32_t length;
    char *data;
};
```

This data is stored end-to-end in a file called `data`. Rather than reading this from a file at runtime
I decided to store the binary data directly in the executable. This is easily done with the linker command

```bash
$ ld -r -b binary data -o packs.o
```

to create an object file that can be linked with the executable. It is accessible through C code with
the following externs.

```c
extern unsigned char _binary_data_start[];
extern const unsigned char _binary_data_end[];
extern unsigned _binary_data_size;
```

Reading this data from C code becomes a matter of simply searching through the data,
and jumping over each resource based off the length of the current resource. With only
33 resources the search speed is very fast.

## LZRW Decompression

With the data in a format readable from C code it was time to actually interpret the data! There
were a few calls to `LZRWDecodeHandle()` throughout the original source code. A resource would be passed
to this function after reading it from the resource fork. Some research revealed that LZRW is a decompression
algorithm created by Ross Williams in the 1990s. His [website](https://web.archive.org/web/20060707195328/http://www.ross.net/compression/)
gives a lot more information on the history and variants of the algorithm.

In short, LZRW is a member of the Lempel Ziv family of compressors and is intended
to be a very fast compressor based on storing repeated data in a hash table.

Through trial and error I was able to determine that the data was in fact compressed with
the LZRW3 algorithm. At the time this was an educated guess, based on the fact that the
data decompressed without memory errors. I would later find out that LZRW3-a was a variant
that also decompressed without memory errors, but gave accurate data.
Following is the first 160 bytes of PPic 1000 after decompression.

```text
00000000: 7f10 0000 0000 01e0 0280 0011 02ff 0c00  ................
00000010: fffe 0000 0048 0000 0048 0000 0000 0000  .....H...H......
00000020: 01e0 0280 0000 0000 00a1 01f2 0016 3842  ..............8B
00000030: 494d 0000 0000 0000 01e0 0280 4772 8970  IM..........Gr.p
00000040: 68af 626a 0001 000a 0000 0000 01e0 0280  h.bj............
00000050: 009a 0000 00ff 8500 0000 0000 01e0 0280  ................
00000060: 0000 0003 0000 0000 0048 0000 0048 0000  .........H...H..
00000070: 0010 0010 0003 0005 0000 0000 0000 0000  ................
00000080: 0000 0000 0000 0000 01e0 0280 0000 0000  ................
00000090: 01e0 0280 0040 0106 ef4e 590d 4e79 4e79  .....@...NY.NyNy
```

I created `resource_test.c` for easily testing the extraction of resources from
the packed data.

After decompressing the data there are two low-hanging-fruits to pick.
* Decrypting the level data. Levels 4 through 10 are encrypted. The levels would only
be decrypted when the copy of the game was registered. This data is decrypted before
passing to the LZRW algorithm, so trying to decompress these resources would fail.
* Reading the images in the PPic resources. The PPic resources are passed to the
`DrawPicture()` function, which some searches showed was part of Apple's QuickDraw image
format.

Later posts will explore each of these in depth.
