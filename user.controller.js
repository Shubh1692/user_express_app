'use strict';
const CONFIG = require('./app.config'),
    jwt = require('jsonwebtoken'),
    MailController = require('./nodemailer.controller');
const UserController = class UserController {
    constructor(options, USER) {
        this.USER = USER;
        this.initialize(options);
    }
    initialize(options) {
        this.MailController = new MailController(options && options.mail_options ? options.mail_options : {});
        this.mail_options = {};
        this.model_options = {};
        this.session_secret_key = options && options.session_secret_key ? options.session_secret_key : 'secret';
        if (typeof options === 'object') {
            this.mail_options = options.mail_options || {};
            this.model_options = options.model_options || {};
        }
        this.email_filed_name = typeof this.model_options === 'object' && this.model_options.email_filed_name ? this.model_options.email_filed_name : 'email';
        this.password_filed_name = typeof this.model_options === 'object' && this.model_options.password_filed_name ? this.model_options.password_filed_name : 'password';
    }

    getUserDetail(filter_object) {
        return new Promise((resolve, reject) => {
            this.USER.find(filter_object || {}, (error, users) => {
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
            let new_user = new this.USER(user_infomation);
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
            var emailContent = typeof this.mail_options === 'object' && this.mail_options.signup_body ? this.mail_options.signup_body : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.SIGN_UP_MAIL_TEMPLATE.BODY;
            var token = jwt.sign({
                [this.email_filed_name]: email
            }, `${this.session_secret_key}_confirm`, { expiresIn: typeof this.mail_options === 'object' && this.mail_options.exprire_in ? this.mail_options.exprire_in : '1h' });
            emailContent = emailContent.replace(/MAIL_CONFIRMATION_TOKEN/g, token);
            emailContent = emailContent.replace(/MAIL_CONFIRMATION_URL/g, typeof this.mail_options === 'object' && this.mail_options.confirmation_mail_url ? this.mail_options.confirmation_mail_url : '');
            this.MailController.sendMail({
                to: email,
                from: typeof this.mail_options === 'object' && this.mail_options.from ? this.mail_options.from : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.SIGN_UP_MAIL_TEMPLATE.FROM,
                subject: typeof this.mail_options === 'object' && this.mail_options.signup_subject ? this.mail_options.signup_subject : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.SIGN_UP_MAIL_TEMPLATE.SUBJECT,
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
            jwt.verify(token, `${this.session_secret_key}_confirm`, (error, decoded) => {
                if (error) {
                    return reject({
                        msg: typeof error === 'object' && error.message ? error.message : 'Your token has been expired',
                        success: false,
                        error: error
                    });
                } else {
                    this.USER.findOne({ [this.email_filed_name]: decoded[this.email_filed_name] }, (error, user) => {
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
                this.USER.findOne({
                    [this.email_filed_name]: email
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
                            var emailContent = typeof this.mail_options === 'object' && this.mail_options.forget_body ? this.mail_options.forget_body : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.FORGET_PASSWORD_MAIL_TEMPLATE.BODY;
                            var token = jwt.sign({
                                [this.email_filed_name]: email
                            }, `${this.session_secret_key}_forget`, { expiresIn: typeof this.mail_options === 'object' && this.mail_options.exprire_in ? this.mail_options.exprire_in : '1h' });
                            emailContent = emailContent.replace(/RESET_TOKEN/g, token);
                            emailContent = emailContent.replace(/MAIL_RESET_URL/g, typeof this.mail_options === 'object' && this.mail_options.reset_mail_url ? this.mail_options.reset_mail_url : '');
                            this.MailController.sendMail({
                                to: email,
                                from: typeof this.mail_options === 'object' && this.mail_options.from ? this.mail_options.from : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.FORGET_PASSWORD_MAIL_TEMPLATE.FROM,
                                subject: typeof this.mail_options === 'object' && this.mail_options.forget_subject ? this.mail_options.forget_subject : CONFIG.USER_MAIL_DEFAULT_TEMPLATE.FORGET_PASSWORD_MAIL_TEMPLATE.SUBJECT,
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
            jwt.verify(token, `${this.session_secret_key}_forget`, (error, decoded) => {
                if (error) {
                    return reject({
                        msg: typeof error === 'object' && error.message ? error.message : 'Your token has been expired',
                        success: false,
                        error: error
                    });
                } else {
                    this.USER.findOne({
                        [this.email_filed_name]: decoded[this.email_filed_name],
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
            jwt.verify(token, `${this.session_secret_key}_forget`, (error, decoded) => {
                if (error) {
                    return reject({
                        msg: typeof error === 'object' && error.message ? error.message : 'Your token has been expired',
                        success: false,
                        error: error
                    });
                } else {
                    this.USER.findOne({
                        [this.email_filed_name]: decoded[this.email_filed_name], reset_password_flag: true,
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
                            user[this.password_filed_name] = user.generateHash(password);
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
                this.USER.findOne({
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
                this.USER.findOneAndUpdate({
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
};
module.exports = UserController;