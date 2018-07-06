(function () {
    'use strict';
    function user_express_app (options) {
        let port, mongo_options = {};
        if (typeof options === 'object' && typeof options.mongo_options === 'object') {
            mongo_options = options.mongo_options;
        }

        const session_secret_key = options && options.session_secret_key ? options.session_secret_key : 'secret';
        port = options && options.port ? options.port : null;
        const USER = require('./user.model')(options),
            app = require('express')(),
            mongoose = require('mongoose'),
            passport = require('passport'),
            cookie_parser = require('cookie-parser'),
            body_parser = require('body-parser'),
            session = require('express-session'),
            mongourl = (mongo_options.mongourl && mongo_options.mongourl ? mongo_options.mongourl : '') || (process.env.MONGODB_URI) || `mongodb://localhost:27017/user_management`,
            CONFIG = require('./app.config'),
            cors = require('cors');
        mongoose.connect(mongourl, mongo_options && mongo_options.database_options || {}).then(function (success) {
            console.log('Mongodb connect successfully');
        }, function (error) {
            throw error;
        });
        require('./passport')(passport, options, USER);

        mongoose.set('debug', mongo_options && mongo_options.debug ? mongo_options.debug : false);
        app.use(body_parser.json());
        app.use(body_parser.urlencoded({
            extended: false
        }));

        app.use(cors());
        app.use(function (req, res, next) {
            res.setHeader('Access-Control-Allow-Origin', CONFIG.REQUEST_HEADER['Access-Control-Allow-Origin']);
            res.setHeader('Access-Control-Allow-Methods', CONFIG.REQUEST_HEADER['Access-Control-Allow-Methods']);
            res.setHeader('Access-Control-Allow-Headers', CONFIG.REQUEST_HEADER['Access-Control-Allow-Headers']);
            res.setHeader('Access-Control-Allow-Credentials', CONFIG.REQUEST_HEADER['Access-Control-Allow-Credentials']);
            next();
        });
        app.use(cookie_parser());
        app.use(session({ secret: session_secret_key, cookie: { maxAge: CONFIG.EXPRESS_SESSION.COKKIES_MAX_AGE } }));
        app.use(passport.initialize());
        app.use(passport.session());
        require('./user.route')(app, passport, options, USER);
        app.set('port', (process.env.PORT || port || CONFIG.NODE_SERVER_PORT));
        app.listen(app.get('port'));
        return app;
    }
   // user_express_app()
    module.exports = user_express_app;
})();