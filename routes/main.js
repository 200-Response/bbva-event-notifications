 "use strict";

//Import Controller
const controller = require('../controllers/controller.js');

module.exports = (app) =>{
  app.get('/test', controller.test);
};