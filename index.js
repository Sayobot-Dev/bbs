const
    log = require('./lib/log.js').get('Worker'),
    bson = require('bson'),
    Koa = require('koa'),
    Router = require('koa-router'),
    MongoStore = require('koa-session2-mongostore'),
    path = require('path'),
    mongo = require('mongodb'),
    EventEmitter = require('events');

module.exports = class Hydro extends EventEmitter {
    constructor(Hydro_config) {
        super();
        this.cfg = Hydro_config;
        this.config = {};
        this.locales = {};
        this.lib = {};
        this.status = {};
        this.sockets = [];
        this.routes = [];
        this.routers = [];
        this.serviceID = new bson.ObjectID();
        this.sessionOpt = {
            store: new MongoStore({
                collection: 'session',
                url: this.cfg.db_url,
                dbName: this.cfg.db_name,
                collName: 'session'
            })
        };
        this.app = new Koa();
        this.app.keys = this.cfg.keys || ['Hydro'];
        this.router = new Router();
        this.server = require('http').createServer(this.app.callback());
        this.io = require('socket.io')(this.server, { cookie: true });
    }
    async load() {
        await this.connectDatabase();
        await this.mountLib();
        await require('./lib/deploy.js')(this.db, this.lib);
        this.app.use((require('./modules/trace/index.js'))({
            sourceMap: false
        }));
        this.app.use(require('./modules/static')(path.join(__dirname, 'public'), false));
        this.app.use(require('koa-morgan')(':method :url :status :res[content-length] - :response-time ms'));
        this.app.use(require('koa-body')({
            patchNode: true,
            multipart: true,
            formidable: {
                uploadDir: path.join(__dirname, 'uploads'),
                keepExtensions: true
            }
        }));
        this.app.use(require('koa-session2')(this.sessionOpt));
        this.app.use(async (ctx, next) => {
            let that = this;
            ctx.state.url = function (name, params) {
                let route = that.router.route(name);
                if (route) {
                    let args = Array.prototype.slice.call(arguments, 1);
                    return route.url.apply(route, args);
                }
                return '#';
            };
            ctx.state._ = msg => this.locales[ctx.state.user.language][msg] || msg;
            await next();
        });
        //TODO(masnn) Load main routes.
        this.app.use(this.router.routes()).use(this.router.allowedMethods());
        this.status.loaded = true;
    }
    async listen() {
        await this.server.listen(this.cfg.port);
        this.status.listening = true;
    }
    async stop() {
        await this.server.close();
        this.status.listening = false;
    }
    async destory() {

    }
    async restart() {
        process.emit('restart');
    }
    async connectDatabase() {
        try {
            let Database = await require('mongodb').MongoClient.connect(
                this.cfg.db_url, { useNewUrlParser: true, useUnifiedTopology: true }
            );
            this.db = Database.db(this.cfg.db_name);
            this.gfs = require('gridfs')(this.db, mongo);
        } catch (e) {
            log.error('Unable to connect to database.');
            log.error(e);
            process.exit(1);
        }
    }
    async mountLib() {
        let conf = require('./lib/config.js');
        this.lib.conf = new conf({ db: this.db });
        let user = require('./lib/user.js');
        this.lib.user = new user({ db: this.db });
    }
};
