const
    Router = require('koa-router'),
    { ObjectID } = require('bson'),
    { PermissionError } = require('../errors.js'),
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
        return this.router;
    }
};