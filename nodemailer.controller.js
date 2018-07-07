'use strict';
const nodemailer = require('nodemailer'),
    helper = new WeakMap(),
    sg = new WeakMap(),
    transporter = new WeakMap(),
    private_mail_options = new WeakMap(),
    private_methods = {
        initialize(mail_options) {
            if (mail_options.mail_type === 'nodemailer' && typeof mail_options.nodemailer_options === 'object') {
                transporter.set(this, nodemailer.createTransport({
                    host: mail_options.nodemailer_options.host,
                    port: mail_options.nodemailer_options.port,
                    secure: mail_options.nodemailer_options.secure || true,
                    auth: {
                        'user': mail_options.nodemailer_options.user,
                        'pass': mail_options.nodemailer_options.password
                    }
                }));
                transporter.get(this).verify((error) => {
                    if (error) {
                        throw Error(error);
                    }
                });
            } if (mail_options.mail_type === 'sendgrid' && typeof mail_options.sendgrid_options === 'object') {
                helper.set(this, require('sendgrid').mail);
                sg.set(this, require('sendgrid')(mail_options.sendgrid_options.api_key));
            } else {
                throw Error('Please provide atleast one email configuration');
            }
        }
    };
class MailController {
    constructor(mail_options) {
        private_mail_options.set(this, mail_options) ;
        private_methods.initialize.call(this,mail_options);
    }
    

    sendMail(mailOptions) {
        return new Promise((resolve, reject) => {
            if (private_mail_options.get(this).mail_type === 'sendgrid') {
                const mail = new helper.get(this).Mail(new helper.get(this).Email(mailOptions.from), mailOptions.subject, new helper.get(this).Email(mailOptions.to), new helper.get(this).Content('text/html', mailOptions.html));
                const requestEmailObj = sg.get(this).emptyRequest({
                    method: 'POST',
                    path: '/v3/mail/send',
                    body: mail.toJSON()
                });
                sg.get(this).API(requestEmailObj, (error, info) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(info);
                    }
                });
            } else if (private_mail_options.get(this).mail_type === 'nodemailer') {
                transporter.get(this).sendMail(mailOptions, (error, info) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(info);
                    }
                });
            }
        });
    }
}
module.exports = MailController;