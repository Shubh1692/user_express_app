'use strict';
const CONFIG = require('./app.config'),
    jwt = require('jsonwebtoken'),
    MailController = require('./nodemailer.controller'),
    USER = new WeakMap(),
    MailControllerInstance = new WeakMap(),
    mail_options = new WeakMap(),
    session_secret_key = new WeakMap(),
    email_filed_name = new WeakMap(),
    password_filed_name = new WeakMap(),
    privateMethods = {
        initialize(options) {
            MailControllerInstance.set(this, new MailController(options && options.mail_options ? options.mail_options : {}));
            console.log(MailControllerInstance);
            mail_options.set(this, {});
            let model_options = {};
            session_secret_key.set(this, options && options.session_secret_key ? options.session_secret_key : 'secret');
            if (typeof options === 'object') {
                mail_options.set(this, options.mail_options || {});
                model_options = options.model_options || {};
            }
            email_filed_name.set(this, typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email');
            password_filed_name.set(this, typeof model_options === 'object' && model_options.password_filed_name ? model_options.password_filed_name : 'password');
        }
    };
class UserController {
    constructor(options, USER_MODEL) {
        USER.set(this, USER_MODEL);
        privateMethods.initialize.call(this,options);
    }
    

    getUserDetail(filter_object) {
        return new Promise((resolve, reject) => {
            USER.get(this).find(filter_object || {}, (error, users) => {
                if (error)
                    return reject({
                        msg: 'Error by database',
                        success: false,
                        error: error
                    });
                return resolve({
                    msg: 'User list',
                    success: true,
                    users: users
                });
            });
        });
    }

    saveUserDetail(user_infomation) {
        return new Promise((resolve, reject) => {
            let new_user = new USER.get(this)(user_infomation);
            new_user.save((error, user) => {
                if (error)
                    return reject({
                        msg: 'Error by database',
                        success: false,
                        error: error
                    });
                return resolve({
                    msg: 'User list',
                    success: true,
                    user: user
                });
            });
        });
    }

    sendConfirmationMail(email) {
        return new Promise((resolve, reject) => {
            var emailContent = typeof mail_options.get(this) === 'object' && mail_options.get(this).signup_body ? mail_options.get(this).signup_body : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.SIGN_UP_MAIL_TEMPLATE.BODY;
            var token = jwt.sign({
                [email_filed_name.get(this)]: email
            }, `${session_secret_key.get(this)}_confirm`, { expiresIn: typeof mail_options.get(this) === 'object' && mail_options.get(this).exprire_in ? mail_options.get(this).exprire_in : '1h' });
            emailContent = emailContent.replace(/MAIL_CONFIRMATION_TOKEN/g, token);
            emailContent = emailContent.replace(/MAIL_CONFIRMATION_URL/g, typeof mail_options.get(this) === 'object' && mail_options.get(this).confirmation_mail_url ? mail_options.get(this).confirmation_mail_url : '');
            MailControllerInstance.get(this).sendMail({
                to: email,
                from: typeof mail_options.get(this) === 'object' && mail_options.get(this).from ? mail_options.get(this).from : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.SIGN_UP_MAIL_TEMPLATE.FROM,
                subject: typeof mail_options.get(this) === 'object' && mail_options.get(this).signup_subject ? mail_options.get(this).signup_subject : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.SIGN_UP_MAIL_TEMPLATE.SUBJECT,
                html: emailContent
            }).then((success) => {
                return resolve({
                    msg: 'Mail send successfully',
                    success: true,
                    mail_success: success
                });
            }, (error) => {
                return reject({
                    msg: 'Mail not send',
                    success: false,
                    mail_error: error
                });
            });
        });
    }

    verifyConfirmationToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, `${session_secret_key.get(this)}_confirm`, (error, decoded) => {
                if (error) {
                    return reject({
                        msg: typeof error === 'object' && error.message ? error.message : 'Your token has been expired',
                        success: false,
                        error: error
                    });
                } else {
                    USER.get(this).findOne({ [email_filed_name.get(this)]: decoded[email_filed_name.get(this)] }, (error, user) => {
                        if (error)
                            return reject(error);
                        else if (user && user.email_valid) {
                            return resolve({
                                msg: 'User already verified.',
                                success: true,
                                user: user
                            });
                        } else if (user) {
                            return resolve({
                                msg: 'Your mail varified successfully',
                                success: true,
                                user: user
                            });
                        } else {
                            return reject({
                                msg: 'No user exist.',
                                success: false
                            });
                        }
                    });
                }
            });
        });
    }

    forgetPassword(email) {
        return new Promise((resolve, reject) => {
            if (email) {
                USER.get(this).findOne({
                    [email_filed_name.get(this)]: email
                }, (error, user) => {
                    if (error) {
                        return reject({
                            msg: 'Error by database',
                            success: false,
                            error: error
                        });
                    } else if (user) {
                        user.reset_password_flag = true;
                        user.save((error) => {
                            if (error)
                                return reject({
                                    msg: 'Error by database',
                                    success: false,
                                    error: error
                                });
                            var emailContent = typeof mail_options.get(this) === 'object' && mail_options.get(this).forget_body ? mail_options.get(this).forget_body : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.FORGET_PASSWORD_MAIL_TEMPLATE.BODY;
                            var token = jwt.sign({
                                [email_filed_name.get(this)]: email
                            }, `${session_secret_key.get(this)}_forget`, { expiresIn: typeof mail_options.get(this) === 'object' && mail_options.get(this).exprire_in ? mail_options.get(this).exprire_in : '1h' });
                            emailContent = emailContent.replace(/RESET_TOKEN/g, token);
                            emailContent = emailContent.replace(/MAIL_RESET_URL/g, typeof mail_options.get(this) === 'object' && mail_options.get(this).reset_mail_url ? mail_options.get(this).reset_mail_url : '');
                            MailControllerInstance.get(this).sendMail({
                                to: email,
                                from: typeof mail_options.get(this) === 'object' && mail_options.get(this).from ? mail_options.get(this).from : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.FORGET_PASSWORD_MAIL_TEMPLATE.FROM,
                                subject: typeof mail_options.get(this) === 'object' && mail_options.get(this).forget_subject ? mail_options.get(this).forget_subject : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.FORGET_PASSWORD_MAIL_TEMPLATE.SUBJECT,
                                html: emailContent
                            }).then((success) => {
                                return resolve({
                                    msg: 'Mail send successfully',
                                    success: true,
                                    mail_success: success
                                });
                            }, (error) => {
                                return resolve({
                                    msg: 'Mail not send',
                                    success: false,
                                    mail_error: error
                                });
                            });
                        });
                    } else {
                        return reject({
                            msg: 'No user exist.',
                            success: false
                        });
                    }
                });
            } else {
                reject({
                    msg: 'Provide valid email for send forget password link.',
                    success: false
                });
            }
        });
    }

    verifyResetLink(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, `${session_secret_key.get(this)}_forget`, (error, decoded) => {
                if (error) {
                    return reject({
                        msg: typeof error === 'object' && error.message ? error.message : 'Your token has been expired',
                        success: false,
                        error: error
                    });
                } else {
                    USER.get(this).findOne({
                        [email_filed_name.get(this)]: decoded[email_filed_name.get(this)],
                    }, (error, user) => {
                        if (error) {
                            return reject({
                                msg: 'Error by database',
                                success: false,
                                error: error
                            });
                        } else if (user && !user.reset_password_flag) {
                            return reject({
                                msg: 'Your token has been expired',
                                success: true,
                                user: user
                            });
                        } else if (user) {
                            return resolve({
                                msg: 'Your token has been varified successfully',
                                success: true,
                                user: user
                            });
                        } else {
                            return reject({
                                msg: 'No user exist',
                                success: false,
                            });
                        }
                    });
                }
            });
        });
    }

    resetPassword(token, password) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, `${session_secret_key.get(this)}_forget`, (error, decoded) => {
                if (error) {
                    return reject({
                        msg: typeof error === 'object' && error.message ? error.message : 'Your token has been expired',
                        success: false,
                        error: error
                    });
                } else {
                    USER.get(this).findOne({
                        [email_filed_name.get(this)]: decoded[email_filed_name.get(this)], reset_password_flag: true,
                    }, (error, user) => {
                        if (error) {
                            return reject({
                                msg: 'Error by database',
                                success: false,
                                error: error
                            });
                        } else if (user && !user.reset_password_flag) {
                            return reject({
                                msg: 'Your token has been expired',
                                success: true,
                                user: user
                            });
                        } else if (user) {
                            user.reset_password_flag = false;
                            user[password_filed_name.get(this)] = user.generateHash(password);
                            user.save((error, user) => {
                                if (error)
                                    return reject({
                                        msg: 'Error by database',
                                        success: false,
                                        error: error
                                    });
                                return resolve({
                                    msg: 'Your password reset successfully.',
                                    success: true,
                                    user: user
                                });
                            });
                            return resolve({
                                msg: 'Your token has been varified successfully',
                                success: true,
                                user: user
                            });
                        } else {
                            return reject({
                                msg: 'Your token has been expired',
                                success: false,
                            });
                        }
                    });
                }
            });
        });
    }

    changePassword(old_password, new_password, user_id) {
        return new Promise((resolve, reject) => {
            if (typeof user_id === 'string' && user_id.trim().length && typeof old_password === 'string' && old_password.trim().length && typeof new_password === 'string' && new_password.trim().length) {
                USER.get(this).findOne({
                    _id: user_id
                }, (error, user) => {
                    if (error) {
                        return reject({
                            msg: 'Error by database',
                            success: false,
                            error: error
                        });
                    } else if (user) {
                        if (user.validPassword(old_password)) {
                            user.password = user.generateHash(new_password);
                            user.save((error, user) => {
                                if (error)
                                    return reject({
                                        msg: 'Error by database',
                                        success: false,
                                        error: error
                                    });
                                return resolve({
                                    msg: 'Your password updated successfully',
                                    success: true,
                                    user: user
                                });
                            });
                        } else {
                            return reject({
                                msg: 'Your old password not matched',
                                success: false
                            });
                        }
                    } else {
                        return reject({
                            msg: 'No user found',
                            success: false
                        });
                    }
                });
            } else {
                reject({
                    msg: 'Provide old password in oldPassword field or new password in newPassword',
                    success: false
                });
            }
        });
    }

    editUserDetail(user_id, user_infomation) {
        return new Promise((resolve, reject) => {
            if (typeof user_infomation === 'object' && Object.keys(user_infomation).length !== 0) {
                USER.get(this).findOneAndUpdate({
                    _id: user_id
                }, user_infomation, { new: true }, (error, user) => {
                    if (error)
                        return reject({
                            msg: 'Your token has been expired',
                            success: false,
                            error: error
                        });
                    return resolve({
                        msg: 'User update successfully',
                        success: true,
                        user: user
                    });
                });
            } else {
                reject({
                    msg: 'Provide user fields for update',
                    success: false
                });
            }
        });
    }
}
module.exports = UserController;