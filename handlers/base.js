const { UID_GUEST } = require('../constants.js');
module.exports = class HANDLER_BASE {
    constructor(i) {
        this.db = i.db;
        this.lib = i.lib;
    }
    async init() {
        return async (ctx, next) => {
ctx.session={};           if (!ctx.session.uid) ctx.session.uid = UID_GUEST;
            ctx.state.UID_GUEST = UID_GUEST;
            console.log(ctx.session.uid);
            ctx.state.user = new this.lib.user.user(await this.lib.user.getByUID(ctx.session.uid));
            await next();
        };
    }
};
