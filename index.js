const
    log = require('./lib/log.js').get('Worker'),
    bson = require('bson'),
    Koa = require('koa'),
    Router = require('koa-router'),
    fs = require('fs'),
    path = require('path'),
    yaml = require('js-yaml'),
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
        this.app = new Koa();
        this.app.keys = this.cfg.keys || ['Hydro'];
        this.router = new Router();
        this.server = require('http').createServer(this.app.callback());
        this.io = require('socket.io')(this.server, { cookie: true });
    }
    async load() {
        if (!this.cfg.ui_path) this.cfg.ui_path = path.resolve(__dirname, '.uibuild');
        else this.cfg.ui_path = path.resolve(this.cfg.ui_path);
        log.log('Using ui folder: ', this.cfg.ui_path);
        if (!fs.existsSync(this.cfg.ui_path)) throw new Error('No UI files found!');
        await this.connectDatabase();
        await this.loadLocale();
        await this.mountLib();
        if (!await require('./lib/deploy.js')(this.db, this.lib)) return;
        this.app.use((require('./modules/trace.js'))({
            sourceMap: false
        }));
        this.app.use(require('koa-static')(path.join(this.cfg.ui_path, 'public')));
        this.app.use(require('koa-morgan')(':method :url :status :res[content-length] - :response-time ms'));
        this.app.use(require('koa-body')({
            patchNode: true,
            multipart: true,
            formidable: {
                uploadDir: path.join(__dirname, 'uploads'),
                keepExtensions: true
            }
        }));
        this.app.use(require('koa-nunjucks-2')({
            ext: 'html',
            path: path.join(this.cfg.ui_path, 'templates'),
            nunjucksConfig: {
                trimBlocks: true
            }
        }));
        await this.loadRoutes();
        this.app.use(this.router.routes()).use(this.router.allowedMethods());
        this.status.loaded = true;
    }
    async listen() {
        if (!this.status.loaded) return;
        await this.server.listen((await this.lib.conf.get('bbs.port')) || '10001');
        this.status.listening = true;
        log.log('Server listening on port: %s', (await this.lib.conf.get('bbs.port')) || '10001');
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
    async loadLocale() {
        let locales = fs.readdirSync(path.resolve(this.cfg.ui_path, 'locales'));
        for (let i of locales) {
            let locale = yaml.safeLoad((fs.readFileSync(path.resolve(this.cfg.ui_path, 'locales', i))));
            let name = i.split('.')[0];
            this.locales[name] = locale;
        }
    }
    async mountLib() {
        let conf = require('./lib/config.js');
        this.lib.conf = new conf({ db: this.db });
        let user = require('./lib/user.js');
        this.lib.user = new user({ db: this.db, lib: this.lib });
        let crypto = require('./lib/crypto.js');
        this.lib.crypto = new crypto();
    }
    async loadRoutes() {
        let i = {
            db: this.db,
            lib: this.lib,
            locales: this.locales,
            config: {
                LANGUAGE: (await this.lib.conf.get('language')) || 'en'
            }
        };
        let Base = new (require('./handlers/base.js'))(i);
        let User = new (require('./handlers/user.js'))(i);
        let Main = new (require('./handlers/main.js'))(i);
        let [base, user, main] = await Promise.all([
            Base.init(), User.init(), Main.init()
        ]);
        this.router
            .use(base)
            .use(main.routes()).use(main.allowedMethods())
            .use(user.routes()).use(user.allowedMethods());
    }
};
