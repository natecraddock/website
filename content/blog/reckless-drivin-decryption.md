+++
title = "Reckless Drivin' - Decryption"
date = 2021-03-05
tags = ["reckless-drivin", "c", "programming", "reversing", "decryption"]
draft = true

aliases = [
  "/posts/reckless-drivin-decryption/"
]
+++

The original Reckless Drivin' game cost $12. The first three levels were free to play, with four through
ten being restricted to paying players. When I played the game as a kid I only ever played the first three levels
until Jonas released the game for free after moving on to other projects. I am not aware of what details were involved in the process of registering the game, but after registration the game could be unlocked using the registered name and a
registration code. The free registration information was under the name of **Free** and the code **B3FB09B1EB**.
With this data entered I was able to play all ten levels of the game.

Looking through the source code in `packs.c` I noticed a function `uint32_t CryptData(uint_32_t *data, uint32_t len)`.
Further inspection showed that this function was used to decrypt the level data in levels 4 through 10. The process starts with
setting the global `gKey` used for decryption.
1. Load registration information from the preferences, or prompt the player if this is the first time playing
2. Convert both the name and registration code to uppercase and remove spaces.
3. A function takes the last four letters of the name and creates an integer directly from those ascii values. The name FREE is converted to `0x46524545`. This is stored in `nameNum`.
4. Another function takes the first 8 characters of the registration code and converts to an integer. The last two digits as a char
are bit shifted and then exclusive or-ed with the first 8 characters to generate the `codeNum`. With the free registration code this
looks like `0xB3FB09B1 ^ 0xEBEBEBEB`.
5. The `gKey` is then set to the exclusive or of codeNum and nameNum;

```c
int CheckRegi() {
  uint32_t *nameNum, codeNum;
  Str255 upName;
  Handle check;

  BlockMoveData(gPrefs.name, upName, gPrefs.name[0] + 1);
  UpperString(upName, false);
  StripSpaces(upName);
  nameNum = upName + upName[0] - 3;
  codeNum = CodeStr2Long(gPrefs.code);
  gKey = codeNum ^ *nameNum;
  check = GetResource('Chck', 128);
  gRegistered = CheckPack(kEncryptedPack, **((uint32_t **)check));
  ReleaseResource(check);
  return gRegistered;
}
```

After `gKey` is set a special value is read from the resource fork. "Chck" is a single integer that is passed to `CheckPack()`.
This is the point in which the registration is validated. `CheckPack(int num, uint32_t check)` loads the pack from the resource
fork. In this case, level 4 is used for validating registration.
1. The data is loaded from the resource fork with `GetResource()`.
2. `CryptData()` is run on the resource data. This function iterates over the bytes in the level resource data, doing an exclusive
or with `gKey` for each byte of data. There is some additional logic for when the resource length is not a multiple of four.
3. As the data is being decrypted, a variable `check` is incremented with each piece of decrypted data.
4. If the `check` returned from `CryptData()` is the same as `Chck` in the resource fork, then the data has been decrypted
successfully and the player is allowed to play levels 4 through 10.

Levels 5 through 10 are also encrypted, but the values of `check` returned for these levels are different, so it is not used
for validating the registration.

When actually loading level data, the decryption step occurs before the LZRW decompression.

## Generating Registration Codes

Generating a registration code from a name is a straightforward process. The last four letters of the uppercase name, exclusive
or-ed with the code should produce `gKey`, so knowing that the value of `gKey` should be `0x1E42A71F`, we only need to exclusive
or `gKey` and `nameNum` to generate `codeNum`. I wrote a [Python script](https://github.com/natecraddock/open-reckless-drivin/commit/917bae34ac576304c106b7abec17b393fca1738d) to generate registration keys from names.

The codes are split into two pieces, with the last byte being used for the seed.

```text
B3FB09B1EB becomes 0xB3FB09B1 and  0xEB
```

Without more examples of real registration codes I was unable to determine how the seed was originally created. So I devised my
own algorithm for that which works well enough.
1. Take the first four letters of the registered name, add the chars together and mod by 0xFF.
2. Bit shift the result to each byte of an integer. This is the full seed
3. The result of `gKey ^ nameNum ^ seed` is the first eight letters of the registration key.

To verify that this actually works, I registered under my name and entered the registration information in the game running
under a vm. The game now shows my registration information on the menu!

![Thanks for registering dialog box](/images/thanks-for-registering.jpg)
![Menu showing registered to Nathan Craddock in the lower right](/images/registered-to-nathan.jpg)

It was very rewarding to see my name displayed in a game I never actually registered for. Sadly, the
game is not playable under QEMU. I haven't spent anytime tweaking settings, so there might be a way, but
the goal is to re-implement the game, not just emulate it.

Now that registration and decryption works, the next step is to extract the images stored in the PPic resources.
