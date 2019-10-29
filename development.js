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
    const hydro = require('hydro-framework');
    let config;
    try {
        config = require('./config.js');
        config.lib = ['@'];
        config.middleware = [
            hydro.handler.trace,
            '@',
            hydro.handler.base,
            hydro.handler.user
        ];
        config.hosts = {
            'osu.sh': [
                require('./handler/main/main.js')
            ],
            'bbs.osu.sh': [
                require('./handler/bbs/message.js'),
                require('./handler/bbs/main.js')
            ]
        };
        config.perm = require('./permission.js');
        config.deploy = require('./scripts/deploy.js');
        config.constants = {
            MODE_NAME: ['osu!', 'osu!taiko', 'osu!catch', 'osu!mania']
        };
    } catch (e) {
        console.error('Error loading application:');
        console.error(e);
        process.exit(1);
    }
    global.Hydro = new hydro.app(config);
    await global.Hydro.load().catch(e => {
        console.error('Error loading application:');
        console.error(e);
    });
    await global.Hydro.listen().catch(e => {
        console.error(e);
    });
}

run();
