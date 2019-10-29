const
    Router = require('koa-router'),
    { ObjectID } = require('bson'),
    { requirePerm } = require('hydro-framework').handler,
    { PermissionError } = require('hydro-framework').errors;

exports.handler = class {
    constructor(i) {
        this.db = i.db;
        this.lib = i.lib;
        this.router = new Router({ prefix: '/api' });
        this.maps = this.db.collection('maps');
    }
    async getUser(uid) {
        let _id = new ObjectID(uid);
        return new this.lib.user.user(await this.db.collection('user').findOne({ _id }));
    }
    async init() {
        this.router
            .get('/update/:id', requirePerm(), async ctx => {
                await this.maps.insertOne({
                    id: ctx.params.id,
                    lastUpdateAt: new Date()
                });
                ctx.body = '200 OK';
            });
        return this.router;
    }
};
