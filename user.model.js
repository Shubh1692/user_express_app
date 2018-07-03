(function () {
  'use strict';
  const mongoose = require('mongoose');
  const bcrypt = require('bcrypt');

  module.exports = function (model_options) {
    let user_schema_fileds = {
      [typeof model_options === 'object' && model_options.email_filed_name ? model_options.email_filed_name : 'email']: {
        type: String,
        required: [true, 'Email is Require'],
      }, 
      [typeof model_options === 'object' && model_options.password_filed_name ? model_options.password_filed_name : 'password']: {
        type: String,
        required: [true, 'Password is Require'],
      }
    };
    const user_schema = new mongoose.Schema(Object.assign({}, user_schema_fileds, typeof model_options === 'object' && model_options.other_filed ? model_options.other_filed : {}));
    user_schema.methods.generateHash = function (password) {
      var hashPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
      this.password = hashPassword;
      return hashPassword;
    };
    user_schema.methods.validPassword = function (password) {
      return bcrypt.compareSync(password, this.password);
    };
    return mongoose.model(typeof model_options === 'object' && model_options.model_name ? model_options.model_name : 'User', user_schema);
  };
})();