# Portfolio

Pavan N's personal portfolio, presented as an interactive terminal. Visitors type commands such as `help`, `about` and `projects`, or tap the buttons under the prompt. A link like `/#projects` opens straight on that command.

## Run it

```bash
npm install
npm run dev     # local site with live reload
npm test        # unit and UI tests
npm run build   # type-check and build into dist/
```

Needs Node 20.19 or newer.

## Update it

All content lives in `src/content/content.ts`. Edit it, run `npm test` (the tests reject unsafe links and duplicate project names), and push to `main`. The GitHub Action tests, builds and publishes the site to GitHub Pages.
