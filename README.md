# Portfolio

Pavan N's personal portfolio, styled as a terminal system dashboard: a sidebar of sections, panels of content, and a Terminal section where visitors can type commands such as `help`, `about` and `projects` instead. A link like `/#projects` opens straight on that section.

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
