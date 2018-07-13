const UserExpressApp = require('./index.js');
new UserExpressApp({
    mail_options: {
        mail_type: 'sendgrid',
        sendgrid_options: {
            api_key: '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'
        }
    },
    model_options: {
        other_filed: {
            profile_pic: {
                type: String,
                default: ''
            },
            name: {
                type: String,
                default: ''
            },
        }
    },
    mongo_options: {
        mongourl: 'mongodb://localhost:27017/reactor'
    }
});