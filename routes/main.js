 "use strict";

//Import Controller
const controller = require('../controllers/testController.js');

module.exports = (app) =>{
  app.get('/test', controller.test);
};