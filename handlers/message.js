const
    Router = require('koa-router'),
    { ObjectID } = require('bson'),
    { PermissionError, NotFoundError } = require('../errors.js'),
    { PERM_THREAD_CREATE, PERM_THREAD_REPLY, PERM_THREAD_DELETE, PERM_REPLY_DELETE } = require('../constants.js');

module.exports = class HANDLER_MAIN {
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
                let messages = await this.db.collection('message').find({ user: ctx.state.user._id }).toArray();
                await ctx.render('message', { messages });
            })
            .post('/m/ack/:id', async ctx => {
                let message = await this.db.collection('message').findOne({ _id: ctx.params.id, user: ctx.state.user._id });
                if (!message) throw new NotFoundError('Message not found!');
                await this.db.collection('message').delete({ _id: ctx.params.id, user: ctx.state.user._id });
            });
        return this.router;
    }
};