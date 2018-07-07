
'use strict';
const LocalStrategy = require('passport-local').Strategy,
    JWTStrategy = require('passport-jwt').Strategy,
    ExtractJWT = require('passport-jwt').ExtractJwt,
    UserController = require('./user.controller');
const PassportController = class PassportController {
    constructor(passport, options, USER) {
        this.initialize(passport, options, USER);
    }
    initialize(passport, options, USER) {
        const UserControllerInstance = new UserController(options, USER);
        this.mail_options = {};
        this.model_options = {};
        this.session_secret_key = options && options.session_secret_key ? options.session_secret_key : 'secret';
        if (typeof options === 'object') {
            this.mail_options = options.mail_options || {};
            this.model_options = options.model_options || {};
        }
        this.email_filed_name = typeof this.model_options === 'object' && this.model_options.email_filed_name ? this.model_options.email_filed_name : 'email';
        this.password_filed_name = typeof this.model_options === 'object' && this.model_options.password_filed_name ? this.model_options.password_filed_name : 'password';
        passport.serializeUser((user, done) => {
            done(null, {
                id: user.id
            });
        });
        passport.deserializeUser((user, done) => {
            USER.findById(user.id).
                exec((err, user) => {
                    done(err, user);
                });
        });
        passport.use('local-login', new LocalStrategy({
            usernameField: this.email_filed_name,
            passwordField: this.password_filed_name,
            passReqToCallback: true
        },(req, email, password, done) => {
            if (typeof email !== 'string' || typeof password !== 'string' || !email.trim().length || !password.trim().length)
                return done(null, false, `Please provide ${this.email_filed_name} or ${this.password_filed_name}`);
            global.process.nextTick(() => {
                if (email)
                    email = email.toLowerCase();
                USER.findOne({ [this.email_filed_name]: email }).
                    exec((error, user) => {
                        if (error)
                            return done(error);
                        if (!user)
                            return done('No user found.', false, 'No user found.');
                        if (!user.validPassword(password))
                            return done('Oops! Wrong password.', false, 'Oops! Wrong password.');
                        user.reset_password_flag = false;
                        user.last_login = new Date();
                        user.save((error, user) => {
                            if (error)
                                return done(error);
                            return done(null, user);
                        });
                    });
            });
        }));
        passport.use('local-signup', new LocalStrategy({
            usernameField: this.email_filed_name,
            passwordField: this.password_filed_name,
            passReqToCallback: true
        },(req, email, password, done) => {
            if (typeof email !== 'string' || typeof password !== 'string' || !email.trim().length || !password.trim().length)
                return done(null, false, `Please provide ${this.email_filed_name} or ${this.password_filed_name}`);
            global.process.nextTick(() => {
                if (email)
                    email = email.toLowerCase();
                USER.findOne({ [this.email_filed_name]: email }, (error, user) => {
                    if (error)
                        return done(error);
                    if (user) {
                        return done(null, false, 'This email already registred.');
                    } else {
                        var new_user = new USER();
                        new_user[this.email_filed_name] = email;
                        new_user[this.password_filed_name] = new_user.generateHash(password);
                        new_user.last_login = new Date();
                        new_user.email_valid = false;
                        new_user.save((error, updatedUser) => {
                            if (error)
                                return done(error);
                            if (this.mail_options.mail_on_sign_up) {
                                return UserControllerInstance.sendConfirmationMail(updatedUser).then(() => {
                                    return done(null, updatedUser);
                                }, () => {
                                    return done(null, updatedUser);
                                });
                            }
                            return done(null, updatedUser);
                        });
                    }
                });
            });
        }));
        passport.use(new JWTStrategy({
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
            secretOrKey: this.session_secret_key
        },(jwtPayload, done) => {
            return USER.findById(jwtPayload.id)
                .exec((err, user) => {
                    if (err)
                        return done(err);
                    if (!user)
                        return done(null, false);
                    return done(null, user);
                });
        }));
    }
};
module.exports = PassportController;