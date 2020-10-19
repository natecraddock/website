---
title: Reckless Drivin' Part 01 - Cleanup
date: 2020-07-23 20:00:00 -7
modified: 2020-10-17 20:00:00 -7
tags: ["reckless-drivin", "c", "code"]
---

One of my favorite games is [Reckless Drivin'](http://jonasechterhoff.com/Reckless_Drivin.html), an old shareware Mac game from 2000 created by Jonas Echterhoff. Originally written for PowerPC architecture, it has become difficult to play these days.

<img class="full-bleed" src="https://static.macupdate.com/screenshots/868/m/reckless-driving-screenshot.png" alt="Screenshot of Reckless Drivin' with burnt cars">

I wanted a way to play the game again. The original game is still available on it's website at [http://jonasechterhoff.com/Reckless_Drivin.html](http://jonasechterhoff.com/Reckless_Drivin.html). I decided to reverse-engineer the game to be able to play it on modern devices which is a huge task. In my initial research I decided to search "Reckless Drivin'" on GitHub, and it turns out Jonas uploaded the original source code within the last year. [https://github.com/jechter/RecklessDrivin](https://github.com/jechter/RecklessDrivin)

This makes rewriting the game for modern machines a much easier task, but one still full of many difficulties. Here I'll document my progress in restoring this game. My repository is [https://github.com/natecraddock/reckless-drivin](https://github.com/natecraddock/reckless-drivin).

# Cleanup

After forking and cloning the repository, it became immediately clear that some initial cleanup was required before modifying the code. The style didn't match my preferences, and there were many types that needed replacing from the Mac SDKs.

<div class="full-bleed">

```c
void main()
{
	Init();
	while(!gExit) 
		if(gGameOn) GameFrame();
		else Eventloop();
	Exit();
}
```

</div>

After replacing types and keywords like `nil`, `UInt32`, and `Boolean`, with `NULL`, `uint32_t`, and `bool`, I also created a few [typedefs](https://github.com/natecraddock/reckless-drivin/commit/32b723c0aa32c9c7005efbd88b1cf57814c87306) for types common throughout the source code. Statements like

<div class="full-bleed">

```c
typedef unsigned char Str15[16];
typedef char *Ptr;
typedef Ptr *Handle;
```

</div>

are common throughout the code, and searches through Apple's Developer archives explained the meaning of many types in the code.

One note in the original readme states
> "The resource forks of the rsrc files have been moved to the data fork."

I had no idea what that meant. After some searching I learned that old Macintosh file systems supported a "fork or section of a file used to store structured data." The original resource fork stored the sprites, sounds, textures, level data, and other important assets of the game. Those resources had been copied to the data fork and were stored in the `Data` file.

I borrowed a Mac and ran the following command to extract the resources from the data fork into a text file.

<div class="full-bleed">

```text
$ derez -useDF Data > unpacked_data
$ cat unpacked_data
data 'Pack' (128, "Object Definitions") {
	$"0000 2C78 0000 0000 A010 009E 0000 0001"
	$"0280 0102 04F8 0081 0102 0538 0022 2282"
	$"0204 7800 8302 01B8 0084 0201 F800 8501"
	$"0106 3844 4400 8602 0578 0087 0202 B800"
	$"8802 02F8 0089 0101 0788 8838 008A 0206"
	$"7800 8B02 03B8 008C 0203 F800 8D01 0110"
	$"1108 3800 8E02 0778 008F 0204 B800 9002"
	$"00F8 0091 2122 0100 0938 0092 0200 7800"
	$"9302 00B8 0094 0200 F800 4244 9501 000A"
	$"3800 9602 0178 0097 0201 B800 9802 01F8"
	$"8488 0099 0100 0B38 009A 0202 7800 9B02"
	$"02B8 009C 0202 4888 F800 9D01 000C 3853"
...
```

</div>

Now we have the resources for the game. The next step is to parse this file into a readable binary format and pack it into the executable.
