'use strict';

const { resolve } = require('path');
const assert = require('assert');
const send = require('koa-send');
const { drop } = require('lodash');

module.exports = function serve(root, rewrite) {
    let opts = {};
    assert(root, 'root directory is required to serve files');
    opts.root = resolve(root);
    if (opts.index !== false) opts.index = opts.index || 'index.html';
    return async function serve(ctx, next) {
        await next();
        if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return;
        if (ctx.body != null || ctx.status !== 404) return;
        if (rewrite) {
            let temp = ctx.path.split('/');
            if (temp.length < 3) return;
            let plugin = temp[1];
            let path = drop(temp, 2);
            try {
                await send(ctx, plugin + '/public/' + path.join('/'), opts);
            } catch (err) {
                if (err.status !== 404) throw err;
            }
        } else try {
            await send(ctx, ctx.path, opts);
        } catch (err) {
            if (err.status !== 404) throw err;
        }
    };
};
