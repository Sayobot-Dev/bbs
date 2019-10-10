const path = require('path');
const {
    isArray,
    isBoolean,
    isNumber,
    isString,
    isRegExp,
    isObject,
    isDate,
    isError,
    isFunction
} = require('core-util-is');
function isTrueEmpty(obj) {
    if (obj === undefined || obj === null || obj === '') return true;
    if (isNumber(obj) && isNaN(obj)) return true;
    return false;
}
function isEmpty(obj) {
    if (isTrueEmpty(obj)) return true;
    if (isRegExp(obj)) return false;
    else if (isDate(obj)) return false;
    else if (isError(obj)) return false;
    else if (isArray(obj)) return obj.length === 0;
    else if (isString(obj)) return obj.length === 0;
    else if (isNumber(obj)) return obj === 0;
    else if (isBoolean(obj)) return !obj;
    else if (isObject(obj)) {
        for (const key in obj) return false && key;
        return true;
    }
    return false;
}
function extend(target = {}, ...args) {
    let i = 0;
    const length = args.length;
    let options;
    let name;
    let src;
    let copy;
    if (!target) target = isArray(args[0]) ? [] : {};
    for (; i < length; i++) {
        options = args[i];
        if (!options) continue;
        for (name in options) {
            src = target[name];
            copy = options[name];
            if (src && src === copy) continue;
            if (isArray(copy)) target[name] = extend([], copy);
            else if (isObject(copy))
                target[name] = extend(src && isObject(src) ? src : {}, copy);
            else target[name] = copy;
        }
    }
    return target;
}
var stackTrace = require('stack-trace');
const htmlentities = function (text) {
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#39;');
};
const readFileAsync = require('fs').promises.readFile;
const DEFAULT_404_TEMPLATE = path.join(__dirname, 'template/404.html');
const DEFAULT_500_TEMPLATE = path.join(__dirname, 'template/500.html');

module.exports = class Tracer {
    constructor(opts = {}) {
        this.ctxLineNumbers = opts.ctxLineNumbers || 10;
        this.debug = opts.debug !== undefined ? opts.debug : true;
        if (isFunction(opts.templates))
            this.templatesPath = opts.templates;
        else {
            if (isString(opts.templates))
                opts.templates = this.readTemplatesPath(opts.templates);
            this.templatesPath = extend({
                404: DEFAULT_404_TEMPLATE,
                500: DEFAULT_500_TEMPLATE
            }, opts.templates);
        }
        this.templates = {};
        this.contentType = opts.contentType;
    }
    readTemplatesPath(dir) {
        const templates = {};
        try {
            require('fs').readdirSync(dir)
                .forEach(file => {
                    const match = file.match(/^(\d{3})\./);
                    if (isArray(match))templates[match[1]] = path.join(dir, file);
                });
        } catch (e) {
            console.log(e);
        }
        return templates;
    }
    async getTemplateContent() {
        if (!isEmpty(this.templates))return Promise.resolve();
        let templates = this.templatesPath;
        if (isFunction(templates)) {
            templates = await this.templatesPath();
            if (isString(templates))templates = this.readTemplatesPath(templates);
            templates = extend({
                404: DEFAULT_404_TEMPLATE,
                500: DEFAULT_500_TEMPLATE
            }, templates);
        }

        const readFilesAsync = Object.keys(templates).map(status =>
            readFileAsync(templates[status], { encoding: 'utf-8' })
                .catch(() =>
                    readFileAsync(status !== '404' ? DEFAULT_500_TEMPLATE : DEFAULT_404_TEMPLATE, { encoding: 'utf-8' })
                ).then(template => {
                    this.templates[status] = template;
                })
        );
        return Promise.all(readFilesAsync);
    }

    /**
     * get File content by stack path and lineNumber
     * @param {*object} line stack object for every stack
     */
    getFile(line) {
        const filename = line.getFileName();
        const lineNumber = line.getLineNumber();
        return readFileAsync(filename, { encoding: 'utf-8' }).then(data => {
            let content = data.split('\n');
            const startLineNumber = Math.max(0, lineNumber - this.ctxLineNumbers);
            const endLineNumber = Math.min(lineNumber + this.ctxLineNumbers, data.length);
            content = content.slice(startLineNumber, endLineNumber);
            line.content = content.join('\n');
            line.startLineNumber = Math.max(0, startLineNumber) + 1;
            return line;
        }).catch(() => { });
    }

    /**
     * render error page
     * @param {*Array} stacks stacke tracer array
     */
    renderError(template = this.templates[500], stacks, err) {
        let error;
        if (this.debug)
            error = JSON.stringify(stacks, null, '\t');
        else {
            error = '[]';
            err = '';
        }
        error = htmlentities(error);
        return template.replace('{{error}}', error).replace(
            '{{errMsg}}',
            err.toString()
                .replace(/[\r\n]+/g, '<br/>')
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
        );
    }
    renderNotFound(ctx, err) {
        if (!this.debug) err = '';
        return this.templates[404].replace('{{errMsg}}', htmlentities(err.toString()));
    }
    run(ctx, err) {
        this.ctx = ctx;
        ctx.type = isFunction(this.contentType) ? this.contentType(ctx) : 'html';
        const isJson = isFunction(ctx.response.is) && ctx.response.is('json');
        const isJsonp = isFunction(ctx.isJsonp) && ctx.isJsonp();
        if (isJson || isJsonp) {
            if (!isFunction(ctx.json))
                ctx.json = res => { ctx.body = JSON.stringify(res); };
            const errnoField = 'errno';
            const errmsgField = 'errmsg';
            return (isJsonp ? ctx.jsonp : ctx.json).bind(ctx)({
                [errnoField]: ctx.status,
                [errmsgField]: err.message
            });
        }
        if (ctx.status === 404) {
            ctx.body = this.renderNotFound(ctx, err);
            return true;
        }
        const stack = stackTrace.parse(err);
        return Promise.all(
            stack.map(this.getFile.bind(this))
        ).then(stacks => stacks.filter(stack => stack))
            .then(stacks => {
                const template = this.templates[ctx.status];
                ctx.body = this.renderError(template, stack, err);
            });
    }
};
