---
title: "Effect Best Practices"
description: "Some tips to write good Effect code"
pubDate: "Aug 02 2024"
---

*This is a living document I hope to continuously update over time.*

[Effect](https://effect.website) is super powerful, but it can be a bit tricky sometimes. Here are some tips I've gathered from my time using it.

This document has three sections:
 - [Best Practices](#best-practices): General tips to keep in mind
 - [Pitfalls](#pitfalls): Mistakes to avoid
 - [Snippets](#snippets): Useful code snippets

Have a tip you think should be added? [Let me know](https://twitter.com/ethanniser)!

## Best Practices

### If an operation is fallible, even if it is not asynchronous, it should be an `Effect` and not an `Either`
Use `Either` (and `Option`) to describe **data**, not computations

### Avoid `any`s and `unknown`s at **all costs** (unless you know what you're doing)
Especially in the error channel, `unknown` is a big no-no - use `Cause.UnknownException` if you have this case

### When dealing with `Cause` you probably want to use `Cause.failureOrCause`
`Cause` is kind of a really annoying type to work work (because it makes you consider all of the cases you didn't before), and it turns out there is a lot of ways to describe the failure of a computation.

`Cause.failureOrCause` will turn `Cause<E>` into `Either<E, Cause<never>>`, giving you either the expected error `E` or *some* unknown unexpected error (defect, interrupt, a combination, etc.) without having to pattern match on all of the cases yourself

### Embrace immutability
Effect provides a huge library of utilities to work with immutable data structures, use them!

The `Struct` and `Record` modules are really nice here

### If you need to get the current time, use `Effect.clockWith(c => c.currentTimeMillis)` instead of `Effect.sync(() => Date.now())`
This will allow you to test time-dependent code

### If you ever want to share a built service (the output of a `Layer`) between 'runs' of effects, you need to construct your own `Runtime` and reuse that across 'runs'
Almost always the best way to do this is with `ManagedRuntime`, you give it a layer and get access to all of the `run*` functions as well as the raw runtime if needed. 

Just be aware you are now responsible for managing the scope of the layers, you can do this with `managedRuntime.dispose()`

## Pitfalls

### "Swallowing" errors

This is surprisingly easy to do and extremely harmful to your code
```ts
Effect.tryPromise({
  try: () => someLibraryFunc(),
  catch: () => new LibraryError()
})
// You'll know there was a FooError, 
// but you won't know where it came from or what caused it!
```

I would reccomend basically all of your error types should have a `cause: unknown` field for this reason. There is basically no downside. 

At the very least, log it out or do something with it, don't just throw it away. Effect makes it easy to know there was an error, but after that your stuck puzzled on why the 'library' decided to fail with nothing to go on.

### Be very careful with `Effect.catchAll` and `Effect.retry`

Again on swallowing errors, these both can make it exetremely easy to do that

Having good tracing helps a lot here, you really should aim to have a span that tracks any errors that happen **before** you recover from them

### Using `Effect.withSpan` just outside of `Effect.either`

This one is really sneaky
```ts
const result = pipe(
  effectThatMayFail,
  Effect.either,
  Effect.withSpan('someSpan'),
)
// The span will never be a 'failure' 
// because the error got moved to the success channel!
```

Put the `withSpan` inside the `Effect.either` to avoid this and maintain full observability


### Checking the truthiness of an `Option`
It's an object, so it will always be truthy. Use `Option.isSome` or `Option.isNone` instead.

### By default, RPC transport errors are considered defects
This may not always be what you want. The alternative is either `catchAllDefect` which is not the most safe and could catch some other non-transport error, or writing your own resolver that handle transport errors differently.

## Snippets

### A schema transformation that can only go one way
```ts
Schema.transformOrFail(From, To, {
  decode: (from) => fromToTo(from),
  encode: (to, _, ast) => 
    Effect.fail(
      new ParseResult.Forbidden(
        ast,
        to,
        "This schema can only be used for decoding"
      )
    )
})
```

This will produce a `ParseError` if you try to encode

### Throttling a stream into `Chunk`s based on a `Schedule`
```ts
Stream.aggregateWithin(
  Sink.collectAll()
  Schedule.exponential('100 millis', 3).pipe(
    Schedule.intersect(Schedule.recurs(3)),
    Schedule.andThen(Schedule.spaced('2 seconds'))
  )
)
```
This will turn `Stream<A>` into `Stream<Chunk<A>>` where each chunk is the result of aggregating elements that arrive within the periods defined by the schedule

---

Have a tip you think should be added? [Let me know](https://twitter.com/ethanniser)!