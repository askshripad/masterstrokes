var express = require('express');
var router = express.Router();

var osmosis = require('osmosis');
var fs = require('fs');
var jsonfile = require('jsonfile');
var path = require('path'),
  bodyParser = require('body-parser');

var lodash = require('lodash');
var moment = require('moment');

var bankniftydata = require('./bankniftyoptiondata');
var globalvar = require('../common/globalvar');
var bankniftyjson = require('./BankNifty.json');

var startfetchingOI = false;
var bnclose = null;

router.get('/test', function (req, res) {
  res.json({
    results: "test"
  });
});


function CreateSPArray(element) {
  element.sp1data = { sp: 0, data: [] };
  element.sp2data = { sp: 0, data: [] };
  element.sp3data = { sp: 0, data: [] };

  var open = element.open;
  var spdiff = element.SPDiff;
  var atm1 = open % spdiff;
  var firstsp = open - atm1;
  var secondsp = firstsp + spdiff;
  var thirdsp = secondsp + spdiff;
  element.sp1data.sp = firstsp;
  element.sp2data.sp = secondsp;
  element.sp3data.sp = thirdsp;

  // console.log('Strike Price Array for @@ ' + element.quote + ' ' + element.sp1data.sp + ' '
  //     + element.sp2data.sp + ' ' + element.sp3data.sp);

}

function FetchOpen() {
  console.log('inside FetchOpen @@@@@@@');
  var now = new Date();
  istHrs = moment(now).utcOffset("+05:30").format('HH');
  istmins = moment(now).utcOffset("+05:30").format('mm'); //istHrs > 9 &&
  if (!startfetchingOI) {
    //console.log('lookinf for master candle ', element.url);
    for (let index = 0; index < bankniftyjson.length; index++) {
      const element = bankniftyjson[index];
      console.log('element ', element.url);
      if (element.master == null || element.master == undefined) {
        osmosis.get(element.url)
          .find('//*[@id="Nse_Prc_tick"]')
          .set({
            open: '//*[@id="n_open"]/strong',
            // high: '//*[@id="n_high_sh"]',
            // low: '//*[@id="n_low_sh"]',
            close: '//*[@id="Nse_Prc_tick"]/strong'
          })
          .data
          (item => {

            if ((item.open != null || item.open != undefined)) {
              element.open = Number(item.open);
              bnclose = Number(item.close);
              console.log('Open data for ' + element.quote + ' ' + element.open);
              CreateSPArray(element);
              //resolve('done');
            }
            else {
              console.log('Undefnied open data for : ', element.quote);
              //reject('error');
            }
          })
      }

    }
    startfetchingOI = true;
  }

}

function parseoptiondata(element, item) {
  //console.log('updating sp ', sp);
  var precision = 2;
  item.calloi = item.calloi.split(',').join('');
  item.callcoi = item.callcoi.split(',').join('');
  item.putoi = item.putoi.split(',').join('');
  item.putcoi = item.putcoi.split(',').join('');

  item.calloi = parseFloat(item.calloi);// / 100000;
  item.calloi.toFixed(precision);

  item.callcoi = parseFloat(item.callcoi);
  item.callcoi.toFixed(precision);

  item.putoi = parseFloat(item.putoi);
  item.putoi.toFixed(precision);
  item.putcoi = parseFloat(item.putcoi);
  item.putcoi.toFixed(precision);
  if (element.sp1data.sp == item.sp)
    element.sp1data.data.push(item);
  if (element.sp2data.sp == item.sp)
    element.sp2data.data.push(item);
  if (element.sp3data.sp == item.sp)
    element.sp3data.data.push(item);

}

var done = false;

