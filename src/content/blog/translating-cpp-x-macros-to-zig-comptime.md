---
title: "Translating C++ X-macros to Zig Comptime"
pubDate: "Apr 06 2025"
tags: ["zig", "c++", "metaprogramming"]
---

I'm currently going through ['Building a Debugger' by Sy Brand](https://nostarch.com/building-a-debugger) but implementing it in [Zig](https://ziglang.org/) as opposed to the C++ the book is in. So far this has been a pretty enjoyable experience.

In Chapter 5 of the book, we go through the process of defining a `RegisterInfo` data type representing information (name, size, type, memory location, etc.) for a given register. Then, instantating the ***125 instances*** of it needed to represent all of the registers on x86-64 \[1\]. This obviously is no small feat, but through the power of metaprogramming a lot of the boilerplate can be cut down.

The book achieves this using the C/C++ preprocessor through a technichque called 'X-macros'. However in my Zig implementation I used one of Zig's selling point features: [comptime](https://ziglang.org/documentation/0.14.0/#comptime) to achieve the same result but in a much more elegant and maintainable way (imo).

I'll start by giving a brief overview of the C++ X-macro based solution, then move on to my Zig comptime based solution and we can see how they compare.

## The Objective

Let's look at some more concrete code for what we are working with:

```cpp
enum class register_id { ... };

enum class register_type {
    gpr, sub_gpr, fpr, dr
};

enum class register_format {
    uint, double_float, long_double, vector
};

struct register_info {
    register_id id;
    std::string_view name;
    std::int32_t dwarf_id;
    std::size_t size;
    std::size_t offset;
    register_type type;
    register_format format;
};

// An array of all 125 `register_info` structs
consteval register_info all_registers[] = { ... };
```

As I mentioned our end goal is to have a single array (ideally computed at compile time) containing a `register_info` struct for all 125 registers we want to represent. 

Keep in mind there are 10 different "types" of registers we work with all of which have their own pattern for computing these info values.

Your first thought might be to just define the array in terms of array and struct literals, even if its long. Let's see what that might look like:

```cpp
consteval register_info all_registers[] = {
  {
    register_id::rax,
    "rax",
    0,
    8,
    (offsetof(user, regs) + offsetof(user_regs_struct, rax)),
    register_type::gpr,
    register_format::uint
  },
  {
    register_id::rdx,
    "rdx",
    1,
    8,
    (offsetof(user, regs) + offsetof(user_regs_struct, rcx)),
    register_type::gpr,
    register_format::uint
  },
  // ... more general purpose 64 bit registers

  {
    register_id::eax,
    "edx",
    -1,
    4,
    (offsetof(user, regs) + offsetof(user_regs_struct, rax)),
    register_type::gpr,
    register_format::uint
  },
  {
    register_id::ah,
    "ah",
    -1,
    1,
    (offsetof(user, regs) + offsetof(user_regs_struct, rax) + 1),
    register_type::gpr,
    register_format::uint
  },
  // ... more gpr 32, 16, 8h, 8l registers

  {
    register_id::fcw,
    "fcw",
    65,
    sizeof(user_fpregs_struct::cdw),
    (offsetof(user, i387) + offsetof(user_fpregs_struct, cwd)),
    register_type::fpr,
    register_format::uint
  },
  // ... more floating point registers

  {
    register_id::xmm1,
    "xmm1",
    17 + 1,
    16,
    (offsetof(user, i387) + offsetof(user_fpregs_struct, xmm_space) + 16 * 1),
    register_type::fpr,
    register_format::vector
  },
  // ... more vector registers
};

```

Ok I think you get the point. But why is this not a good idea?

First, there's a lot of repetition going on- register names have to be in the id, string name and offset calculation. Common 'types' of registers have shared ways of calculating size and offset which are repeated. This only increases the chances that when you update something, you could forget to update the 3-10 other places the same symbol or calculation is used- this is not ideal.

Additionally you might have noticed how I sort of glossed over the definition of the `register_id` enum above, and that's for good reason. See, while it would be ideal to have a single source of truth, the array, and generate the enum members from the array values- this is simply not possible. There is just no way to generate types from runtime values in that way in C++. We have two other options (before moving to macros). One is add even more repetition and declare all 125 `register_id`s, then again all 125 `register_info`s. Option two is to settle for a less specific type and just use a string- but this sacrifices a ton on dx: no autocomplete, less typesafey, and no ability to use exhaustive switch statements.

What we really want is basically out own declarative DSL for generating these `register_info`s and let something compile that DSL into the final array of structs:

```cpp
// ...
DEFINE_GPR_32(eax, rax), DEFINE_GPR_32(edx, rdx),
// ...
DEFINE_GPR_16(ax, rax), DEFINE_GPR_16(dx, rdx),
// ...
DEFINE_GPR_8H(ah, rax), DEFINE_GPR_8H(dh, rdx),
// ...
DEFINE_GPR_8L(al, rax), DEFINE_GPR_8L(dl, rdx),
// ...
DEFINE_FPR(fcw, 65, cwd), DEFINE_FPR(fsw, 66, swd),
// ...
DEFINE_FP_ST(0), DEFINE_FP_ST(1), DEFINE_FP_ST(2), DEFINE_FP_ST(3),
// ...
DEFINE_FP_MM(0), DEFINE_FP_MM(1), DEFINE_FP_MM(2), DEFINE_FP_MM(3),
// ...
DEFINE_FP_XMM(0), DEFINE_FP_XMM(1), DEFINE_FP_XMM(2), DEFINE_FP_XMM(3),
// ...

consteval register_info all_registers[] = doMagic();
```

