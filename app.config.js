(function () {
    'use strict';
    module.exports = {
        USER_MAIL_DEFAULT_TEMPLATE: {
            SIGN_UP_MAIL_TEMPLATE: {
                SUBJECT: 'Verification mail',
                BODY: '<p>Please confirm your email address.</p><p>By clicking on the following link, you are confirming your email address and agreeing to Terms of Service.*</p>  <p>&nbsp;</p><p><a href="' + 'MAIL_CONFIRMATION_URLMAIL_CONFIRMATION_TOKEN' + '">Confirm Email Address </a> </p>',
                FROM: 'test@test.com'
            },
            FORGET_PASSWORD_MAIL_TEMPLATE: {
                SUBJECT: 'Reset Password',
                BODY: '<p>By clicking on the following link, you are reset your account password*</p>  <p>&nbsp;</p><p><a href="' + 'MAIL_RESET_URLRESET_TOKEN">Reset Your Password</a> </p>',
                FROM: 'test@test.com'
            }
        },
        REQUEST_HEADER: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
            'Access-Control-Allow-Headers': 'X-Requested-With,content-type',
            'Access-Control-Allow-Credentials': true
        },
        EXPRESS_SESSION: {
            COKKIES_MAX_AGE: 6000000
        },
        NODE_SERVER_PORT: 8000
    };
})();