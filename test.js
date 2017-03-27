const path = require('path');
const { FuseBox, BabelPlugin, HTMLPlugin } = require('fsbx');

process.env.FUSEBOX_DIST_ROOT = __dirname;
process.env.PROJECT_NODE_MODULES = path.join(__dirname, 'node_modules');

let fuse = FuseBox.init({
    homeDir: `${ __dirname }/`,
    output: `${ __dirname }/.fusebox/$name.js`,
    log: false,
    cache: false,
    plugins: [BabelPlugin(), HTMLPlugin()]
});

fuse.bundle('test')
    .instructions(`> test/loader.spec.js + test/**/*.{js,html}`);

fuse.run();
