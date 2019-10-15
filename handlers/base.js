const
    { ObjectID } = require('bson'),
    constants = require('../constants.js');
module.exports = class HANDLER_BASE {
    constructor(i) {
        this.db = i.db;
        this.lib = i.lib;
    }
    async init() {
        return async (ctx, next) => {
            let sessionid = new ObjectID(ctx.cookies.get('sayobot.bbs.sessionid')) || constants.UID_GUEST;
            ctx.session = (await this.db.collection('session').findOne({ _id: sessionid })) || {};
            ctx.session.uid = ctx.session.uid || constants.UID_GUEST;
            Object.assign(ctx.state, constants);
            ctx.state.user = new this.lib.user.user(await this.lib.user.getByUID(ctx.session.uid));
            await next();
            if (ctx.session._id) await this.db.collection('session').save(ctx.session);
            else {
                if (ctx.session.uid == constants.UID_GUEST && !ctx.session.language) return;
                let session = await this.db.collection('session').insertOne(ctx.session);
                ctx.cookies.set('sayobot.bbs.sessionid', session.insertedId);
            }
        };
    }
};
