const
    Router = require('koa-router'),
    { ObjectID } = require('bson'),
    { PermissionError } = require('hydro-framework').errors;

exports.handler = class {
    constructor(i) {
        this.db = i.db;
        this.gfs = i.gfs;
        this.lib = i.lib;
        this.router = new Router();
    }
    async getUser(uid) {
        let _id = new ObjectID(uid);
        return new this.lib.user.user(await this.db.collection('user').findOne({ _id }));
    }
    async init() {
        let secret = await this.lib.conf.get('file.secret');
        this.router
            .get('/:id/:token', async ctx => {
                if (this.lib.crypto.decrypt(token, id));
                await ctx.render('home_index', { maps });
            });
        return this.router;
    }
};
