
var express = require('express');
var router = express.Router();

var niftyoptiondata = require('./niftyoptiondata');
var globalvar = require('../common/globalvar');

var osmosis = require('osmosis');
var fs = require('fs');
var jsonfile = require('jsonfile');
var path = require('path'),
  bodyParser = require('body-parser');

var lodash = require('lodash');
var moment = require('moment');
const readLastLine = require('read-last-line');
var readline = require('readline');

var dt = new Date();
var fdate = moment(dt).format("DD-MM-YYYY");
var filename = "writersview " + fdate.toString() + ".json";
var wviewfile = path.join(globalvar.BASE_DATA_DIR, filename);

//var breakoutData = { Recotime: null, CurrLTP: null, StrikePrice: null, ROI: null, Action: null };

//var BASE_DATA_DIR = path.join(__dirname, '..', 'writersview');
var fdate = moment(dt).format("DD-MM-YYYY");
var filename = "writersview " + fdate.toString() + ".json";
var filetowrite = path.join(globalvar.BASE_DATA_DIR, filename);
/*const puppeteer = require('puppeteer');
 const Xray=require('x-ray');
var phantom = require('x-ray-phantom');
var phantom1 = require('phantom'); */

router.get('/test', function (req, res) {
  res.json({
    results: "test"
  });
});

var sp = 10700;

router.post('/data', function (req, res) {

  var result = [];
  var dt = new Date();
  sp++;
  var bo = { time: dt, sp: sp };
  var breakoutData = globalvar.breakoutData;//{ Recotime: null, CurrLTP: null, StrikePrice: null, ROI: null, Action: null };//
  console.log('breakout data ', breakoutData);
  var offset = dt.getTimezoneOffset();
  if (req.body.fetchall == false) {
    readLastLine.read(wviewfile, 1).then(function (line) {
      var data = JSON.parse(line);
      result.push(data);
      console.log('latest wview data ', data);
      res.send({ data: result, breakout: breakoutData, offset: offset, makertoff: globalvar.marketoff });
    }).catch(function (err) {

      console.log(err.message);
      res.send({ error: err });
    });
  }
  else {
    fs.readFile(wviewfile, 'utf-8', (err, file) => {
      if (file == null || file == undefined) {
        res.send({ data: null, breakout: breakoutData, offset: offset, makertoff: globalvar.marketoff });
        return;
      }
      const lines = file.split('\n')
      var counter = 0;
      var line = null;
      var data = null;
      for (let index = 0; index < lines.length; index++) {
        line = lines[index];
        //console.log('  line ', line);
        if (line) {
          data = JSON.parse(line);
          //console.log(' parsed OBJ ', data);
          result.push(data);
        }
        if (index == (lines.length - 1)) {
          //console.log('parsing last line ', line);

          res.send({ data: result.reverse(), breakout: breakoutData, offset: offset, makertoff: globalvar.marketoff });
        }
      }
    });

  }
});


module.exports = router;