
var express = require('express');
var router = express.Router();

var fs = require('fs');
var jsonfile = require('jsonfile');
var path = require('path'),
  bodyParser = require('body-parser');


var wviewfunctions = require('../common/wviewfunctions');
var globalvar = require('../common/globalvar');
var banknifty = require('./bankniftyoptiondata');
var niftyoptiondata = require('./niftyoptiondata');
var bankniftyanalytics = require('./bankniftyanalytics');
router.get('/test', function (req, res) {
  res.json({
    results: "test"
  });
});

router.post('/stop', function (req, res) {

  if (globalvar.marketoff == true) {
    res.send({ msg: 'Market is already closed' });
    return;
  }
  globalvar.marketoff = true;
  console.log('inside Admin stop..... ');

  res.send({ msg: 'stopped' });

});

router.post('/start', function (req, res) {

  if (globalvar.marketoff == false) {
    res.send({ msg: 'Market is already started' });
    return;
  }
  niftyoptiondata.ClearData();
  globalvar.marketoff = false;
  bankniftyanalytics.FetchOpen();
  console.log('inside Admin start..... ');

  res.send({ msg: 'started' });

});



module.exports = router;