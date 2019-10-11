const bson = require('bson');
module.exports = class USER {
    constructor(item) {
        this.coll = item.db.collection('user');
        this.lib = item.lib;
        this.user = class USER {
            constructor(user) {
                this._id = user._id;
                this.email = user.email;
                this.uname = user.uname;
            }
        };
    }
    getByUID(uid) {
        return this.coll.findOne({ _id: new bson.ObjectID(uid) });
    }
    check(username, password) {
        return this.coll.findOne({
            username, password: this.lib.crypto.pwhash(password)
        });
    }
    create({ email, uname, password, regip }) {
        return this.coll.insertOne({
            email, email_lower: email.toLowerCase(),
            uname, uname_lower: uname.toLowerCase(),
            password: this.lib.crypto.pwhash(password),
            regip
        });
    }
};
