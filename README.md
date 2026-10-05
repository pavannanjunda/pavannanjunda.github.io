# pavannanjunda.github.io

![Deploy](https://github.com/pavannanjunda/pavannanjunda.github.io/actions/workflows/deploy.yml/badge.svg)

My portfolio, live at **https://pavannanjunda.github.io**. It opens on an interactive terminal and also presents the same content as panels: overview, experience, projects, skills and contact.

## How it is built

TypeScript and Vite, with no UI framework and no runtime dependencies. The code is in three layers, each depending only on the one before it:

| Layer | Folder | What it does |
|---|---|---|
| Content | `src/content/` | One typed object holding everything the site says, and a validator that rejects unsafe links and duplicate project names. |
| Shell | `src/shell/` | Pure functions that turn a typed command into structured output lines. No access to the page, so it is tested directly. |
| UI | `src/ui/` | The dashboard, the terminal, the command palette and the section pages. Text is always set as text, never as markup. |

The terminal and the panels both render from the same content object, so they cannot disagree.

## Run it

```bash
npm install
npm run dev     # local site with live reload
npm test        # unit and UI tests (Vitest + jsdom)
npm run build   # type-check and build into dist/
```

Needs Node 20.19 or newer.

## Update it

All content lives in `src/content/content.ts`. Edit it, run `npm test`, and push to `main`. A GitHub Action runs the tests, builds the site and publishes it to GitHub Pages; a failing test blocks the deploy.

## Things to try

- Type `help` in the terminal, or press `Tab` to complete a command.
- Press `Ctrl+K` to jump to any section or project.
- On the Skills page, click a highlighted skill to see which projects used it.
- Link straight to a section, for example `/#projects/defect-detection`.
