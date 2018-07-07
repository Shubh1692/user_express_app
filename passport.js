(function () {
    'use strict';
    const LocalStrategy = require('passport-local').Strategy,
        JWTStrategy = require('passport-jwt').Strategy,
        ExtractJWT = require('passport-jwt').ExtractJwt;
    module.exports = function (passport, options, USER) {
        const USER_CONTROLLER = require('./user.controller')(options, USER);
        let mail_options = {};
        let model_options = {};
        const session_secret_key = options && options.session_secret_key ? options.session_secret_key : 'secret';
        if (typeof options === 'object') {
            mail_options = options.mail_options || {};
            model_options = options.model_options || {};
        }
        let email_filed_name = typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email';
        let password_filed_name = typeof model_options === 'object' && model_options.password_filed_name ? model_options.password_filed_name : 'password';
        passport.serializeUser(function (user, done) {
            done(null, {
                id: user.id
            });
        });
        passport.deserializeUser(function (user, done) {
            USER.findById(user.id).
                exec(function (err, user) {
                    done(err, user);
                });
        });
        passport.use('local-login', new LocalStrategy({
            usernameField: email_filed_name,
            passwordField: password_filed_name,
            passReqToCallback: true
        },
            function (req, email, password, done) {
                if (typeof email !== 'string' || typeof password !== 'string' || !email.trim().length || !password.trim().length)
                    return done(null, false, `Please provide ${email_filed_name} or ${password_filed_name}`);
                process.nextTick(function () {
                    if (email)
                        email = email.toLowerCase();
                    USER.findOne({ [email_filed_name]: email }).
                        exec(function (error, user) {
                            if (error)
                                return done(error);
                            if (!user)
                                return done('No user found.', false, 'No user found.');
                            if (!user.validPassword(password))
                                return done('Oops! Wrong password.', false, 'Oops! Wrong password.');
                            user.reset_password_flag = false;
                            user.last_login = new Date();
                            user.save(function (error, user) {
                                if (error)
                                    return done(error);
                                return done(null, user);
                            });
                        });
                })

            }));
        passport.use('local-signup', new LocalStrategy({
            usernameField: email_filed_name,
            passwordField: password_filed_name,
            passReqToCallback: true
        },
            function (req, email, password, done) {
                if (typeof email !== 'string' || typeof password !== 'string' || !email.trim().length || !password.trim().length)
                    return done(null, false, `Please provide ${email_filed_name} or ${password_filed_name}`);
                process.nextTick(function () {
                    if (email)
                        email = email.toLowerCase();
                    USER.findOne({ [email_filed_name]: email }, function (error, user) {
                        if (error)
                            return done(error);
                        if (user) {
                            return done(null, false, 'This email already registred.');
                        } else {
                            var new_user = new USER();
                            new_user[email_filed_name] = email;
                            new_user[password_filed_name] = new_user.generateHash(password);
                            new_user.last_login = new Date();
                            new_user.email_valid = false;
                            new_user.save(function (error, updatedUser) {
                                if (error)
                                    return done(error);
                                if (mail_options.mail_on_sign_up) {
                                    return USER_CONTROLLER.sendConfirmationMail(updatedUser).then(function () {
                                        return done(null, updatedUser);
                                    }, function () {
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
            secretOrKey: session_secret_key
        },
            function (jwtPayload, done) {
                return USER.findById(jwtPayload.id)
                    .exec(function (err, user) {
                        if (err)
                            return done(err);
                        if (!user)
                            return done('No user found.');
                        return done(null, user);
                    });
            }
        ));
    };
})();