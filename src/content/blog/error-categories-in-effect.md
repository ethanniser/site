---
title: "Error Categories in Effect"
description: "A pattern for grouping errors into categories in Effect"
pubDate: "Jun 05 2025"
tags: ["effect"]
---

Errors in Effect often take the form of `TaggedError`s which extend the global `Error` class, have a unique string `_tag` and additional custom properties:

```ts
class FooError extends S.TaggedError<FooError>()("FooError", {
  bar: S.String
}) {}

const foo = Effect.gen(function* () {
  if (Math.random() > 0.5) {
    yield* Effect.fail(new FooError({ bar: "jfdsk" }))
  }
})

const handled = foo.pipe(
  Effect.catchTag("FooError", (e) => Effect.log("recovered", e.bar))
)
```

## The Problem

While handling errors one at a time by their `_tag` is very easy to do by default, this level of granularity can become difficult to manage as the number of errors in your application grows. Often, you simply want to group errors into "categories" which you can discriminate against.

Outside of Effect, inheritance is the common pattern by which to implement this. Errors in a category share a base class, and `instanceof` can be used to discriminate:

```ts
abstract class CategoryA extends Error {}

abstract class CategoryB extends Error {}

class FooError extends CategoryA {}
class BarError extends CategoryA {}
class BazError extends CategoryB {}

try {
  // ...
} catch (error) {
  if (error instanceof CategoryA) {
    // do A
  } else if (error instanceof CategoryB) {
    // do B
  } else {
    throw error
  }
}
```

However this doesn't work in Effect because javascript does not support multiple inheritance, and we are already extending the `TaggedError` class from Effect! Oh what shall we do...

## Mixins (and composition) to the rescuse

Mixins, despite their fancy name, are remarkably simple. They are basically functions that take in a class and return a new class. Surprisingly this is a pattern that has [a whole page to it's own](https://www.typescriptlang.org/docs/handbook/mixins.html) in the official typescript docs.

```ts
type Class<T = {}> = new(...args: any[]) => T

const Mixin = <T extends Class<{ message: string }>>(Base: T) =>
  class extends Base {
    get message2() {
      return this.message + this.message
    }
  }

class MyError extends Mixin(Error) {
  message = "hi"
}

const e = new MyError()
console.log(e.message2) // "hihi"
```

There's a couple cool things about this. First is that everything is fully typed- typescript can infer the type of the class returned from the mixin and merge it with any class you extend from it, and we can even provide constraints on what classes can be passed into the mixin.

Also because a mixin is *just a function*, we can do all sorts of cool functional things like composition. I'm sure you've heard of "*composition over inheritance*" before and this pattern is that saying to a T. 

Additionally, because mixins are *just* functions, we can use our favorite utility from Effect: `pipe`

```ts
import { pipe } from "effect"

type Class<T = {}> = new (...args: any[]) => T

const Mixin1 = <T extends Class>(Base: T) =>
  class extends Base {
    one = true
  }

const Mixin2 = <T extends Class>(Base: T) =>
  class extends Base {
    two = true
  }

class MyError extends pipe(Error, Mixin1, Mixin2) {}

const e = new MyError()
console.log(e.one && e.two) // true
```

## Back to categories

Ok so mixins are a cool pattern, but how does this help us with our error categorization problem?

Well we can start by making a unique interface for each category:

```ts
const CategoryA = Symbol.for("CategoryA")
interface A {
  readonly [CategoryA]: true
}

const CategoryB = Symbol.for("CategoryB")
interface B {
  readonly [CategoryB]: true
  double(): number
}
```

Then we can create a mixin which adds the necessary properties for the interface to the provided class:

```ts
const AMixin = <T extends Class>(Base: T) =>
  class extends Base implements A {
    readonly [CategoryA] = true as const
  }

const BMixin = <T extends Class<{ x: number }>>(Base: T) =>
  class extends Base implements B {
    readonly [CategoryB] = true as const

    double() {
      return 2 * this.x
    }
  }
```

Now we can take our `TaggedError`s from before, and just `pipe` them into the category mixins they belong to:

```ts
class FooError extends Schema.TaggedError<FooError>()("FooError", {
}) {}

class BarError extends Schema.TaggedError<BarError>()("BarError", {
  x: Schema.Number
}).pipe(AMixin) {}

class BazError extends Schema.TaggedError<BazError>()("BazError", {
  x: Schema.Number
}).pipe(AMixin, BMixin) {}
```

Next, we can add some utility functions to make working with these categories just as nice as working with `_tag`s.

First, we add a type guard:

```ts
const hasCategory =
  <Category extends symbol>(sym: Category) =>
  <A,>(x: A): x is Extract<A, Record<Category, any>> => {
    return Predicate.hasProperty(x, sym)
  }
```

Next, using that guard we can write a `catchCategory` function which works just like `catchTag` but on categories instead of tags. Just like `catchTag` it properly narrows the output type to not include caught errors:


```ts
const catchCategory =
  <E, Category extends symbol, B, E2, R2>(
    category: Category
    f: (error: Extract<E, Record<Category, any>>) => Effect.Effect<B, E2, R2>,
  ) =>
  <A, R>(
    effect: Effect.Effect<A, E, R>
  ): Effect.Effect<A | B, Exclude<E, Record<Category, any>> | E2, R | R2> =>
    Effect.catchIf(effect, hasCategory(category), f) as any

declare const example: Effect.Effect<void, FooError | BarError | BazError>

//  test1: Effect.Effect<void, FooError>
//  only FooError left (A's removed)
const test1 = example.pipe(
  catchCategory(CategoryA, (error) => Effect.void)
)

// example of using added behavior
const test2 = example.pipe(
  catchCategory(CategoryB, (error) => Effect.log(error.double()))
)
```

## Conclusion

This pattern is pretty neat, decently practical and doesn't impact any of the existing `_tag` ways of interacting with errors.

Check it out and let me know what you think. Here is a [link](https://effect.website/play#639a05accaf7) to a full example in the Effect playground.

Thank you to Tim Smart for his feedback on this pattern and for authoring the `catchCategory` function.
