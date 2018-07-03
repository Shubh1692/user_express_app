(function () {
    'use strict';
    const LocalStrategy = require('passport-local').Strategy,
        JWTStrategy = require("passport-jwt").Strategy,
        ExtractJWT = require("passport-jwt").ExtractJwt;
    module.exports = function (passport, options, USER) {
        const USER_CONTROLLER = require("./user.controller")(options, USER);
        const mail_options = {};
        const model_options = {};
        const session_secret_key = options && options.session_secret_key ? options.session_secret_key : 'secret';
        if (typeof options === 'object') {
            mail_options = options.mail_options || {};
            model_options = options.model_options || {};
        }
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
            usernameField: typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email',
            passwordField: typeof model_options === 'object' && model_options.password_filed_name ? model_options.password_filed_name : 'password',
            passReqToCallback: true
        },
            function (req, email, password, done) {
                process.nextTick(function () {
                    if (email)
                        email = email.toLowerCase();
                    USER.findOne({ [typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email']: email }).
                        exec(function (error, user) {
                            if (error)
                                return done(error);
                            if (!user)
                                return done(null, false, 'No user found.');
                            if (!user.validPassword(password))
                                return done(null, false, 'Oops! Wrong password.');
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
            usernameField: typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email',
            passwordField: typeof model_options === 'object' && model_options.password_filed_name ? model_options.password_filed_name : 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
            function (req, email, password, done) {
                process.nextTick(function () {
                    if (email)
                        email = email.toLowerCase();
                    USER.findOne({ [typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email']: email }, function (error, user) {
                        if (error)
                            return done(error);
                        if (user) {
                            return done(null, false, 'This email already registred.');
                        } else {
                            var new_user = new USER();
                            new_user.email = email;
                            new_user.password = new_user.generateHash(password);
                            new_user.last_login = new Date();
                            new_user.email_valid = false;
                            new_user.save(function (error, updatedUser) {
                                if (error)
                                    return done(error);
                                new_user.save(function (error, new_user) {
                                    if (error)
                                        return done(error);
                                    if (mail_options.mail_on_sign_up) {
                                        return USER_CONTROLLER.sendConfirmationMail(new_user).then(function (success) {
                                            return done(null, new_user);
                                        }, function (error) {
                                            return done(null, new_user);
                                        });
                                    }
                                    return done(null, new_user);
                                });
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
                return User.findById(jwtPayload.id)
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