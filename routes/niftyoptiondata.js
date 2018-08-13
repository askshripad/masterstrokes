var express = require('express');
var router = express.Router();

var osmosis = require('osmosis');
var fs = require('fs');
var jsonfile = require('jsonfile');
var path = require('path'),
  bodyParser = require('body-parser');

var lodash = require('lodash');
var moment = require('moment');

var wviewfunctions = require('../common/wviewfunctions');
var globalvar = require('../common/globalvar');

var dt = new Date();

// var niftyurl = "https://www.nseindia.com/live_market/dynaContent/live_watch/option_chain/optionKeys.jsp";
// var optionUrl = "https://www.nseindia.com/live_market/dynaContent/live_watch/option_chain/optionKeys.jsp";
// var moneyControlURL = 'https://www.moneycontrol.com/indian-indices/nifty-50-9.html';
var output = [];

var niftydata = 'niftydata';

//var BASE_DATA_DIR = path.join(__dirname, '..', '..', niftydata);
var latestspdata = [];
var niftysp1data = { sp: 0, data: [] };
var niftysp2data = { sp: 0, data: [] };
var niftysp3data = { sp: 0, data: [] };
var niftyopen = 0;
//var nifty50 = { open: null, high: null, low: null, close: null };

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
  if (item.sp == niftysp1data.sp) {
    console.log('Nifty SP data ', niftysp1data.sp);
    niftysp1data.data.push(item);
  }
  else if (item.sp == niftysp2data.sp) {
    console.log('Nifty SP data ', niftysp2data.sp);
    niftysp2data.data.push(item);
  }
  else if (item.sp == niftysp3data.sp) {
    console.log('Nifty SP data ', niftysp3data.sp);
    niftysp3data.data.push(item);
  }

  var filename = "sp" + sp.toString() + ".json";
  filetowrite = path.join(globalvar.BASE_DATA_DIR, filename);
  //console.log('latestspdata ', latestspdata);
  AppendDataToJsonFile(item, filetowrite);
}
function fetchNSEData(res) {
  latestspdata = [];
  osmosis
    .get(globalvar.niftyurl)
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
      item.date = moment(dt).format("DD-MM-YYYY");
      item.time = newtime;
      var sp = Number(item.sp);
      var lowerspRange = niftyopen - 200;
      var higherspRange = niftyopen + 200;
      //console.log('Todays SP range ' + lowerspRange + higherspRange);
      if (!IsNullorUndefined(sp) && sp >= lowerspRange && sp <= higherspRange) {
        ///  appendALLDataToJsonFile(item);
        output.push(item);
        parseoptiondata(item, sp)
        //}
      }
    })
    .done(function () {
      console.log('data scrapping done!!');
      wviewfunctions.CheckWritersView(latestspdata);
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
    osmosis.get(globalvar.moneyControlURL)
      .find('//*[@id="mc_mainWrapper"]')
      .set({
        nifty: 'div[3]/div[1]/div[4]/div[1]/strong',
        open: '//div[@id="mc_mainWrapper"]//tr[2]/td[1][@class="bggry02 br01"]:html',
        high: '//div[@id="mc_mainWrapper"]//tr[2]/td[2]:html',
        low: '//div[@id="mc_mainWrapper"]//tr[3]/td[2]:html',
        prevClose: '//div[@id="mc_mainWrapper"]//tr[3]/td[1]:html',
        dateTime: 'div[3]/div[1]/p[1]'
      })
      .data
      (item => {
        //console.log('II ', item);
        var arrNiftyDT = [];
        if (item.open != null || item.open != undefined) {
          var n = item.open.indexOf("</span>");
          var open = item.open.substring(n + 7);
          open = open.trim();
          open = open.split(',').join('');
          console.log('open ', open);
          arrNiftyDT.push(open);
          globalvar.nifty50.open = open;
        }
        if (item.high != null || item.high != undefined) {
          var n = item.high.indexOf("</span>");
          var high = item.high.substring(n + 7);
          high = high.trim();
          high = high.split(',').join('');
          console.log('high ', high);
          arrNiftyDT.push(high);
          globalvar.nifty50.high = high;
        }
        if (item.low != null || item.low != undefined) {
          var n = item.low.indexOf("</span>");
          var low = item.low.substring(n + 7);
          low = low.trim();
          low = low.split(',').join('');
          console.log('low ', low);
          arrNiftyDT.push(low);
          globalvar.nifty50.low = low;
        }
        if (item.nifty != null || item.nifty != undefined) {
          item.nifty = item.nifty.trim();
          item.nifty = item.nifty.split(',').join('');
          console.log('close ', item.nifty);
          arrNiftyDT.push(item.nifty);
          globalvar.nifty50.close = item.nifty;
        }

        arrNiftyDT.push(item.dateTime);

        if (!IsNullorUndefined(arrNiftyDT)) {
          resolve(arrNiftyDT); // fulfilled
        } else {
          var reason = new Error('item.nifty is null');
          reject(reason); // reject
        }
      })
  })
}

