
'use strict';
const CONFIG = require('./app.config');
const UserController = require('./user.controller');
const UserRoute = class UserRoute {
    constructor(app, passport, options, USER) {
        this.initialize(app, passport, options, USER);
    }
    initialize(app, passport, options, USER) {
        const UserControllerInstance = new UserController(options, USER);
        const user_router = require('express').Router(),
            jwt = require('jsonwebtoken');
        this.session_secret_key = options && options.session_secret_key ? options.session_secret_key : 'secret';
        this.model_options = options && options.model_options ? options.model_options : {};
        this.email_filed_name = typeof this.model_options === 'object' && this.model_options.email_filed_name ? this.model_options.email_filed_name : 'email';
        this.password_filed_name = typeof this.model_options === 'object' && this.model_options.password_filed_name ? this.model_options.password_filed_name : 'password';
        app.use(options && options.main_route ? options.main_route : '/user', user_router);
        if (options && options.same_origin) {
            user_router.route('/register').post(passport.authenticate('local-signup', { failureMessage: 'Invalid username or password' }), (req, res) => {
                res.status(200).send({
                    msg: 'Successfully signup',
                    user: req.user,
                    success: true
                });
            });
            user_router.route('/login').post(passport.authenticate('local-login', { failureMessage: 'Invalid username or password' }), (req, res) => {
                res.status(200).send({
                    msg: 'Successfully login',
                    user: req.user,
                    success: true
                });
            });
            user_router.route('/logout').post((req, res) => {
                if (req.user) {
                    if (typeof req.session === 'function') {
                        return req.session.destroy(() => {
                            res.status(200).json({
                                msg: 'Successfully logout',
                                success: true
                            });
                        });
                    } else {
                        req.logout();
                        res.status(200).json({
                            msg: 'Successfully logout',
                        });
                    }
                } else {
                    res.status(200).json({
                        msg: 'Successfully logout',
                        success: true
                    });
                }
            });
        } else {
            user_router.route('/login').post((req, res) => {
                if (typeof req.body[this.email_filed_name] !== 'string' || typeof req.body[this.password_filed_name] !== 'string' || !req.body[this.email_filed_name].trim().length || !req.body[this.password_filed_name].trim().length)
                    return res.status(400).send({
                        msg: `Please provide ${this.email_filed_name} or ${this.password_filed_name}`,
                        success: false
                    });
                passport.authenticate('local-login', { session: false }, (error, user) => {
                    if (error) {
                        return res.status(400).send({
                            msg: typeof error === 'string' ? error : 'Error by database',
                            success: false,
                            error: error
                        });
                    }
                    if (!user) {
                        return res.status(400).send({
                            msg: 'No user exist',
                            success: false
                        });
                    }
                    req.login(user, { session: false }, (error) => {
                        if (error) {
                            return res.status(400).send({
                                msg: 'Error by database',
                                success: false,
                                error: error
                            });
                        }
                        const token = jwt.sign({
                            id: user._id
                        }, this.session_secret_key);
                        return res.status(200).json({
                            token: token,
                            msg: 'Successfully login',
                            user: user,
                            success: true
                        });
                    });
                })(req, res);
            });
            user_router.route('/register').post((req, res) => {
                if (typeof req.body[this.email_filed_name] !== 'string' || typeof req.body[this.password_filed_name] !== 'string' || !req.body[this.email_filed_name].trim().length || !req.body[this.password_filed_name].trim().length)
                    return res.status(400).send({
                        msg: `Please provide ${this.email_filed_name} or ${this.password_filed_name}`,
                        success: false
                    });
                req.body[this.email_filed_name] = req.body[this.email_filed_name].toLowerCase();

                USER.findOne({ [this.email_filed_name]: req.body[this.email_filed_name] }).
                    exec((error, user) => {
                        if (error)
                            return res.status(400).send({
                                msg: 'Error by database',
                                success: false,
                                error: error
                            });
                        if (user)
                            return res.status(400).send({
                                msg: 'User already exist',
                                success: false,
                            });
                        var new_user = new USER(req.body);
                        new_user.generateHash(req.body[this.password_filed_name]);
                        new_user.save((error, user) => {
                            if (error)
                                return res.status(400).send({
                                    msg: 'Error by database',
                                    success: false,
                                    error: error
                                });
                            else {
                                const token = jwt.sign({
                                    id: user._id
                                }, 'user_maagement_key');
                                return res.status(201).json({
                                    msg: 'Successfully signup',
                                    user: user,
                                    token: token,
                                    success: true
                                });
                            }
                        });
                    });
            });
            user_router.route('/logout').post(passport.authenticate('jwt', { session: false }), (req, res) => {
                if (req.user) {
                    if (typeof req.session === 'function') {
                        return req.session.destroy(() => {
                            res.status(200).json({
                                success: true,
                                msg: 'Successfully logout'
                            });
                        });
                    } else {
                        req.logout();
                        res.status(200).json({
                            success: true,
                            msg: 'Successfully logout'
                        });
                    }
                } else {
                    res.status(200).json({
                        success: true,
                        msg: 'Successfully logout'
                    });
                }
            });
        }
        user_router.route('/').get((options && options.same_origin) ? this.isAuthenticate : passport.authenticate('jwt', { session: false }), (req, res) => {
            UserControllerInstance.getUserDetail({
                _id: req.user._id
            })
                .then((success) => {
                    res.status(200).send(success);
                }, (error) => {
                    res.status(400).send(error);
                });
        });

        user_router.route('/changePassword').put((options && options.same_origin) ? this.isAuthenticate : passport.authenticate('jwt', { session: false }), (req, res) => {
            UserControllerInstance.changePassword(req.body.old_password, req.body.new_password, req.user.id)
                .then((success) => {
                    res.status(200).send(success);
                }, (error) => {
                    res.status(400).send(error);
                });
        });

        user_router.route('/').put((options && options.same_origin) ? this.isAuthenticate : passport.authenticate('jwt', { session: false }), (req, res) => {
            delete req.body[this.email_filed_name];
            delete req.body[this.password_filed_name];
            UserControllerInstance.editUserDetail(req.user._id, req.body)
                .then((success) => {
                    res.status(200).send(success);
                }, (error) => {
                    res.status(400).send(error);
                });
        });

        user_router.route('/sendConfirmationMail/:email').get((req, res) => {
            UserControllerInstance.sendConfirmationMail(req.param.email)
                .then((success) => {
                    res.status(200).send(success);
                }, (error) => {
                    res.status(400).send(error);
                });
        });

        user_router.route('/verifyConfirmationToken/:token').get((req, res) => {
            UserControllerInstance.verifyConfirmationToken(req.params.token)
                .then((success) => {
                    res.status(200).send(success);
                }, (error) => {
                    res.status(400).send(error);
                });
        });

        user_router.route('/forgetPassword/:email').get((req, res) => {
            UserControllerInstance.forgetPassword(req.params.email)
                .then((success) => {
                    res.status(200).send(success);
                }, (error) => {
                    res.status(400).send(error);
                });
        });

        user_router.route('/verifyResetLink/:token').get((req, res) => {
            UserControllerInstance.verifyResetLink(req.params.token)
                .then((success) => {
                    res.status(200).send(success);
                }, (error) => {
                    res.status(400).send(error);
                });
        });

        user_router.route('/resetPassword').post((req, res) => {
            UserControllerInstance.resetPassword(req.body.token, req.body[this.password_filed_name])
                .then((success) => {
                    res.status(200).send(success);
                }, (error) => {
                    res.status(400).send(error);
                });
        });
    }
    isAuthenticate(req, res, done) {
        if (req.user) {
            req.session._garbage = Date();
            req.session.touch();
            req.session.cookie.expires = CONFIG.EXPRESS_SESSION.COKKIES_MAX_AGE;
            done();
        } else {
            res.status(401).send({
                message: 'unauthorized',
                success: false
            });
        }
    }
};
module.exports = UserRoute;