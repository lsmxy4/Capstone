const fs = require('node:fs');
const cp = require('node:child_process');
const ts = require('./frontend/node_modules/typescript');
const React = require('./frontend/node_modules/react');
const { renderToStaticMarkup } = require('./frontend/node_modules/react-dom/server');

for (const page of ['Landing', 'Login', 'Signup']) {
  const path = `frontend/src/pages/${page}.tsx`;
  let text = fs.readFileSync(path, 'utf8');
  if (page !== 'Login') {
    text = text.replace(/^(type |const features|export default)/gm, '\n$1')
      .replace(/^(  const handle|  const allAgree|  return \()/gm, '\n$1');
  }
  if (page === 'Landing') {
    text = text.replace(/"(page|iconClass|icon|title|description)":/g, '$1:');
  }
  fs.writeFileSync(path, text);

  const original = cp.execFileSync('git', ['show', `HEAD:frontend/src/pages/${page}.jsx`], { encoding: 'utf8' });
  function render(source) {
    const js = ts.transpileModule(source, {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
      fileName: 'Page.tsx',
    }).outputText;
    const module = { exports: {} };
    const requireStub = (id) => {
      if (id === 'react' || id === 'react/jsx-runtime') return require('./frontend/node_modules/' + id);
      return {};
    };
    new Function('require', 'module', 'exports', js)(requireStub, module, module.exports);
    return renderToStaticMarkup(React.createElement(module.exports.default, {}));
  }
  if (render(original) !== render(text)) throw new Error(page + ': rendered HTML changed');
  console.log(page + ': rendered HTML unchanged');
}
