# Credits

The **indusagi coding agent** is an independent implementation, designed and written from scratch
against a behavioral specification and the public API of the `indusagi` framework — not by copying
source from any prior codebase. It reuses no third-party application source code.

## indusagi framework

The agent runs entirely on the **indusagi** framework (`file:../indus-rebuild`), which provides the
LLM API abstraction, agent core, terminal-UI primitives, MCP client, and observability. The
framework is itself an independent implementation and ships its own `CREDITS` / `NOTICE`.

## Third-party runtime dependencies

Standard open-source libraries used at runtime, each under its own license:
`react`, `ink`, `chalk`, `strip-ansi`, `@sinclair/typebox`, `zod`, `marked`,
`highlight.js`, `jiti`, `ulid`. Build/dev: `esbuild`, `typescript`, `vitest`.

See `NOTICE` for the notice that must travel with redistributions.
