const
    MESSAGES_PER_PAGE = 50,
    Router = require('koa-router'),
    { ObjectID } = require('bson'),
    { PermissionError, NotFoundError } = require('hydro-framework').errors,
    { PERM_THREAD_CREATE, PERM_THREAD_REPLY, PERM_THREAD_DELETE, PERM_REPLY_DELETE } = require('../../permission.js');

exports.handler = class {
    constructor(i) {
        this.db = i.db;
        this.lib = i.lib;
        this.router = new Router();
    }
    async getUser(uid) {
        let _id = new ObjectID(uid);
        return new this.lib.user.user(await this.db.collection('user').findOne({ _id }));
    }
    async init() {
        this.router
            .get('/m', async ctx => {
                if (!ctx.state.user._id) throw new PermissionError('You are not logged in!');
                let page = ctx.query.page || 1;
                let messages = await this.lib.message.find({ uid: ctx.state.user._id })
                    .skip((page - 1) * MESSAGES_PER_PAGE)
                    .limit(MESSAGES_PER_PAGE)
                    .toArray();
                await ctx.render('message', { messages });
            })
            .post('/m/ack/:id', async ctx => {
                await this.lib.message.ack(ctx.params.id, ctx.state.user._id);
            });
        return this.router;
    }
};
exports.depends = ['database', 'user'];
exports.id = 'bbs.message';