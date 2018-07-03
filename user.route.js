(function () {
    'use strict';
    module.exports = function (app, passport, options, USER) {
        const USER_CONTROLLER = require("./user.controller")(options, USER);
        const user_router = require('express').Router(),
            jwt = require('jsonwebtoken');
        let session_secret_key = options && options.session_secret_key ? options.session_secret_key : 'secret';
        let model_options = options && options.model_options ? options.model_options : {}
        app.use(options && options.main_route ? options.main_route : '/user', user_router);
        if (options && options.same_origin) {
            user_router.route('/register').post(passport.authenticate('local-signup', { failureMessage: "Invalid username or password" }), function (req, res) {
                res.status(200).send({
                    msg: 'Successfully signup',
                    user: req.user,
                    success: true
                });
            });
            user_router.route('/login').post(passport.authenticate('local-login', { failureMessage: "Invalid username or password" }), function (req, res) {
                res.status(200).send({
                    msg: 'Successfully login',
                    user: req.user,
                    success: true
                });
            });
            user_router.route('/logout').post(function (req, res) {
                if (req.user) {
                    if (typeof req.session === 'function') {
                        return req.session.destroy(function (err) {
                            res.status(200).json({
                                token: token,
                                msg: 'Successfully logout',
                                success: true
                            });
                        });
                    } else {
                        req.logout();
                        res.status(200).json({
                            token: token,
                            msg: 'Successfully logout',

                        });
                    }
                } else {
                    res.status(200).json({
                        token: token,
                        msg: 'Successfully logout',
                        success: true
                    });
                }
            });
        } else {
            user_router.route('/login').post(function (req, res) {
                console.log(req.body)
                passport.authenticate('local-login', { session: false }, (error, user) => {
                    if (error || !user) {
                        return res.status(400).send({
                            msg: 'Error by database',
                            success: false,
                            error: error
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
                        }, session_secret_key);
                        return res.status(200).json({
                            token: token,
                            msg: 'Successfully login',
                            user: user,
                            success: true
                        });
                    });
                })(req, res);
            })
            user_router.route('/register').post(function (req, res) {
                if (typeof req.body.email === 'string')
                    req.body.email = req.body.email.toLowerCase();
                USER.findOne({ [typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email']: req.body.email }).
                    exec(function (error, user) {
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
                            });;
                        var new_user = new USER(req.body);
                        new_user.generateHash(req.body.password);
                        new_user.save(function (err, user) {
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
                                    msg: "Successfully signup",
                                    user: user,
                                    token: token,
                                    success: true
                                });
                            }
                        });
                    });
            });
            user_router.route('/logout').post(passport.authenticate('jwt', { session: false }), function (req, res) {
                if (req.user) {
                    if (typeof req.session === 'function') {
                        return req.session.destroy(function (err) {
                            res.status(200).json({
                                token: token,
                                msg: 'Successfully logout'

                            });
                        });
                    } else {
                        req.logout();
                        res.status(200).json({
                            token: token,
                            msg: 'Successfully logout'

                        });
                    }
                } else {
                    res.status(200).json({
                        token: token,
                        msg: 'Successfully logout'
                    });
                }
            });
        }
        user_router.route('/').post(_isAuthenticate, function (req, res) {
            USER_CONTROLLER.getUserDetail({
                _id: req.user._id
            }).then(function (success) {
                res.status(200).send(success);
            }, function name(error) {
                res.status(400).send(error);
            })
        });
        user_router.route('/:id').put(_isAuthenticate, function (req, res) {
            USER_CONTROLLER.editUserDetail(req.param.id, req.body).then(function (success) {
                res.status(200).send(success);
            }, function name(error) {
                res.status(400).send(error);
            })
        });

        user_router.route('/sendConfirmationMail/:email').get(function (req, res) {
            USER_CONTROLLER.sendConfirmationMail(req.param.email).then(function (success) {
                res.status(200).send(success);
            }, function name(error) {
                res.status(400).send(error);
            })
        });

        user_router.route('/verifyConfirmationToken/:token').get(function (req, res) {
            USER_CONTROLLER.verifyConfirmationToken(req.param.token).then(function (success) {
                res.status(200).send(success);
            }, function name(error) {
                res.status(400).send(error);
            })
        });

        user_router.route('/forgetPassword/:email').get(function (req, res) {
            USER_CONTROLLER.forgetPassword(req.param.email).then(function (success) {
                res.status(200).send(success);
            }, function name(error) {
                res.status(400).send(error);
            })
        });

        user_router.route('/verifyResetLink/:token').get( function (req, res) {
            USER_CONTROLLER.verifyResetLink(req.param.token).then(function (success) {
                res.status(200).send(success);
            }, function name(error) {
                res.status(400).send(error);
            })
        });

        user_router.route('/resetPassword').post(function (req, res) {
            USER_CONTROLLER.resetPassword(req.body.token, req.body.password).then(function (success) {
                res.status(200).send(success);
            }, function name(error) {
                res.status(400).send(error);
            })
        });

        user_router.route('/changePassword').put(_isAuthenticate, function (req, res) {
            USER_CONTROLLER.changePassword(req.body.old_password, req.body.new_password, req.user.id).then(function (success) {
                res.status(200).send(success);
            }, function name(error) {
                res.status(400).send(error);
            })
        });


        function _isAuthenticate() {
            if (req.user) {
                req.session._garbage = Date();
                req.session.touch();
                req.session.cookie.expires = CONFIG.EXPRESS_SESSION.COKKIES_MAX_AGE;
                done();
            } else {
                res.status(401).send({
                    message: 'unauthorized',
                    success: true
                });
            }
        }
    }
})();