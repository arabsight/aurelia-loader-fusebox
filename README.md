## aurelia-loader-fusebox

[Demo here](https://github.com/arabsight/aurelia-skeleton-fusebox)

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

## FuseBox simple config example
```js
const { FuseBox, RawPlugin, HTMLPlugin, BabelPlugin } = require('fuse-box');

let fuse = FuseBox.init({
    homeDir: './src',
    output: './dist/$name.js',
    plugins: [
        RawPlugin(['.css']),
        HTMLPlugin({ useDefault: true }),
        BabelPlugin()
    ]
});

fuse.bundle('bundle')
    .instructions(`
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

fuse.run();
```
