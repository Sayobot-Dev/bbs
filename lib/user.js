const bson = require('bson');
module.exports = class USER {
    constructor(item) {
        this.coll = item.db.collection('user');
        this.user = class USER {
            constructor(user) {
                this.uid = user.uid;
                this.email = user.email;
                this.username = user.username;
            }
        }
    }
    getByUID(uid) {
        return this.coll.findOne({ _id: new bson.ObjectID(uid) });
    }
    async create({ email, username, password, regip }) {
        return await this.coll.insertOne({ email, username, password, _id: new bson.ObjectID(), regip });
    }
};
