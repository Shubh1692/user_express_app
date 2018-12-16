# User Express App

An NPM package for creating a user management rest API for a register, login, forget, log out, changePassword, send confirmation mail, reset the password a user using database MongoDB by Sendgrid or nodemailer NPM packages.
 
## Installation

npm install user_express_app

### Configuration and Example
```
const UserExpressApp = require('./index.js');
new UserExpressApp({
    mail_options: {
        mail_type: 'sendgrid', /* 'nodemailer' */
        sendgrid_options: {
            api_key: 'send_grid_api_key'
        },
        nodemailer_options : {
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, /* true for 465, false for other ports */
                auth: {
                 user: account.user, /* generated ethereal user */
                 pass: account.pass /* generated ethereal password */
                }
        },
        mail_on_sign_up: true, /* default value false */
        from: '',
        signup_subject: 'Verification mail',
        signup_body: '',
        forget_subject: '',
        forget_body: ''
        
    },
    model_options: {
        other_filed: {
            profile_pic: { /*Add more filed for create more fileds */
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
        mongourl: 'mongodb://localhost:27017/database_uri'
    },
    session_secret_key: 'session_secret_key', /* default value 'session_secret_key' */
    main_route: '/userApi' /* default value '/user'*/
    same_origin: true, /* default value false (Need to send Token in header) */

});
```


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.


## License
[ISC](https://libraries.io/licenses/ISC)
