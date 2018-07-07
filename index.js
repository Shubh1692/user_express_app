'use strict';
const CONFIG = require('./app.config'),
    UserRoute = require('./user.route'),
    mongo_options = new WeakMap(),
    port = new WeakMap(),
    private_methods = {
        initialize(options) {        
            if (typeof options === 'object' && typeof options.mongo_options === 'object') {
                mongo_options.set(this, options.mongo_options || {});
            }
            const session_secret_key = options && options.session_secret_key ? options.session_secret_key : 'secret';
            port.set(this, options && options.port ? options.port : CONFIG.NODE_SERVER_PORT);
            const USER = require('./user.model')(options && options.model_options ? options.model_options : {}),
                app = require('express')(),
                mongoose = require('mongoose'),
                passport = require('passport'),
                cookie_parser = require('cookie-parser'),
                body_parser = require('body-parser'),
                session = require('express-session'),
                mongourl = (mongo_options.get(this).mongourl && mongo_options.get(this).mongourl ? mongo_options.get(this).mongourl : '') || (global.process.env.MONGODB_URI) || 'mongodb://localhost:27017/user_management',
                cors = require('cors');
            mongoose.connect(mongourl, mongo_options.get(this) && mongo_options.get(this).database_options || {}).then(null, (error) => {
                throw error;
            });
            const PasspoertController = new require('./passport');
            new PasspoertController(passport, options, USER);
            
            mongoose.set('debug', mongo_options.get(this) && mongo_options.get(this).debug ? mongo_options.get(this).debug : false);
            app.use(body_parser.json());
            app.use(body_parser.urlencoded({
                extended: false
            }));

            app.use(cors());
            app.use((req, res, next) => {
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
            const UserRouteInstance = new UserRoute(app, passport, options, USER);
            app.set('port', (global.process.env.PORT || port.get(this)));
            app.listen(app.get('port'));
            this.app = app;
            this.auth_middleware = (options && options.same_origin) ? UserRouteInstance.isAuthenticate : passport.authenticate('jwt', { session: false });
        }
    };
class UserExpressApp {
    constructor(options) {
        private_methods.initialize.call(this, options);
    }
}
new UserExpressApp({
    mail_options: {
        mail_type: 'sendgrid',
        sendgrid_options: {
            api_key: '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'
        }
    },
    model_options: {
        other_filed: {
            profile_pic: {
                type: String,
                default: ''
            },
            name: {
                type: String,
                default: ''
            },
        }
    },
    mongo_options: {
        mongourl: 'mongodb://localhost:27017/reactor'
    }
});
module.exports = UserExpressApp;