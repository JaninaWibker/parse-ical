# parse-ical

This is but a simple library that does ical parsing.
It doesn't support every ical feature out there but should be enough for most use cases.

The api is relatively simple, parsing is split into two functions:

- `parse`: turns the ical string into an exact replica, just as a javascript object instead of text (a syntax tree).
- `transform`: turns the previous syntax tree into a more usable object, fields get parsed into their respective types (dates, rrule, etc.), a few constraints are checked, some things are prettified and normalized

This split is done in order to easily extend upon the library.
If something is not getting parsed as you'd like just grab the syntax tree and add whatever you require

Everything is properly typed as it should be.
Both ESM and CJS are supported.


## Installation

```sh
npm install parse-ical
pnpm add parse-ical
yarn add parse-ical
bun add parse-ical
```

> [!NOTE]
> Make sure to use `"moduleResolution": "bundler"` in your `tsconfig.json` if you are using ESM.
> `"moduleResolution": "node"` **doesn't** support the `exports` field in `package.json` and thus is not able to import the package.
> This is not easy to debug and often overlooked.


## Usage

```ts
import { parse, transform } from 'parse-ical'

const { events, metadata } = transform(parse(`
BEGIN:VCALENDAR
[...]
END:VCALENDAR
`))
```


## Types

See [`src/types.ts`](src/types.ts) or check your editor's autocomplete / LSP.
The following types are the most important:

- `CalendarEvent`
- `CalendarMetadata`

These types reference the following types:

- `Property`
- `Properties`
- `CalendarDate`
- `RRule` ([rrule](https://github.com/jkbrzt/rrule) is the only dependency)

As for `parse` and `transform`:

```ts
const parse: (input: string) => Component
const transform: (syntaxTree: Component) => {
  metadata: CalendarMetadata
  events: CalendarEvent[]
}
```


## License

MIT License
