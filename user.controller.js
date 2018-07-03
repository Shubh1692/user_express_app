(function () {
    'use strict';
    const CONFIG = require('./app.config'),
        jwt = require('jsonwebtoken'),
        Q = require("q"),
        MAIL_CONTROLLER = require("./nodemailer.controller");
    module.exports = function (options, USER) {
        let mail_options = {},
            model_options = {},
            session_secret_key = options && options.session_secret_key ? options.session_secret_key : 'secret';
        if (typeof options === 'object') {
            mail_options = options.mail_options || {};
            model_options = options.model_options || {};
        }

        function _getUserDetail(filter_object) {
            const defer = Q.defer();
            USER.find(filter_object || {}, function (error, users) {
                if (error)
                    return defer.reject({
                        msg: 'Error by database',
                        success: false,
                        error: error
                    });
                return defer.resolve({
                    msg: 'User list',
                    success: true,
                    users: users
                });
            });
        }

        function _saveUserDetail(user_infomation) {
            var defer = Q.defer();
            var new_user = new User(user_infomation);
            new_user.save(function (error, user) {
                if (error)
                    return defer.reject({
                        msg: 'Error by database',
                        success: false,
                        error: error
                    });
                return defer.resolve({
                    msg: 'User list',
                    success: true,
                    user: user
                });
            });
        }

        function _sendConfirmationMail(email) {
            var emailContent = typeof mail_options === 'object' && mail_options.signup_body ? mail_options.signup_body : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.SIGN_UP_MAIL_TEMPLATE.BODY;
            var token = jwt.sign({
                [typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email']: email
            }, session_secret_key, { expiresIn: typeof mail_options === 'object' && mail_options.exprire_in ? mail_options.exprire_in : '1h' });
            emailContent = emailContent.replace(/MAIL_CONFIRMATION_TOKEN/g, token);
            emailContent = emailContent.replace(/MAIL_CONFIRMATION_URL/g, typeof mail_options === 'object' && mail_options.confirmation_mail_url ? mail_options.confirmation_mail_url : '');
            MAIL_CONTROLLER.sendMail({
                to: email,
                from: typeof mail_options === 'object' && mail_options.from ? mail_options.from : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.SIGN_UP_MAIL_TEMPLATE.FROM,
                subject: typeof mail_options === 'object' && mail_options.signup_subject ? mail_options.signup_subject : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.SIGN_UP_MAIL_TEMPLATE.SUBJECT,
                html: emailContent
            }).then(function (success) {
                return defer.resolve({
                    msg: 'Mail send successfully',
                    success: true,
                    mail_success: success
                });
            }, function (error) {
                return defer.resolve({
                    msg: 'Mail not send',
                    success: false,
                    mail_error: error
                });
            });
        }

        function _verifyConfirmationToken(token) {
            jwt.verify(token, session_secret_key, function (err, decoded) {
                if (err) {
                    return defer.reject(err);
                } else {
                    USER.findOne({ [typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email']: decoded.email }, function (error, user) {
                        if (err)
                            return defer.reject(error);
                        else if (user && user.email_valid) {
                            return defer.resolve({
                                msg: 'User already verified.',
                                success: true,
                                user: user
                            });
                        } else if (user) {
                            return defer.resolve({
                                msg: 'Your mail varified successfully',
                                success: true,
                                user: user
                            });
                        } else {
                            return defer.reject({
                                msg: 'No user exist.',
                                success: false
                            });
                        }
                    });
                }
            });
        }

        function _forgetPassword(email) {
            if (email) {
                User.findOne({
                    [typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email']: email
                }, function (error, user) {
                    if (error) {
                        return defer.reject({
                            msg: 'Error by database',
                            success: false,
                            error: error
                        });
                    } else if (user) {
                        user.reset_password_flag = true;
                        user.save(function (error, user) {
                            if (error)
                                return defer.reject({
                                    msg: 'Error by database',
                                    success: false,
                                    error: error
                                });
                            var emailContent = typeof mail_options === 'object' && mail_options.signup_body ? mail_options.signup_body : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.RESET_PASSWORD_MAIL_TEMPLATE.BODY;
                            var token = jwt.sign({
                                [typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email']: email
                            }, session_secret_key, { expiresIn: typeof mail_options === 'object' && mail_options.exprire_in ? mail_options.exprire_in : '1h' });
                            emailContent = emailContent.replace(/RESET_TOKEN/g, token);
                            emailContent = emailContent.replace(/MAIL_RESET_URL/g, typeof mail_options === 'object' && mail_options.reset_mail_url ? mail_options.reset_mail_url : '');
                            MAIL_CONTROLLER.sendMail({
                                to: email,
                                from: typeof mail_options === 'object' && mail_options.from ? mail_options.from : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.FORGET_PASSWORD_MAIL_TEMPLATE.FROM,
                                subject: typeof mail_options === 'object' && mail_options.forget_subject ? mail_options.forget_subject : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.FORGET_PASSWORD_MAIL_TEMPLATE.SUBJECT,
                                html: emailContent
                            }).then(function (success) {
                                return defer.resolve({
                                    msg: 'Mail send successfully',
                                    success: true,
                                    mail_success: success
                                });
                            }, function (error) {
                                return defer.resolve({
                                    msg: 'Mail not send',
                                    success: false,
                                    mail_error: error
                                });
                            });
                        });
                    } else {
                        return defer.reject({
                            msg: 'No user exist.',
                            success: false
                        });
                    }
                })
            } else {
                return defer.reject({
                    msg: 'Provide valid email for send forget password link.',
                    success: false
                });
            }
        }

        function _verifyResetLink(token) {
            jwt.verify(token, session_secret_key, function (err, decoded) {
                if (error) {
                    return defer.reject({
                        msg: 'Your token has been expired',
                        success: false,
                        error: error
                    });
                } else {
                    User.findOne({
                        [typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email']: decoded.email, reset_password_flag: true,
                    }, function (error, user) {
                        if (error) {
                            return defer.reject({
                                msg: 'Your token has been expired',
                                success: false,
                                error: error
                            });
                        } else if (user) {
                            return defer.resolve({
                                msg: 'Your token has been varified successfully',
                                success: true,
                                user: user
                            });
                        } else {
                            return defer.reject({
                                msg: 'Your token has been expired',
                                success: false,
                            });
                        }
                    });
                }
            });
        }

        function _resetPassword(token, password) {
            jwt.verify(token, session_secret_key, function (err, decoded) {
                if (error) {
                    return defer.reject({
                        msg: 'Your token has been expired',
                        success: false,
                        error: error
                    });
                } else {
                    User.findOne({
                        [typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email']: decoded.email, reset_password_flag: true,
                    }, function (error, user) {
                        if (error) {
                            return defer.reject({
                                msg: 'Your token has been expired',
                                success: false,
                                error: error
                            });
                        } else if (user) {
                            user.reset_password_flag = false;
                            user[typeof model_options === 'object' && model_options.password_filed_name ? model_options.password_filed_name : 'password'] = user.generateHash(password);
                            user.save(function (error, user) {
                                if (error)
                                    return defer.reject({
                                        msg: 'Error by database',
                                        success: false,
                                        error: error
                                    });
                                return defer.resolve({
                                    msg: 'Your password reset successfully.',
                                    success: true,
                                    user: user
                                });
                            });
                            return defer.resolve({
                                msg: 'Your token has been varified successfully',
                                success: true,
                                user: user
                            });
                        } else {
                            return defer.reject({
                                msg: 'Your token has been expired',
                                success: false,
                            });
                        }
                    });
                }
            });
        }

        function _changePassword(old_password, new_password, user_id) {
            if (typeof user_id === 'string' && user_id.trim().length && typeof old_password === 'string' && old_password.trim().length && typeof new_password === 'string' && new_password.trim().length) {
                USER.findOne({
                    _id: user_id
                }, function (error, user) {
                    if (error) {
                        return defer.reject({
                            msg: 'Error by database',
                            success: false,
                            error: error
                        });
                    } else if (user) {
                        if (user.validPassword(old_password)) {
                            user.password = user.generateHash(new_password);
                            user.save(function (error, user) {
                                if (error)
                                    return defer.reject({
                                        msg: 'Error by database',
                                        success: false,
                                        error: error
                                    });
                                return defer.resolve({
                                    msg: 'Your password updated successfully',
                                    success: true,
                                    user: user
                                });
                            });
                        } else {
                            return defer.reject({
                                msg: 'Your old password not matched',
                                success: false
                            });
                        }
                    } else {
                        return defer.reject({
                            msg: 'No user found',
                            success: false
                        });
                    }
                })
            } else {
                return defer.reject({
                    msg: 'Provide old password in oldPassword field or new password in newPassword',
                    success: false
                });
            }
        }

        function _editUserDetail(user_id, user_infomation) {
            USER.findOneAndUpdate({
                _id: user_id
            }, user_infomation, { new: true }, function (error, user) {
                if (error)
                    return defer.reject({
                        msg: 'Your token has been expired',
                        success: false,
                        error: error
                    });
                return defer.resolve({
                    msg: 'User update successfully',
                    success: true,
                    user: user
                });
            });
        }

        return {
            getUserDetail: _getUserDetail,
            saveUserDetail: _saveUserDetail,
            sendConfirmationMail: _sendConfirmationMail,
            verifyConfirmationToken: _verifyConfirmationToken,
            forgetPassword: _forgetPassword,
            verifyResetLink: _verifyResetLink,
            resetPassword: _resetPassword,
            changePassword: _changePassword,
            editUserDetail: _editUserDetail
        }
    }
})();