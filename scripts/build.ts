import { build } from 'esbuild';

build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/main.js',
  platform: 'node',
  minify: false,
  treeShaking: true,
}).then(result => {
  console.log(result);
});
