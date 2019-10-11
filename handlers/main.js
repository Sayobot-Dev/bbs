const
    Router = require('koa-router'),
    { ObjectID } = require('bson'),
    { TYPE_THREAD } = require('../constants.js');

module.exports = class HANDLER_MAIN {
    constructor(i) {
        this.db = i.db;
        this.lib = i.lib;
        this.router = new Router();
    }
    async init() {
        this.router
            .get('/', async ctx => {
                let categories = await this.lib.conf.get('categories');
                await ctx.render('index', { categories });
            })
            .get('/:category', async (ctx, next) => {
                let page = ctx.query.page || 1, category;
                let categories = await this.lib.conf.get('categories');
                for (let i of categories)
                    if (i.id == ctx.params.category) {
                        category = i;
                        break;
                    }
                if (!category) await next();
                else {
                    let threads = await this.db.collection('document').find({ type: TYPE_THREAD, category: category.id })
                        .skip((page - 1) * 50).limit(50).sort({ time: -1 }).toArray();
                    await ctx.render('list', { category, threads });
                }
            })
            .get('/:category/create', async (ctx, next) => {
                let category, categories = await this.lib.conf.get('categories');
                for (let i of categories)
                    if (i.id == ctx.params.category) {
                        category = i;
                        break;
                    }
                if (!category) await next();
                else await ctx.render('create', {});
            })
            .post('/:category/create', async (ctx, next) => {
                let category, categories = await this.lib.conf.get('categories');
                for (let i of categories)
                    if (i.id == ctx.params.category) {
                        category = i;
                        break;
                    }
                if (!category) await next();
                else {
                    this.db.collection('document').insertOne({
                        type: TYPE_THREAD,
                        title: ctx.request.body.title,
                        content: ctx.request.body.content,
                        author: ctx.state.user._id,
                        category: category.id,
                        time: new Date()
                    });
                    ctx.redirect(`/${ctx.params.category}`);
                }
            })
            .get('/:category/:id', async (ctx, next) => {
                let thread = await this.db.collection('document').findOne({
                    type: TYPE_THREAD,
                    _id: new ObjectID(ctx.params.id),
                    category: ctx.params.category
                });
                if (!thread) await next();
                else {
                    let category, categories = await this.lib.conf.get('categories');
                    for (let i of categories)
                        if (i.id == ctx.params.category) {
                            category = i;
                            break;
                        }
                    await ctx.render('thread', { thread, category });
                }
            });
        return this.router;
    }
};
