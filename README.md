# Web Merge React Component Library

Opinionated React component primitives shipped as a TypeScript library. Build artifacts land under `dist/` and the `TemplateEditor` component is the exported entry point; placeholder values originate from your data layer (no inline editing in the canvas), while the editor surface now runs a TipTap-powered WYSIWYG canvas with formatting commands, table support, and the ability to edit section content before insertion.

## Getting started

1. Install via npm: `npm install web-merge`
2. Ensure the peer dependencies are available in your app: `react` and `react-dom`.
3. Import `{ Button }` from the package and use it like any other React component:

   ```tsx
   import { Button } from 'web-merge';

   export default function App() {
     return (
       <Button variant="primary" onClick={() => alert('clicked')}>
         Click me
       </Button>
     );
   }
   ```

## Development

- `npm run dev` spins up `tsup` in watch mode for rapid feedback.
- `npm run build` emits `cjs`, `esm`, and type declaration files under `dist/`.
- `npm run storybook` launches Storybook (on https://localhost:6006 by default) to preview components and run the auto-generated docs.
- `npm run build-storybook` outputs a static Storybook bundle for hosting.

## Package layout

- `src/` holds the source implementation.
- `tsconfig.json` aligns TypeScript with the library output.
- `tsup.config.ts` controls the bundling targets and declaration generation.
- Storybook source lives under `.storybook/` with the template editor story at `src/components/TemplateEditor.stories.tsx`, which shows how placeholders expose a toggle button at the start (Insert value/Insert section) that switches the insertion mode before you drop the placeholder into the template, keeping the toolbar compact.
- `src/components/TemplateEditor.tsx` showcases how to edit Mustache-style templates, insert placeholders, and preview conditional sections; documented in `src/components/TemplateEditor.stories.tsx`.
