module.exports = {
    db_url: 'mongodb://localhost/bbs',
    db_name: 'bbs',
    ui_path: '.uibuild',
    config: {
        PORT: 10001, // The port the app will listen on.
        /* Fill and uncomment the folling line to enable mail service.
        SMTP_HOST: '',
        SMTP_PORT: 465,
        SMTP_SECURE: true,
        SMTP_USER: '',
        SMTP_PASS: ''
        */
    }
};