'use strict';
process.stdin.setEncoding('utf8');
process.stdin.on('data', async input => {
    try {
        let t = eval(input.toString().trim());
        if (t instanceof Promise) console.log(await t);
        else console.log(t);
    } catch (e) {
        console.warn(e);
    }
});
process.on('restart', async () => {
    console.log('Signal detected, restarting...');
    await global.Hydro.stop();
    await global.Hydro.destory();
    delete global.Hydro;
    delete require.cache;
    run();
});

async function run() {
    const hydro = require('./index.js');
    let config;
    try {
        config = require('./config.json');
    } catch (e) {
        config = {};
    }
    global.Hydro = new hydro(config);
    await Hydro.load().catch(e => {
        console.error('Error loading application:');
        console.error(e);
    });
    await Hydro.listen();
}

run();
