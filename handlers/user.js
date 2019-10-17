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
                let udoc = await this.lib.user.check(ctx.request.body.username, ctx.request.body.password);
                if (!udoc) await ctx.render('login', { message: 'Incorrent login detail.' });
                else {
                    ctx.session.uid = udoc._id;
                    ctx.redirect(ctx.query.redirect || '/');
                }
            })
            .get('/register', async ctx => {
                await ctx.render('register');
            })
            .post('/register', async ctx => {
                let [uname, email] = await Promise.all([
                    await this.db.collection('user').findOne({ uname_lower: ctx.request.body.username.toLowerCase() }),
                    await this.db.collection('user').findOne({ email_lower: ctx.request.body.email.toLowerCase() }),
                ]);
                if (uname) await ctx.render('register', { message: 'Username already used.' });
                else if (email) await ctx.render('register', { message: 'Email already used.' });
                else {
                    let { insertedId } = await this.lib.user.create({
                        email: ctx.request.body.email,
                        uname: ctx.request.body.username,
                        password: ctx.request.body.password,
                        regip: ctx.request.ip
                    });
                    ctx.session.uid = insertedId;
                    ctx.redirect(ctx.query.redirect || '/');
                }
            })
            .get('/logout', async ctx => {
                ctx.session.uid = UID_GUEST;
                ctx.redirect(ctx.query.redirect || '/');
            })
            .post('/logout', async ctx => {
                ctx.session.uid = UID_GUEST;
                ctx.body = {};
            })
            .get('/user', async ctx => {
                if (ctx.session.uid == UID_GUEST) throw new Error('You are not logged in!');
                let user = new this.lib.user.user(await this.lib.user.getByUID(ctx.session.uid));
                await ctx.render('user', { user });
            });
        return this.router;
    }
};
