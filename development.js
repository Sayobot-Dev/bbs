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
    const hydro = require('hydro').app;
    let config;
    try {
        config = require('./config.js');
        config.lib = ['@'];
        config.handler = ['trace', '@', 'base', 'message', 'user', 'main'];
        config.deploy = require('./scripts/deploy.js');
        config.app_path = __dirname;
    } catch (e) {
        console.error('Error: Cannot load config');
        process.exit(1);
    }
    global.Hydro = new hydro(config);
    await Hydro.load().catch(e => {
        console.error('Error loading application:');
        console.error(e);
    });
    await Hydro.listen().catch(e => {
        console.error(e);
    });
}

run();
