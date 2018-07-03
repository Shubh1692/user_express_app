(function () {
    'use strict';
    module.exports = {
        USER_MAIL_DEFAULT_TEMPLATE: {
            SIGN_UP_MAIL_TEMPLATE: {
                SUBJECT: 'Verification mail',
                BODY: '<p>The engine’s are fired up and you’re on your way to skydiving!</p><p>Please confirm your email address.</p><p>By clicking on the following link, you are confirming your email address and agreeing to Skydive’s Terms of Service.*</p>  <p>&nbsp;</p><p><a href="' + 'https://app.theskydiveapp.com/skydiveMailConfirmation/MAIL_CONFIRMATION_TOKEN' + '">Confirm Email Address </a> </p><p><img style="height: 100px;" src="https://app.theskydiveapp.com/images/img/Skydive_logo_full_50_140x44.png" /><p>',
                FROM: 'test@test.com'
            },
            FORGET_PASSWORD_MAIL_TEMPLATE: {
                SUBJECT: 'Reset Password',
                BODY: '<p>By clicking on the following link, you are reset your account password*</p>  <p>&nbsp;</p><p><a href="' + 'https://app.theskydiveapp.com/resetPassword' + '?token=RESET_TOKEN">Reset Your Password</a> </p><p><img style="height: 100px;" src="https://app.theskydiveapp.com/images/img/Skydive_logo_full_50_140x44.png" /><p>',
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