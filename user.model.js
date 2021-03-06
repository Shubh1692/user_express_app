(() => {
    'use strict';
    const mongoose = require('mongoose');
    const bcrypt = require('bcrypt');

    module.exports = (model_options) => {
        const user_schema_fileds = {
            [typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email']: {
                type: String,
                required: [true, 'Email is Require'],
            },
            [typeof model_options === 'object' && model_options.password_filed_name ? model_options.password_filed_name : 'password']: {
                type: String,
                required: [true, 'Password is Require'],
            },
            email_valid: {
                type: Boolean,
                default: false
            },
            reset_password_flag: {
                type: Boolean,
                default: false
            },
        };
        let user_schema = new mongoose.Schema(Object.assign({}, user_schema_fileds, typeof model_options === 'object' && model_options.other_filed ? model_options.other_filed : {}));
        user_schema.methods.generateHash = function (password) {
            var hashPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
            this[typeof model_options === 'object' && model_options.password_filed_name ? model_options.password_filed_name : 'password'] = hashPassword;
            return hashPassword;
        };
        user_schema.methods.validPassword = function (password) {
            console.log(password)
            return bcrypt.compareSync(password, this[typeof model_options === 'object' && model_options.password_filed_name ? model_options.password_filed_name : 'password']);
        };
        return mongoose.model(typeof model_options === 'object' && model_options.model_name ? model_options.model_name : 'User', user_schema);
    };
})();