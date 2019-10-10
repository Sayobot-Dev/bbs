module.exports = class USER {
    constructor(item) {
        this.coll = item.db.collection('user');
    }
    getByUID(uid) {
        return this.coll.findOne({ uid });
    }
};
