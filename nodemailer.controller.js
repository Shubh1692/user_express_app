'use strict';
const nodemailer = require('nodemailer');
const MailController = class MailController {
    constructor(mail_options) {
        this.mail_options = mail_options;
        this.initialize(mail_options);
    }
    initialize(mail_options) {
        if (mail_options.mail_type === 'nodemailer' && typeof mail_options.nodemailer_options === 'object') {
            this.transporter = nodemailer.createTransport({
                host: mail_options.nodemailer_options.host,
                port: mail_options.nodemailer_options.port,
                secure: mail_options.nodemailer_options.secure || true,
                auth: {
                    'user': mail_options.nodemailer_options.user,
                    'pass': mail_options.nodemailer_options.password
                }
            });
            this.transporter.verify((error) => {
                if (error) {
                    throw Error(error);
                }
            });
        } if (mail_options.mail_type === 'sendgrid' && typeof mail_options.sendgrid_options === 'object') {
            this.helper = require('sendgrid').mail;
            this.sg = require('sendgrid')(mail_options.sendgrid_options.api_key);
        } else {
            throw Error('Please provide atleast one email configuration');
        }
    }

    sendMail(mailOptions) {
        return new Promise((resolve, reject) => {
            const mail = new this.helper.Mail(new this.helper.Email(mailOptions.from), mailOptions.subject, new this.helper.Email(mailOptions.to), new this.helper.Content('text/html', mailOptions.html));
            const requestEmailObj = this.sg.emptyRequest({
                method: 'POST',
                path: '/v3/mail/send',
                body: mail.toJSON()
            });
            if (this.mail_options.mail_type === 'sendgrid') {
                this.sg.API(requestEmailObj, (error, info) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(info);
                    }
                });
            } else if (this.mail_options.mail_type === 'nodemailer') {
                this.transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(info);
                    }
                });
            }
        });
    }
};
module.exports = MailController;