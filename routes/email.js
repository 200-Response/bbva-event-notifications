"use strict";

//Import Controller
const emailController = require('../controllers/emailNotifyController');

module.exports = (app) =>{
  app.post('/email/send', emailController.send);
};