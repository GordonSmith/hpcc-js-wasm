module.exports = function (config) {
    config.set({
        frameworks: ['mocha'],
        files: [
            { pattern: 'dist-test/index.browser.js', type: 'module' },
            { pattern: 'dist-test/*.js', watched: false, included: false, served: true, type: module }
        ],
        proxies: {
            "/dist/": "/base/dist/",
            "/dist-test/": "/base/dist-test/"
        },
        reporters: ['spec'],
        port: 9876,  // karma web server port
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ["Firefox", "ChromeHeadless"],
        autoWatch: false,
        concurrency: Infinity
    })
}