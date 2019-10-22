const statuses = require('statuses');
const { isFunction } = require('core-util-is');
const { BadRequestError, NotFoundError, PermissionError } = require('../errors.js');
module.exports = function (opts) {
    let errorCallback;
    if (opts && isFunction(opts.error)) errorCallback = opts.error;
    else errorCallback = () => { };
    return (ctx, next) => {
        return Promise.resolve().then(next).then(() => {
            if (ctx.res.statusCode !== 404) return true;
            return ctx.throw(404, `url \`${ctx.path}\` not found.`);
        }).catch(err => {
            if (err instanceof BadRequestError || err instanceof PermissionError || err instanceof NotFoundError) {
                ctx.status = err.code;
                ctx.body = err.message;
            } else {
                if (errorCallback(err, ctx) === false) return Promise.resolve();
                if (typeof err.status !== 'number' || !statuses[err.status])
                    err.status = 500;
                ctx.status = err.status;
                ctx.body = `<pre>${err.toString()}</pre><br/><pre>${err.stack}</pre>`;
            }
        });
    };
};
