const
    Router = require('koa-router'),
    { ObjectID } = require('bson'),
    axios = require('axios'),
    { merge } = require('hydro-framework').handler,
    { PermissionError } = require('hydro-framework').errors;

exports.handler = class {
    constructor(i) {
        this.db = i.db;
        this.lib = i.lib;
        this.router = new Router();
        this.maps = this.db.collection('maps');
    }
    async getUser(uid) {
        let _id = new ObjectID(uid);
        return new this.lib.user.user(await this.db.collection('user').findOne({ _id }));
    }
    async init() {
        this.router
            .get('/', async ctx => {
                let maps = await this.maps.find().limit(50).toArray();
                await ctx.render('home_index', { maps });
            })
            .get('/download/:id', async ctx => {
                let map = await this.maps.findOne({ _id: new ObjectID(ctx.params.id) });
                if (map) ctx.redirect(map.link);
            })
            .all('/add', merge, async ctx => {
                let info = await axios.get(`https://api.sayobot.cn/v2/beatmapinfo?0=${ctx.request.body.url}`);
                ctx.body = info.data;
                info = info.data;
                if (info.status) throw new Error(info.status);
                else info = info.data;
                info.modes = [];
                let modes = {};
                for (let b of info.bid_data) modes[b.mode] = true;
                for (let mode in modes) info.modes.push(mode);
                await this.maps.deleteMany({ sid: info.sid });
                await this.maps.insertOne(Object.assign({
                    link: `https://txy1.sayobot.cn/download/osz/${info.sid}`,
                    lastUpdate: new Date()
                }, info));
                ctx.redirect('/');
            });
        return this.router;
    }
};
exports.depends = ['database', 'user'];