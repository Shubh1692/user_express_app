(function () {
    'use strict';
    var Q = require("q"),
        nodemailer = require('nodemailer');
    module.exports = function (mail_options) {
        let helper = null, sg = null;
        if (mail_options.mail_type === 'nodemailer' && typeof mail_options.nodemailer_options === 'object') {
            transporter = nodemailer.createTransport({
                host: mail_options.nodemailer_options.host,
                port: mail_options.nodemailer_options.port,
                secure: mail_options.nodemailer_options.secure || true,
                auth: {
                    "user": mail_options.nodemailer_options.user,
                    "pass": mail_options.nodemailer_options.password
                }
            });
            transporter.verify(function (error, success) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Server is ready to take messages');
                }
            });
        } if (mail_options.mail_type === 'sendgrid' && typeof mail_options.sendgrid_options === 'object') {
            helper = require('sendgrid').mail;
            sg = require('sendgrid')(mail_options.sendgrid_options.api_key);
        } else {
            throw Error();
        }
        
        function _sendMail(mailOptions) {
            var defer = Q.defer();
            var mail = new helper.Mail(new helper.Email(mailOptions.from), mailOptions.subject, new helper.Email(mailOptions.to), new helper.Content('text/html', mailOptions.html));
            var requestEmailObj = sg.emptyRequest({
                method: 'POST',
                path: '/v3/mail/send',
                body: mail.toJSON()
            });
            if (mail_options.mail_type === 'sendgrid') {
                sg.API(requestEmailObj, function (error, info) {
                    if (error) {
                        defer.reject(error);
                    } else {
                        defer.resolve(info);
                    }
                });
            } else if (mail_options.mail_type === 'nodemailer'){
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        defer.reject(error);
                    } else {
                        defer.resolve(info);
                    }
                });
            }
            return defer.promise;
        }
        return {
            sendMail: _sendMail
        }
    }

})();