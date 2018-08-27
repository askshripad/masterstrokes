var express = require('express');
var router = express.Router();

var osmosis = require('osmosis');
var fs = require('fs');
var jsonfile = require('jsonfile');
var path = require('path'),
  bodyParser = require('body-parser');

var lodash = require('lodash');
var moment = require('moment');

var globalvar = require('../common/globalvar');

var dt = new Date();
var output = [];

var latestbspdata = [];
var bankniftysp1data = { sp: 0, data: [] };
var bankniftysp2data = { sp: 0, data: [] };
var bankniftysp3data = { sp: 0, data: [] };
var bankniftyopen = 0;

router.get('/test', function (req, res) {
  res.json({
    results: "test"
  });
});

IsNullorUndefined = function (obj) {
  if (obj == undefined || obj == null)
    return true;
  else
    return false;
}

function parseoptiondata(item, sp) {
  //console.log('updating sp ', sp);
  var precision = 2;
  item.calloi = item.calloi.split(',').join('');
  item.callcoi = item.callcoi.split(',').join('');
  item.putoi = item.putoi.split(',').join('');
  item.putcoi = item.putcoi.split(',').join('');

  //console.log('call oi ' + item.calloi + ' length ' + item.calloi.length);
  if (item.calloi.length == 7 || item.calloi.length == 6)
    item.calloi = parseFloat(item.calloi) / 100000;
  else
    item.calloi = parseFloat(item.calloi) / 100000;

  item.calloi.toFixed(precision);

  if (item.callcoi.length == 7 || item.callcoi.length == 6)
    item.callcoi = parseFloat(item.callcoi) / 100000;
  else
    item.callcoi = parseFloat(item.callcoi) / 100000;

  item.callcoi.toFixed(precision);

  if (item.putoi.length == 7 || item.putoi.length == 6)
    item.putoi = parseFloat(item.putoi) / 100000;
  else
    item.putoi = parseFloat(item.putoi) / 100000;

  item.putoi.toFixed(precision);

  if (item.putcoi.length == 7 || item.putcoi.length == 6)
    item.putcoi = parseFloat(item.putcoi) / 100000;
  else
    item.putcoi = parseFloat(item.putcoi) / 100000;

  item.putcoi.toFixed(precision);

  item.sp = Number(item.sp);
  latestspdata.push(item);
  if (item.sp == bankniftysp1data.sp) {
    console.log('Bank Nifty SP data ', bankniftysp1data.sp);
    bankniftysp1data.data.push(item);
  }
  else if (item.sp == bankniftysp2data.sp) {
    console.log('Bank Nifty SP data ', bankniftysp2data.sp);
    bankniftysp2data.data.push(item);
  }
  else if (item.sp == bankniftysp3data.sp) {
    console.log('Bank Nifty SP data ', bankniftysp3data.sp);
    bankniftysp3data.data.push(item);
  }
  else {
    console.log('Not saving other Bank Nifty SP');
    return;
  }

  var filename = "bsp" + sp.toString() + ".json";
  filetowrite = path.join(globalvar.BASE_DATA_DIR, filename);
  AppendDataToJsonFile(item, filetowrite);
}
function fetchbankniftyData(res) {
  latestspdata = [];
  osmosis
    .get(globalvar.bankniftyurl)
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
      var newtime = moment(dt).format("HH-mm-ss");
      //item.date = moment(dt).format("DD-MM-YYYY");
      //item.time = newtime;
      item.date = moment(dt).utcOffset("+05:30").format("DD-MM-YYYY");
      item.time = moment(dt).utcOffset("+05:30").format("HH:mm");
      var sp = Number(item.sp);
      var lowerspRange = bankniftyopen - 200;
      var higherspRange = bankniftyopen + 200;
      if (!IsNullorUndefined(sp) && sp >= lowerspRange && sp <= higherspRange) {
        output.push(item);
        parseoptiondata(item, sp)
        //}
      }
    })
    .done(function () {
      console.log('Bank Nifty data scrapping done!!');
    });
  //createOptionDataOutPutFile(output);

}

IsNullorUndefined = function (obj) {
  if (obj == undefined || obj == null)
    return true;
  else
    return false;
}


function AppendDataToJsonFile(obj, filename) {

  jsonfile.writeFile(filename, obj, { flag: 'a' }, function (err) {
    if (err)
      console.error(err)
  })
}