This exact API is possible through metaprogramming- so let's see what implementing it actually looks like.

## C++ X-Macros

X-macros take advantage of the ability to dynamic define, undef and redefine macros in C/C++.


We start by defining all of our data using a macro we haven't yet defined. Then, anywhere we want to use that data, we can define what the macro evaluates to based on what data is needed and in what format.

For an example we will define a list of people, each with a string name and int age. Then generate a enum of all of their names, and a function to print out all of the information.

The first step is defining the data. The macro could be named anything but we'll call it `X` with the signature `X(name, age)`.

```c
// "x.h"

#define PAST_RETIREMENT(x) x + 65

X(bob, 32)
X(steve, 19)
X(scott, PAST_RETIREMENT(12))
```

In this file we use the macro to define 3 different people. Notice how can can use other macros to encapsulate other calculations as needed.

Now, we'll define the enum of all of the names:

```cpp
// foo.cpp

enum class names {
  // todo!
};
```

Next, inside the enum we'll include the header file we just wrote which will place all of the `X` macro calls inside the enum body:

```cpp
// foo.cpp

enum class names {
  #include "x.h"
};
```

Finally, we can define `X` just around this inclusion to evaluate to just the `name` argument (with a comma at the end):

```cpp
// foo.cpp

enum class names {
  #define X(name, age) name,
  #include "x.h"
  #undef X
};
```

Hopefully now you can see how this works, let's move on to the print function:

```cpp
// foo.cpp

enum class names {
  #define X(name, age) name,
  #include "x.h"
  #undef X
};

void print_all_people() {
  #define X(name, age) printf("%s is %d years old", #name, age);
  #include "x.h"
  #undef X
};
```

Here notice how `name` is prefixed with a `#`. This puts it in quotes, making it a string. If we don't do that it is just normal unquoted source code- this is how the enum declaration is possible.

If we run the C/C++ preprocessor we can examine the generated output:

```
g++ -E foo.cpp -o foo.i
```

```cpp
// foo.i

# 1 "foo.cpp"
# 1 "<built-in>" 1
# 1 "<built-in>" 3
# 439 "<built-in>" 3
# 1 "<command line>" 1
# 1 "<built-in>" 2
# 1 "foo.cpp" 2
enum class names {

# 1 "./x.h" 1


bob,
steve,
scott,
# 4 "foo.cpp" 2

};

void print_all_people() {

# 1 "./x.h" 1


printf("%s is %d years old", "bob", 32);
printf("%s is %d years old", "steve", 19);
printf("%s is %d years old", "scott", 12 + 65);
# 10 "foo.cpp" 2

};

```

The X-macro used for the register definitions looks like this:

```cpp
enum class register_id {
    #define DEFINE_REGISTER(name,dwarf_id,size,offset,type,format) name
    #include <libsdb/detail/registers.inc>
    #undef DEFINE_REGISTER
};
inline constexpr const register_info g_register_infos[] = {
    #define DEFINE_REGISTER(name,dwarf_id,size,offset,type,format) \
        { register_id::name, #name, dwarf_id, size, offset, type, format }
    #include <libsdb/detail/registers.inc>
    #undef DEFINE_REGISTER
};
```

And all of the other macros used in the "objective" snippet from earlier are simply ways to share common logic for how to call `DEFINE_REGISTER` for different register types:

```cpp
#define GPR_OFFSET(reg) (offsetof(user, regs) + offsetof(user_regs_struct, reg))

#define DEFINE_GPR_64(name,dwarf_id) \
    DEFINE_REGISTER(name, dwarf_id, 8, GPR_OFFSET(name),\
     register_type::gpr, register_format::uint)

#define DEFINE_GPR_32(name,super) \
    DEFINE_REGISTER(name, -1, 4, GPR_OFFSET(super),\
     register_type::sub_gpr, register_format::uint)
     
#define DEFINE_GPR_16(name,super) \
    DEFINE_REGISTER(name, -1, 2, GPR_OFFSET(super),\
     register_type::sub_gpr, register_format::uint)
     
#define DEFINE_GPR_8H(name,super) \
 DEFINE_REGISTER(name, -1, 1, GPR_OFFSET(super) + 1,\
     register_type::sub_gpr, register_format::uint)
     
#define DEFINE_GPR_8L(name,super) \
    DEFINE_REGISTER(name, -1, 1, GPR_OFFSET(super),\
     register_type::sub_gpr, register_format::uint)
```

So now hopefully with a strong understanding of the C++ solution. Let's see how Zig does things a bit differently.

## Zig Comptime

## Footnotes

1. It's actually not even all of them- just the ones the book covers... man x86 is old and complex
