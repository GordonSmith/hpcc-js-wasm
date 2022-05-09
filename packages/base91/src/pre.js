//  XXX Hello and welcome!

function ready() {
    readyPromiseResolve(Module);
    console.log('ready() called, and INVOKE_RUN=0. The runtime is now ready for you to call run() to invoke application _main(). You can also override ready() in a --pre-js file to get this signal as a callback')
}
