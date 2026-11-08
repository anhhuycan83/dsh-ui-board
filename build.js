import esbuild from 'esbuild';

async function build() {
  console.log('Building client.js with Excalidraw...');
  const result = await esbuild.build({
    entryPoints: ['src/client.jsx'],
    bundle: true,
    format: 'cjs',
    conditions: ['production'],
    loader: {
      '.css': 'text',
      '.png': 'dataurl',
      '.woff2': 'dataurl',
      '.json': 'json'
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    external: ['react', 'react-dom'],
    banner: {
      js: `window.__ModuleLoader__.load({\n  id: "dsh-ui-board",\n  factory: (require) => {\n    var module = { exports: {} };\n    var exports = module.exports;\n`
    },
    footer: {
      js: `\n    return module.exports;\n  }\n});`
    },
    outfile: 'client.js',
    minify: false,
    sourcemap: false
  });
  console.log('Build completed!');
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
