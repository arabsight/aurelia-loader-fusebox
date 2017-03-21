## aurelia-loader-fusebox

[demo here](https://github.com/arabsight/aurelia-skeleton-fusebox)

## Install:
```
npm i -S aurelia-loader-fusebox aurelia-bootstrapper aurelia-framework
npm i -D fuse-box
```

## Usage
```js
import 'aurelia-loader-fusebox';
import 'aurelia-bootstrapper';

export function configure(aurelia) {
    // ...
}
```

## FuseBox config example
```js
const { FuseBox, RawPlugin, HTMLPlugin, BabelPlugin } = require('fuse-box');

let fuse = FuseBox.init({
    homeDir: './src',
    outFile: './dist/bundle.js',
    sourcemaps: true,
    plugins: [
        RawPlugin(['.css']),
        HTMLPlugin({ useDefault: true }),
        BabelPlugin()
    ]
});

fuse.devServer(`
    > main.js
    + **/*.{js,html,css}
    + aurelia-bootstrapper
    + aurelia-pal-browser
    + aurelia-framework
    + aurelia-logging-console
    + aurelia-templating-binding
    + aurelia-history-browser
    + aurelia-templating-resources
    + aurelia-templating-router
`);
```
