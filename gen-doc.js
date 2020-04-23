/**
 * @File   : gen-doc.js
 * @Author : 瞬光 (shunguang.dty@antfin.com)
 * @Date   : 1/31/2019, 10:24:56 AM
 * @Description:
 */
const typedoc = require('typedoc');
const path = require('path');
const fs = require('fs');

const sources = [
  path.resolve(__dirname, './src')
];

const options = {
  module: 'commonjs',
  target: 'es5',
  exclude: '**/node_modules/**/*.*',
  experimentalDecorators: true,
  excludeExternals: true,
  out: path.resolve(__dirname, './doc'),
  mode: 'file',
  excludePrivate: true,
  excludeProtected: true,
  tsconfig: path.resolve(__dirname, './tsconfig.json'),
  theme: 'markdown',
  mdEngine: 'github',
  plugin: [
    require.resolve('typedoc-plugin-markdown'),
    require.resolve('typedoc-plugin-no-inherit'),
  ]
};

const typedocApp = new typedoc.Application(options);
const src = typedocApp.expandInputFiles(sources);
const project = typedocApp.convert(src);

if (project) {
  typedocApp.generateDocs(project, options.out);
  const originReadme = fs.readFileSync(path.resolve(__dirname, './README.md'), {encoding: 'utf8'})
    .replace(/#[\S\s]+?\n/, '');
  const readmePath = path.resolve(__dirname, './doc/README.md');
  let readme = fs.readFileSync(readmePath, {encoding: 'utf8'});
  readme = readme
    .replace(originReadme, '')
    .replace(/### Modules[\s\S]+### Classes/g, '### Classes');
  fs.writeFileSync(readmePath, readme);
}