function getnowSP() {
  return new Promise((resolve, reject) => {
    osmosis.get(globalvar.moneyControlBankNiftyURL)
      .find('//*[@id="mc_mainWrapper"]')
      .set({
        open: '//div[@id="mc_mainWrapper"]//tr[2]/td[1][@class="bggry02 br01"]:html',
        ////*[@id="mc_mainWrapper"]/div[3]/div[1]/div[5]/div[1]/div[1]/table/tbody/tr[2]/td[1]/
        high: '//div[@id="mc_mainWrapper"]//tr[2]/td[2]:html',
        low: '//div[@id="mc_mainWrapper"]//tr[3]/td[2]:html',
        prevClose: '//div[@id="mc_mainWrapper"]//tr[3]/td[1]:html',
        dateTime: 'div[3]/div[1]/p[1]'
      })
      .data
      (item => {
        var arrNiftyDT = [];
        if (item.open != null || item.open != undefined) {
          var n = item.open.indexOf("</span>");
          var open = item.open.substring(n + 7);
          open = open.trim();
          open = open.split(',').join('');
          console.log('bank nifty open ', open);
          arrNiftyDT.push(open);
          globalvar.banknifty.open = open;
        }
        if (item.high != null || item.high != undefined) {
          var n = item.high.indexOf("</span>");
          var high = item.high.substring(n + 7);
          high = high.trim();
          high = high.split(',').join('');
          console.log('bank nifty high ', high);
          arrNiftyDT.push(high);
          globalvar.banknifty.high = high;
        }
        if (item.low != null || item.low != undefined) {
          var n = item.low.indexOf("</span>");
          var low = item.low.substring(n + 7);
          low = low.trim();
          low = low.split(',').join('');
          console.log('bank nifty low ', low);
          arrNiftyDT.push(low);
          globalvar.banknifty.low = low;
        }
        if (item.nifty != null || item.nifty != undefined) {
          item.nifty = item.nifty.trim();
          item.nifty = item.nifty.split(',').join('');
          console.log('bank nifty close ', item.nifty);
          arrNiftyDT.push(item.nifty);
          globalvar.banknifty.close = item.nifty;
        }

        arrNiftyDT.push(item.dateTime);

        if (!IsNullorUndefined(arrNiftyDT)) {
          resolve(arrNiftyDT); // fulfilled
        } else {
          var reason = new Error('Bank nifty is null');
          reject(reason); // reject
        }
      })
  })
}


function getStrikePriceArr() {
  return new Promise((resolve, reject) => {
    var bankniftySP = [];
    var upperlimit = Number(globalvar.banknifty.open) + 100;
    var lowerlimit = Number(globalvar.banknifty.open) - 100;
    //console.log('upper limit ', upperlimit);
    //console.log('lower limit ', lowerlimit);
    osmosis.get(globalvar.bankniftyurl)
      .find('//table[@id="octable"]//tr')
      .set({
        strikePrice: 'td[12]'
      })
      .data
      (item => {
        var sp = Number(item.strikePrice);

        if (!IsNullorUndefined(sp) && sp >= lowerlimit && sp <= upperlimit) {
          bankniftySP.push(item.strikePrice);
          console.log('Bank NiftySP ', niftySP);
        }
      })
      .done(() => resolve(niftySP));
  });
}
var i = 20;
var startTime = moment('09:45', "HH:mm");
var endTime = moment('18:59', "HH:mm");

updateBankNifty = function () {
  console.log('Updaing Bank Nifty data....');
  globalvar.marketoff = false;
  if (bankniftyopen == 0) {
    getnowSP()
      .then
      (indexNifty => {
        bankniftyopen = Math.round(Number(indexNifty[0]));
        console.log('Todays Bank Nifty open ', bankniftyopen);

        var atm1 = bankniftyopen % 100;
        var firstsp = bankniftyopen - atm1;
        bankniftysp1data.sp = firstsp;
        var secondsp = firstsp + 100;
        bankniftysp2data.sp = secondsp;
        var thirdsp = secondsp + 100;
        bankniftysp3data.sp = thirdsp;
        console.log('Bank Nifty SPs  ', bankniftysp1data.sp, bankniftysp2data.sp, bankniftysp3data.sp);
      });
  }
  //latestspdata = [];
  if (bankniftyopen > 0) {
    fetchbankniftyData();
  }
}


router.post('/data', function (req, res) {

  var result = [];
  var dt = new Date();
  console.log('inside nifty option data..... ', req.body.fetchall);
  if (req.body.fetchall == false) {
    res.send({
      data1: bankniftysp1data.data[bankniftysp1data.data.length - 1],
      data2: bankniftysp2data.data[bankniftysp2data.data.length - 1],
      data3: bankniftysp3data.data[bankniftysp3data.data.length - 1], makertoff: globalvar.marketoff
    });
  }
  else {
    res.send({
      data1: bankniftysp1data.data, data2: bankniftysp2data.data,
      data3: bankniftysp3data.data, makertoff: globalvar.marketoff
    });
  }
  return;

});


module.exports = {
  router: router,
  updateBankNifty: updateBankNifty,
  latestbspdata: latestbspdata,
  bankniftysp1data: bankniftysp1data,
  bankniftysp2data: bankniftysp2data,
  bankniftysp3data: bankniftysp3data
}
//module.exports = router;