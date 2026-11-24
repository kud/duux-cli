#!/usr/bin/env node
// Run React's production build unless the caller chose otherwise (e.g.
// `NODE_ENV=development npm run dev`). The development build roughly doubles
// Ink's CPU per frame on heavy screens. This must happen before react or ink
// is loaded, and static imports are hoisted, so the CLI is imported dynamically.
process.env.NODE_ENV ??= "production"

await import("./cli.js")

export {}
