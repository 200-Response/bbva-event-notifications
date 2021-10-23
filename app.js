'use strict';

//Import custom middleware
//=================== Modules

const express = require('express'),
  app = express(),
  glob = require('glob'),
  path = require('path'),
  bodyParser = require('body-parser'),
  cors = require('cors');

app.use(cors());

//Main Status message for server
app.get('/app/status', (req, res)=>{
  console.log('Server running correctly.');
  res.status(200).send('Server running correctly. Version 1.0.0.1');
});

// =================== Automatically require all routes and controllers
glob.sync('./routes/*.js').forEach((file)=>{
  require(path.resolve(file))(app);
});

module.exports = app;
