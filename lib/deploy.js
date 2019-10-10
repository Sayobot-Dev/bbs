const
    log = require('./log.js').get('Deploy'),
    expects = {
        udoc: {
            uid: 0,
            uname: 'Guest',
            uname_lower: 'guest',
            password: '',
            email: 'example@example.com',
            email_lower: 'example@example.com',
            perm: [],
            field: 'local'
        }
    };

async function db_install(db, lib) {
    log.info('\nIt seem that it\'s your first time to run Hydro.\nWe are now preparing database.');
    let udoc = await db.collection('user').findOne({ uid: 0 });
    if (udoc) expects.udoc.perm = udoc.perm;
    await db.collection('user').deleteMany({ uid: 0 });
    await db.collection('user').insertOne(expects.udoc);
    await Promise.all([
        db.collection('user').createIndex({ 'uid': 1 }, { unique: true }),
        db.collection('user').createIndex({ 'uname': 1 }, { unique: true }),
        db.collection('user').createIndex({ 'uname_lower': 1 }, { unique: true }),
        db.collection('user').createIndex({ 'email': 1 }, { unique: true }),
        db.collection('user').createIndex({ 'email_lower': 1 }, { unique: true }),
        db.collection('config').createIndex({ 'key': 1 }, { unique: true })
    ]);
    await lib.conf.set('dbver', 1);
    log.info('Database installed.');
    process.emit('restart');
}
module.exports = async (db, lib) => {
    if (await lib.conf.get('dbver') != 1) await db_install(db, lib).catch(e => {
        log.error(e);
        log.error('Database installation failed.');
        process.exit(1);
    });
};
