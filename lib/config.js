module.exports = class CONFIG {
    constructor(item) {
        this.coll = item.db.collection('config');
    }
    async get(key = null) {
        if (key) {
            let data = await this.coll.findOne({ key });
            if (data) return data.value;
            else return null;
        } else return await this.coll.find().toArray();
    }
    async set(key, value) {
        let doc = await this.coll.findOne({ key });
        if (doc) await this.coll.deleteOne({ key });
        await this.coll.insertOne({ key, value });
    }
    unset(key) { return this.coll.deleteMany({ key }); }
};
