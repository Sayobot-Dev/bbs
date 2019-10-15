class PermissionError extends Error {
    constructor(perm) {
        super(perm);
        this.perm = perm;
    }
}
module.exports = { PermissionError };
