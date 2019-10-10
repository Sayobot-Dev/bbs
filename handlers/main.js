const Router = require('koa-router');

module.exports = class HANDLER_MAIN {
    constructor(i) {
        this.db = i.db;
        this.lib = i.lib;
        this.router = new Router();
    }
    async init() {
        this.router
            .get('/', async ctx => {
                await ctx.render('index', {});
            })
        return this.router;
    }
};
