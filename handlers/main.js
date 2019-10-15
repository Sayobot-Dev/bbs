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
    async formatComment(comment) {
        comment.author = await this.getUser(comment.author);
        let queue = [];
        for (let i in comment.reply) queue.push(await this.getUser(comment.reply[i].author));
        queue = await Promise.all(queue);
        for (let i in queue) comment.reply[i].author = queue;
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
                    let threads = await this.db.collection('thread').find({ category: category.id })
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
                if (!ctx.state.user.hasPerm(PERM_THREAD_CREATE)) throw new PermissionError();
                let category, categories = await this.lib.conf.get('categories');
                for (let i of categories)
                    if (i.id == ctx.params.category) {
                        category = i;
                        break;
                    }
                if (!category) await next();
                else {
                    this.db.collection('thread').insertOne({
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
                let thread = await this.db.collection('thread').findOne({
                    _id: new ObjectID(ctx.params.id),
                    category: ctx.params.category
                });
                if (!thread) await next();
                else {
                    let [category, comments, author] = await Promise.all([
                        (async () => {
                            let categories = await this.lib.conf.get('categories');
                            for (let i of categories)
                                if (i.id == ctx.params.category)
                                    return i;
                        })(),
                        this.db.collection('comment').find({
                            thread: new ObjectID(ctx.params.id)
                        }).toArray(),
                        this.getUser(thread.author)
                    ]);
                    let queue = [];
                    for (let i in comments) queue.push(await this.formatComment(comments[i]));
                    await Promise.all(queue);
                    thread.author = author;
                    await ctx.render('thread', { thread, comments, category });
                }
            })
            .all('/:category/:id/delete', async (ctx, next) => {
                let thread = await this.db.collection('thread').findOne({
                    _id: new ObjectID(ctx.params.id),
                    category: ctx.params.category
                });
                if (!thread) await next();
                else {
                    if (ctx.state.user._id.toHexString() != thread.author.toHexString() && !ctx.state.user.hasPerm(PERM_THREAD_DELETE))
                        throw new PermissionError('You don\'t have permission to delete this thread.');
                    await this.db.collection('thread').deleteOne({
                        _id: new ObjectID(ctx.params.id),
                        category: ctx.params.category
                    });
                    ctx.redirect(`/${ctx.params.category}`);
                }
            })
            .all('/:category/:id/comment', async (ctx, next) => {
                if (!ctx.state.user.hasPerm(PERM_THREAD_REPLY))
                    throw new PermissionError('You don\'t have permission to comment.');
                let thread = await this.db.collection('thread').findOne({
                    _id: new ObjectID(ctx.params.id),
                    category: ctx.params.category
                });
                if (!thread) await next();
                else {
                    await this.db.collection('comment').insertOne({
                        thread: new ObjectID(ctx.params.id),
                        content: ctx.request.body.content,
                        author: ctx.state.user._id,
                        time: new Date(),
                        reply: []
                    });
                    ctx.redirect(`/${ctx.params.category}/${ctx.params.id}`);
                }
            })
            .all('/:category/:id/delete/:cid', async (ctx, next) => {
                let comment = await this.db.collection('comment').findOne({
                    thread: new ObjectID(ctx.params.id),
                    _id: new ObjectID(ctx.params.cid)
                });
                if (!comment) await next();
                else {
                    if (ctx.state.user._id.toHexString() != comment.author.toHexString() && !ctx.state.user.hasPerm(PERM_REPLY_DELETE))
                        throw new PermissionError('You don\'t have permission to delete this comment.');
                    await this.db.collection('comment').deleteOne({
                        thread: new ObjectID(ctx.params.id),
                        _id: new ObjectID(ctx.params.cid)
                    });
                    ctx.redirect(`/${ctx.params.category}/${ctx.params.id}`);
                }
            })
            .all('/:category/:id/:cid/comment', async (ctx, next) => {
                if (!ctx.state.user.hasPerm(PERM_THREAD_REPLY))
                    throw new PermissionError('You don\'t have permission to comment.');
                let comment = await this.db.collection('comment').findOne({
                    thread: new ObjectID(ctx.params.id),
                    _id: new ObjectID(ctx.params.cid)
                });
                if (!comment) await next();
                else {
                    comment.reply.push({
                        content: ctx.request.body.content,
                        author: ctx.state.user._id,
                        time: new Date()
                    });
                    await this.db.collection('comment').save(comment);
                    ctx.redirect(`/${ctx.params.category}/${ctx.params.id}`);
                }
            });
        return this.router;
    }
};
