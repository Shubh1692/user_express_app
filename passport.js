
'use strict';
const LocalStrategy = require('passport-local').Strategy,
    JWTStrategy = require('passport-jwt').Strategy,
    ExtractJWT = require('passport-jwt').ExtractJwt,
    UserController = require('./user.controller'),
    mail_options = new WeakMap(),
    session_secret_key = new WeakMap(),
    email_filed_name = new WeakMap(),
    password_filed_name = new WeakMap(),
    privateMethods = {
        initialize(passport, options, USER) {
            const UserControllerInstance = new UserController(options, USER);
            mail_options.set(this, {});
            let model_options = {};
            session_secret_key.set(this, options && options.session_secret_key ? options.session_secret_key : 'secret');
            if (typeof options === 'object') {
                mail_options.set(this, options.mail_options || {});
                model_options = options.model_options || {};
            }
            email_filed_name.set(this, typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email');
            password_filed_name.set(this, typeof model_options === 'object' && model_options.password_filed_name ? model_options.password_filed_name : 'password');
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
                usernameField: email_filed_name.get(this),
                passwordField: password_filed_name.get(this),
                passReqToCallback: true
            }, (req, email, password, done) => {
                if (typeof email !== 'string' || typeof password !== 'string' || !email.trim().length || !password.trim().length)
                    return done(null, false, `Please provide ${email_filed_name.get(this)} or ${password_filed_name.get(this)}`);
                global.process.nextTick(() => {
                    if (email)
                        email = email.toLowerCase();
                    USER.findOne({ [email_filed_name.get(this)]: email }).
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
                usernameField: email_filed_name.get(this),
                passwordField: password_filed_name.get(this),
                passReqToCallback: true
            }, (req, email, password, done) => {
                if (typeof email !== 'string' || typeof password !== 'string' || !email.trim().length || !password.trim().length)
                    return done(null, false, `Please provide ${email_filed_name.get(this)} or ${password_filed_name.get(this)}`);
                global.process.nextTick(() => {
                    if (email)
                        email = email.toLowerCase();
                    USER.findOne({ [email_filed_name.get(this)]: email }, (error, user) => {
                        if (error)
                            return done(error);
                        if (user) {
                            return done(null, false, 'This email already registred.');
                        } else {
                            var new_user = new USER();
                            new_user[email_filed_name.get(this)] = email;
                            new_user[password_filed_name.get(this)] = new_user.generateHash(password);
                            new_user.last_login = new Date();
                            new_user.email_valid = false;
                            new_user.save((error, updatedUser) => {
                                if (error)
                                    return done(error);
                                if (mail_options.get(this).mail_on_sign_up) {
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
                secretOrKey: session_secret_key.get(this)
            }, (jwtPayload, done) => {
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
class PassportController {
    constructor(passport, options, USER) {
        privateMethods.initialize.call(this, passport, options, USER);
    }
}
module.exports = PassportController;