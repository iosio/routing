process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function (config) {
    config.set({
        frameworks: ["jasmine"],
        files: [
            {
                pattern: "./tests/*.test.js",
                watched: true
            },
            // { pattern: "**/*.test.js", type: "module", included: true },
            // { pattern: "**/*.js", type: "module", included: false }
        ],
        preprocessors: {
            "**/*.test.js": ["rollup"]
        },
        rollupPreprocessor: {
            onwarn: function (message) {
                if (/Circular dependency/gi.test(message)) return;
                console.error(message);
            },
            plugins: [
                require("rollup-plugin-node-resolve")({
                    extensions: [".js", ".ts"]
                }),
                // require("rollup-plugin-sucrase")({
                //     production: true,
                //     exclude: ["node_modules/**"],
                //     jsxPragma: "h",
                //     transforms: ["typescript", "jsx"]
                // }),
                require('rollup-plugin-babel')({
                    plugins:[
                        ['@iosio/babel-plugin-jcss'],

                        ["transform-inline-environment-variables"],

                        '@babel/plugin-syntax-dynamic-import',

                        '@babel/plugin-syntax-import-meta',

                        ['bundled-import-meta', {importStyle: 'baseURI'}],

                        [
                            "@babel/plugin-transform-react-jsx",
                            {
                                "pragma": "h",
                                "pragmaFrag": "Fragment"
                            }
                        ],

                        [
                            "@babel/plugin-proposal-class-properties",
                            {
                                "loose": true
                            }
                        ],
                    ]
                })
            ],
            output: {
                format: "iife", // Helps prevent naming collisions.
                name: "test", // Required for 'iife' format.
                sourcemap: "inline" // Sensible for testing.
            }
        },
        reporters: ["spec"],
        port: 9876, // karma web server port
        colors: true,
        logLevel: config.LOG_ERROR,
        browsers: ["ChromeHeadless"],
        autoWatch: false,
        // singleRun: false, // Karma captures browsers, runs the tests and exits
        concurrency: Infinity
    });
};
