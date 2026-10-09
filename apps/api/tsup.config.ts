import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts', 'src/verification/worker.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  sourcemap: true,
  clean: true,
  // Workspace packages are TypeScript sources — bundle them into the build.
  noExternal: [/^@ttg\//],
});
