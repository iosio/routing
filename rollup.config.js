import alias from 'rollup-plugin-alias';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import url from 'rollup-plugin-url';
import resolve from 'rollup-plugin-node-resolve';
import {DEFAULT_EXTENSIONS} from '@babel/core';
import babel from 'rollup-plugin-babel';
import indexHTML from 'rollup-plugin-index-html';
import {terser} from "rollup-plugin-terser";
import filesize from "rollup-plugin-filesize";
import path from 'path';
import {exec} from 'child_process';

import pkg from './package.json';


const ex = (cmd) => new Promise((resolve) => exec(cmd, resolve));
const dipOut = (msg) => (console.error(msg), process.exit());
const external = (id) => !id.startsWith('.') && !id.startsWith('/');

const {PROJECTS} = pkg;

const {SERVE, BUILD_LIB, BUILD_APP, PROJECT, APP_ENV} = process.env;

const ACTIONS = ['SERVE', 'BUILD_LIB', 'BUILD_APP'];

if (!([!!BUILD_APP, !!BUILD_LIB, !!SERVE].includes(true))) dipOut(`No action detected. Must include one of: (${ACTIONS})`);
if (!PROJECT) dipOut('no project defined');

let project = PROJECTS[PROJECT];

if (!project) dipOut('project not defined in package.json');
if (!project.src) dipOut('src not defined on project');

let {src, apis, outputDir, multiBuild} = project;

if (APP_ENV && (!apis || !apis[APP_ENV])) dipOut('APP_ENV is defined without an associated apis object on the project');

if (apis && apis[APP_ENV]) process.env.API_URL = apis[APP_ENV];


let browsers = ['chrome 77'];
let cssBrowsers = ['last 2 versions'];

const babelPlugins = browsers => [
    ['@iosio/babel-plugin-jcss', {browsers}],
    "transform-inline-environment-variables",
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-syntax-import-meta',
    ['bundled-import-meta', {importStyle: 'baseURI'}],
    ["@babel/plugin-transform-react-jsx", {pragma: 'h', pragmaFrag: "Fragment"}],
    ["@babel/plugin-proposal-class-properties", {"loose": true}],
];


if (!SERVE && !outputDir) dipOut('no outputDir defined on project');

let rollupBuild;

if (!!SERVE) {

    process.env.NODE_ENV = 'development';

    outputDir = './node_modules/_iosio_temp_dev_build';

    rollupBuild = () => ex(`rimraf ${outputDir}`).then(() => ({
        treeshake: false,
        entry: src + '/src/index.js',
        output: {
            dir: outputDir,
            format: 'esm',
            sourcemap: false,
            chunkFileNames: "[name][hash].js"
        },
        plugins: [
            // alias({
            //     resolve: DEFAULT_EXTENSIONS,
            //     entries:{
            //         './xact':'./preact'
            //     }
            // }),
            resolve({
                module: true,
                jsnext: true,
                extensions: DEFAULT_EXTENSIONS,
            }),

            indexHTML({indexHTML: src + '/index.html'}),
            babel({
                extensions: DEFAULT_EXTENSIONS,
                babelrc: false,
                configFile: false,
                presets: [
                    [
                        '@babel/preset-env',
                        {
                            targets: browsers,
                            useBuiltIns: false,
                            modules: false,
                        },
                    ]
                ],
                plugins: babelPlugins(browsers)
            }),
            url({limit: 0, fileName: "[dirname][name][extname]"}),
            serve({contentBase: outputDir, historyApiFallback: true}),
            livereload({watch: outputDir})
        ]
    }))

}

if (!!BUILD_APP) {

    process.env.NODE_ENV = 'production';

    const build = (legacy) => ({
        input: src + '/src/index.js',
        treeshake: true,
        output: {
            dir: path.join(outputDir, legacy ? '/legacy' : ''),
            format: legacy ? 'system' : 'esm',
            dynamicImportFunction: !legacy && 'importShim',
            chunkFileNames: "[hash].js",
            sourcemap: false,
        },
        plugins: [

            indexHTML({
                indexHTML: src + '/index.html',
                legacy,
                multiBuild,
                polyfills: {
                    dynamicImport: true,
                    coreJs: true,
                    regeneratorRuntime: true,
                    webcomponents: true,
                    systemJs: true,
                    fetch: true,
                    intersectionObserver: true,
                },
            }),
            resolve({
                extensions: DEFAULT_EXTENSIONS,
            }),
            babel({
                extensions: DEFAULT_EXTENSIONS,
                babelrc: false,
                configFile: false,
                presets: [
                    [
                        '@babel/preset-env',
                        {
                            targets: legacy ? ['ie 11'] : browsers,
                            useBuiltIns: false,
                            modules: false,
                        },
                    ]
                ],
                plugins: babelPlugins(cssBrowsers)
            }),
            url({
                limit: 0,
                fileName: (legacy ? '../' : '') + "[dirname][name][extname]",
            }),
            terser({
                output: {comments: false},
                compress: {
                    passes: 10,
                }
            }),
            filesize()
        ]
    });

    rollupBuild = () => ex(`rimraf ${outputDir}`).then(() =>
        [multiBuild && build(true), build()].filter(Boolean))
}

if (!!BUILD_LIB) {

    process.env.NODE_ENV = 'production';

    const config = {
        input: Array.isArray(src) ? src : src + 'index.js',
        treeshake: true,
        external,
        output: {
            dir: outputDir,
            format: 'esm',
            sourcemap: true,
            chunkFileNames: "common.js"
        },
        plugins: [
            resolve({
                extensions: DEFAULT_EXTENSIONS,
            }),
            babel({
                extensions: DEFAULT_EXTENSIONS,
                babelrc: false,
                configFile: false,
                presets: [
                    [
                        '@babel/preset-env',
                        {
                            targets: browsers,
                            useBuiltIns: false,
                            modules: false,
                        },
                    ]
                ],
                plugins: babelPlugins(cssBrowsers)
            }),
            url({limit: 0, fileName: "[dirname][hash][extname]"}),
            terser({
                output: {comments: false},
                compress: {
                    passes: 10,
                    pure_getters: true,
                    toplevel: true,
                    // properties: false
                }
            }),
            filesize()
        ]
    };

    if(['.', '/', './', ''].includes(outputDir) || outputDir.startsWith('.') || outputDir.startsWith('./')){
        rollupBuild = () => config;
    }else{
        // console.error('no way josé')
        rollupBuild = () => ex(`rimraf ${outputDir}`).then(() => config)
    }

}

export default rollupBuild();