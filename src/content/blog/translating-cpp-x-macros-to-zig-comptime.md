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

First, there's a lot of repetition going on- register names have to be in the id, string name and offset calculation. Common 'types' of registers have shared ways of calculating size and offset which are repeated. This only increases the chances that when you update something, you could forget to update the 3-10 other places the same symbol or code is used- this is not ideal.

Additionally you might have noticed how I sort of glossed over the definition of the `register_id` enum above, and that's for good reason. See, while it would be ideal to have a single source of truth, the array, and generate the enum members from the array values- this is simply not possible. There is just no way to generate types from runtime values in that way in C++. We have two other options (before moving to macros). One is add even more repetition and declare all 125 `register_id`s, then again all 125 `register_info`s. Option two is to settle for a less specific type and just use a string- but this sacrifices a ton on dx, typesafey, and ability to use exhaustive switch statements.

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

// its like magic !
consteval register_info all_registers[] = doMagic();
```

This exact API is possible through metaprogramming- so let's see what implementing it actually looks like.

## C++ X-Macros

mention it hurts LSP

## Footnotes

1. It's actually not even all of them- just the ones the book covers... man x86 is old and complex
