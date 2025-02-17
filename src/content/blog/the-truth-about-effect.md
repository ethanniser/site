---
title: "The truth about Effect"
pubDate: "Feb 17 2025"
tags: ["effect"]
---

I've been deceiving you all. I had you believe that Effect was a TypeScript library — unlike fp-ts and neverthrow etc, because it shifts work out of the datatype and into the runtime, but a library nonetheless.

But that's not exactly accurate. In my defense, I didn't realise it myself until very recently. But with Effect Days around the corner, it's time to come clean about what Effect really is.

**Effect is a language.**

Specifically, Effect is an attempt to answer a question that many people have asked, and a few have answered: what would it look like if we had a language for describing effectful computations?

A few projects that have answered this question:

- [PureScript](https://www.purescript.org/)
- [ZIO](https://zio.dev/)
- [Koka](https://koka-lang.github.io/koka/doc/index.html)
- ...probably many others

(Koka is an outlier as it's still a research language, but I think it qualifies as an example.)

These projects are all very cool, but there's a reason they haven't hit mass adoption: they want to control the entire world. You can't adopt PureScript or ZIO incrementally, and they need dedicated tooling far beyond just the compiler itself (e.g. syntax highlighting, unless you like your code monochrome). In some cases (PureScript stands out), interop with the JS ecosystem is less than seamless.

Beyond that, they have a steep learning curve, which is hard to justify when there are so many options that are more accessible.

## Thinking inside the box

What if we had a language that was designed for describing effectful computations, but that also worked with your existing tools? What if you didn't need to discard your years of experience using JavaScript, TypeScript, and Node, because it extended those languages and runtimes?

- It would extend `Promise` by making laziness, error handling, retries, interruption, and observability first-class citizens
- It would extend TypeScript by adding typed errors, typed dependency injection, and structured concurrency on top of a fiber-based runtime
- It would extend Node by providing a rich standard library of types, data structures, utilities, and platform APIs
- **It would extend TypeScript by making effects a language primitive**

How do we make effects a language primitive without introducing invalid syntax, or breaking the relationship with existing tooling (like TypeScript)? By making use of existing language features:

- We [use generators](https://effect.website/docs/getting-started/using-generators/) to compose computations in an imperative style that feels familiar to users of `async`/`await`
- We use TypeScript's powerful type system to [track success, errors, and dependencies in a single unified type](https://effect.website/docs/getting-started/the-effect-type/)
- We tie it all together with an ecosystem of modules that work together to create a compounding experience

This, to me, is the best of all possible worlds: we can lean on decades of accumulated wisdom by extending well-known tools and languages, author our code in a delightfully concise and expressive way, and yet still generate apps that are bleeding-edge in terms of performance and everything that goes with it.

---

This is an adaptation of [The truth about Svelte](https://gist.github.com/Rich-Harris/0f910048478c2a6505d1c32185b61934) by Rich Harris.
