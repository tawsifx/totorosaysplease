# Pixel Art (Totoro Dhaka Date RPG) — Workspace Rules

## 1. Documentation & Coding Guardrails
- **Mandatory Context7 Query Before Coding**:
  Before writing, modifying, refactoring, or configuring code that utilizes external libraries, frameworks, APIs, SDKs, or tools (e.g., Phaser, Vite, Rollup, Playwright, Web Audio API, IndexedDB, Canvas APIs):
  1. **Resolve Library ID**: Call `call_mcp_tool` on server `context7` with tool `resolve-library-id` and the library name (unless the `/org/project` slug is already known).
  2. **Query Official Docs**: Call `call_mcp_tool` on server `context7` with tool `query-docs` using the resolved `libraryId` and the specific query/topic before implementing any code changes.
  3. **Exceptions**: Pure algorithmic logic, language-native data transformations, or general refactorings with no external library or platform API dependency.

## 2. Project Architecture & Quality Standards
- **Testing**: Maintain 100% test pass rate across the Playwright suite (`npx playwright test`).
- **Code Splitting**: Preserve Rollup chunking configuration in `vite.config.js` (`chunk-storage-db`, `chunk-audio-engine`, `chunk-games-suite`, `chunk-game-configs`).
- **Storage**: Use the `IndexedDatabase` engine (`TotoroDhakaDB`) in `js/storage/db.js` for persistent game states and user discoveries.
- **Audio & Media**: Keep audio assets compressed (e.g., AAC/M4A 96kbps or MP3) with background music toggles available in minigames.
- **Deployment**: Verify production builds (`npm run build`) and maintain zero regression on Lighthouse Accessibility (100) and Best Practices (100). The primary production deployment is hosted on **Cloudflare Pages** (`https://totorosaysplease.pages.dev`). All legacy Vercel links (`totorosaysplease.vercel.app`) permanently redirect (HTTP 308 with immutable cache + synchronous client-side guard) to Cloudflare Pages. Deployments to Cloudflare Pages are performed via `npm run deploy:cf`.
