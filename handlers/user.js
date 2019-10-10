const Router = require('koa-router');

module.exports = class HANDLER_USER {
    constructor(i) {
        this.db = i.db;
        this.lib = i.lib;
        this.router = new Router();
    }
    async init() {
        this.router
            .get('/login', async ctx => {

            })
            .post('/login', async ctx => {

            })
            .get('/register', async ctx => {

            })
            .post('/register', async ctx => {

            })
            .post('/logout', async ctx => {

            });
        return this.router;
    }
};