function fetchbankniftyData(element) {
  osmosis
    .get(element.nseurl)
    .find('//*[@id="octable"]//tr')
    .set({
      sp: 'td[12]',
      calloi: 'td[2]',
      callcoi: 'td[3]',
      callltp: 'td[6]',
      putltp: 'td[18]',
      putoi: 'td[22]',
      putcoi: 'td[21]'
    })
    .data(item => {
      //console.log('new item', item);
      var dt = new Date();
      item.date = moment(dt).utcOffset("+05:30").format("DD-MM-YYYY");
      item.time = moment(dt).utcOffset("+05:30").format("HH:mm");
      item.sp = Number(item.sp);
      //var lowerspRange = bankniftyopen - 200;
      //var higherspRange = bankniftyopen + 200;
      //if (!IsNullorUndefined(sp) && sp >= lowerspRange && sp <= higherspRange) {
      if (!IsNullorUndefined(item.sp) && (item.sp == element.sp1data.sp || item.sp == element.sp2data.sp
        || item.sp == element.sp3data.sp)) {
        parseoptiondata(element, item)
        //}
      }
    })
    .done(function () {
      console.log('Bank Nifty Stock data scrapping done!!');
      // if (!done) {
      //     console.log('SP Data ' + element.quote + ' ' + element.sp1data.sp);
      //     for (let i = 0; i < element.sp1data.data.length; i++) {
      //         const data = element.sp1data.data[i];
      //         console.log('SP 1 data ', data);
      //     }
      //     for (let i = 0; i < element.sp2data.data.length; i++) {
      //         const data = element.sp2data.data[i];
      //         console.log('SP 2 data ', data);
      //     }
      //     for (let i = 0; i < element.sp3data.data.length; i++) {
      //         const data = element.sp3data.data[i];
      //         console.log('SP 3 data ', data);
      //     }

      // }
      //else {
      // console.log('SP1 length ', element.quote, element.sp1data.data.length);
      // console.log('SP2 length ', element.quote, element.sp2data.data.length);
      // console.log('SP3 length ', element.quote, element.sp3data.data.length);

      //}
    });
  //createOptionDataOutPutFile(output);

}

router.post('/data', function (req, res) {

  var result = [];
  var dt = new Date();
  console.log('inside bank nifty Analytics data..... ', req.body.fetchall, bankniftydata.bankniftysp1data.data.length);

  if (req.body.fetchall == false) {
    var banknifty = null;
    if (bankniftydata.bankniftysp1data.data.length > 0) {
      banknifty = {
        sp1data: bankniftydata.bankniftysp1data, sp2data: bankniftydata.bankniftysp2data,
        sp3data: bankniftydata.bankniftysp3data, close: bnclose
      }
    }
    //console.log('Bank Nifty Data ', banknifty);
    if (bankniftyjson.length == 6) {
      res.send({
        banknifty: banknifty,
        data1: bankniftyjson[0], data2: bankniftyjson[1], data3: bankniftyjson[2],
        data4: bankniftyjson[3], data5: bankniftyjson[4], data6: bankniftyjson[5],
        makertoff: globalvar.marketoff
      });
    }
    else {
      res.send({
        banknifty: null,
        data1: null, data2: null, data3: null, data4: null, data5: null, data6: null, makertoff: globalvar.marketoff
      });
    }
  }
  else {
    if (bankniftyjson.length == 6) {
      var banknifty = null;
      if (bankniftydata.bankniftysp1data.data.length > 0) {
        banknifty = {
          sp1data: bankniftydata.bankniftysp1data, sp2data: bankniftydata.bankniftysp2data,
          sp3data: bankniftydata.bankniftysp3data, close: bnclose
        }
      }
      res.send({
        banknifty: banknifty,
        data1: bankniftyjson[0], data2: bankniftyjson[1], data3: bankniftyjson[2],
        data4: bankniftyjson[3], data5: bankniftyjson[4], data6: bankniftyjson[5],
        makertoff: globalvar.marketoff
      });
    }
    else {
      res.send({
        banknifty: null,
        data1: null, data2: null, data3: null, data4: null, data5: null, data6: null, makertoff: globalvar.marketoff
      });
    }
  }

});

function updatebankniftyData() {
  console.log('Looking for  Bank Nifty Analytics interval****************');
  for (let index = 0; index < bankniftyjson.length; index++) { //
    const element = bankniftyjson[index];
    if (!globalvar.IsNullorUndefined(element.open)) {
      console.log('Bank Nifty Analytics Data ' + element.quote);
      fetchbankniftyData(element);
    }

  }
}
setInterval(function () {
  // Do something every 5 seconds
  updatebankniftyData();
  // var now = new Date();
  // istHrs = moment(now).utcOffset("+05:30").format('HH');
  // istmins = moment(now).utcOffset("+05:30").format('mm');

}, 900000);

module.exports = {
  router: router,
  FetchOpen: FetchOpen,
  updatebankniftyData: updatebankniftyData,
}
//module.exports = router;