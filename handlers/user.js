const
    Router = require('koa-router'),
    { UID_GUEST } = require('../constants.js');

module.exports = class HANDLER_USER {
    constructor(i) {
        this.db = i.db;
        this.lib = i.lib;
        this.router = new Router();
    }
    async init() {
        this.router
            .get('/login', async ctx => {
                await ctx.render('login');
            })
            .post('/login', async ctx => {
                let udoc = this.lib.user.check(ctx.request.body.username, ctx.request.body.password);
                if (!udoc) await ctx.render('login', { message: 'Incorrent login detail' });
                else {
                    ctx.session.uid = udoc._id;
                    ctx.redirect(ctx.query.redirect || '/');
                }
            })
            .get('/register', async ctx => {
                await ctx.render('register');
            })
            .post('/register', async ctx => {
                let udoc = await this.lib.user.create({
                    email: ctx.request.body.email,
                    uname: ctx.request.body.username,
                    password: ctx.request.body.password,
                    regip: ctx.request.ip
                });
                ctx.session.uid = udoc._id;
                ctx.redirect(ctx.query.redirect || '/');
            })
            .post('/logout', async ctx => {
                ctx.session.uid = UID_GUEST;
                ctx.redirect(ctx.query.redirect || '/');
            });
        return this.router;
    }
};