exports.getATM = function () {
  return new Promise((resolve, reject) => {
    getnowSP()
      .then
      (indexNifty => {
        //console.log("Nifty:"+indexNifty); //Current Strike price 
        getStrikePriceArr()
          .then(
          data => {
            //console.log('data ', data);
            var curr = data[0];
            var diff = Math.abs(indexNifty[0] - curr);
            //console.log('diff ', diff);
            for (var val = 0; val < data.length; val++) {
              var newdiff = Math.abs(indexNifty[0] - data[val]);
              if (newdiff < diff) {
                diff = newdiff;
                curr = data[val];
              }
            }
            if (!IsNullorUndefined(curr)) {
              //console.log(curr);
              //console.log(indexNifty[1]);
              var atmDT = [];
              atmDT.push(curr);
              atmDT.push(indexNifty[1]);
              resolve(atmDT); // fulfilled
            } else {
              var reason = new Error('curr is null');
              reject(reason); // reject
            }
          })
      })
  }
  );
}

function getStrikePriceArr() {
  return new Promise((resolve, reject) => {
    var niftySP = [];
    var upperlimit = Number(globalvar.nifty50.open) + 200;
    var lowerlimit = Number(globalvar.nifty50.open) - 200;
    //console.log('upper limit ', upperlimit);
    //console.log('lower limit ', lowerlimit);
    osmosis.get(globalvar.niftyurl)
      .find('//table[@id="octable"]//tr')
      .set({
        strikePrice: 'td[12]'
      })
      .data
      (item => {
        var sp = Number(item.strikePrice);

        if (!IsNullorUndefined(sp) && sp >= lowerlimit && sp <= upperlimit) {
          niftySP.push(item.strikePrice);
          //console.log('niftySP ', niftySP);
        }
      })
      .done(() => resolve(niftySP));
  });
}
var i = 20;
var startTime = moment('09:45', "HH:mm");
var endTime = moment('18:59', "HH:mm");
setInterval(function () {
  // Do something every 5 seconds
  console.log('Looking for new Nifty data [ALL SPS]....');
  var now = new Date();
  var istHrs = moment(now).utcOffset("+05:30").format('HH');
  var istmins = moment(now).utcOffset("+05:30").format('mm');

  // if (istHrs == 9 && istmins < 30) {
  //   globalvar.marketoff = true;
  //   globalvar.wviewfile = null;
  //   console.log('Market Closed');
  //   return;
  // }

  // if (istHrs >= 15) {
  //   globalvar.marketoff = true;
  //   globalvar.wviewfile = null;
  //   console.log('Market Closed');
  //   return;
  // }
  globalvar.marketoff = false;
  if (niftyopen == 0) {
    getnowSP()
      .then
      (indexNifty => {
        niftyopen = Math.round(Number(indexNifty[0]));
        console.log('Todays Nifty open ', niftyopen);

        var atm1 = niftyopen % 100;
        var firstsp = niftyopen - atm1;
        niftysp1data.sp = firstsp;
        var secondsp = firstsp + 100;
        niftysp2data.sp = secondsp;
        var thirdsp = secondsp + 100;
        niftysp3data.sp = thirdsp;
        console.log('Nifty SPs  ', niftysp1data.sp, niftysp2data.sp, niftysp3data.sp);
      });
  }
  //latestspdata = [];
  if (niftyopen > 0) {
    //console.log('before fetch nse data ');
    if (globalvar.wviewfile == null) {
      var dt = new Date();
      var fdate = moment(dt).utcOffset("+05:30").format('DD-MM-YYYY');
      var filename = "writersview " + fdate.toString() + ".json";
      globalvar.wviewfile = path.join(globalvar.BASE_DATA_DIR, filename);
    }
    fetchNSEData();
  }
}, 60000);


router.post('/data', function (req, res) {

  var result = [];
  var dt = new Date();
  console.log('inside nifty option data..... ', req.body.fetchall);
  if (req.body.fetchall == false) {
    res.send({ data1: niftysp1data.data.pop(), data2: niftysp2data.data.pop(), data3: niftysp3data.data.pop(), makertoff: globalvar.marketoff });
  }
  else {
    res.send({ data1: niftysp1data.data, data2: niftysp2data.data, data3: niftysp3data.data, makertoff: globalvar.marketoff });
  }
  return;

});


// module.exports = {
//   router: router,
//   latestspdata: latestspdata
// }
module.exports = router;