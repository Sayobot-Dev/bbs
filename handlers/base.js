module.exports = class HANDLER_BASE {
    constructor(i) {
        this.db = i.db;
        this.lib = i.lib;
    }
    async init() {
        return async (ctx, next) => {
            if (!ctx.session.uid) ctx.session.uid = 0;
            ctx.state.user = new this.lib.user.user(await this.lib.user.getByUID(ctx.session.uid));
            await next();
        }
    }
};
