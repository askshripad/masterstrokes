
var osmosis = require('osmosis');
var fs = require('fs');
var jsonfile = require('jsonfile');
var path = require('path');
var bodyParser = require('body-parser');


var lodash = require('lodash');
var moment = require('moment');

var niftyoptiondata = require('../routes/niftyoptiondata');
var globalvar = require('./globalvar');

var dt = new Date();
var fdate = moment(dt).format("DD-MM-YYYY");
var filename = "writersview " + fdate.toString() + ".json";
var wviewfile = path.join(globalvar.BASE_DATA_DIR, filename);

var BASE_DATA_DIR = path.join(__dirname, '..', 'writersview');
var fdate = moment(dt).format("DD-MM-YYYY");
var filename = "writersview " + fdate.toString() + ".json";
var filetowrite = path.join(BASE_DATA_DIR, filename);
//var latestspdata = null;

function LookForSignal(newtime, totalcallCOI, totalputCOI, callsp, putsp, callltp, putltp) {
  var diff = Math.abs(totalcallCOI) + Math.abs(totalputCOI);

  if (totalcallCOI < 0 && totalputCOI > 0 && diff > 2) {
    var signal = { recotime: newtime, recoltp: callltp, currentLTP: callltp, strikeprice: callsp, ROI: 0, action: "Call Buy" };
    globalvar.breakoutData = signal;
    console.log('CALL SIGNAL GENERATED......');
    return;
  }
  else if (totalputCOI < 0 && totalcallCOI > 0 && diff > 2) {
    var signal = { recotime: newtime, recoltp: putltp, currentLTP: putltp, strikeprice: putsp, roi: 0, action: "Put Buy" };
    globalvar.breakoutData = signal;
    console.log('PUT SIGNAL GENERATED......');
    return;
  }

  if (globalvar.breakoutData.action == null) {
    console.log('%%%%%%%%%%%%%%%%% NO SIGNAL GENERATED %%%%%%%%%%%%%%%%');
  }


}

function CheckForExit(newtime, totalcallCOI, totalputCOI, callsp, putsp, callltp, putltp) {
  var profitpoint = 20;
  var losspoint = 10;
  var recltp = globalvar.breakoutData.recoltp;

  if (globalvar.breakoutData.action == "Call Buy" && callltp < recltp && (recltp - callltp) >= 10) {
    globalvar.breakoutData.action = "EXIT";
    return;
  }
  else if (globalvar.breakoutData.action == "Put Buy" && putltp < recltp && (recltp - putltp) >= 10) {
    globalvar.breakoutData.action = "EXIT";
    return;
  }

  if (globalvar.breakoutData.action == "Call Buy" && callltp > recltp && (callltp - recltp) >= 20) {
    globalvar.breakoutData.action = "BOOK PROFIT";
    return;
  }
  else if (globalvar.breakoutData.action == "Put Buy" && putltp > recltp && (putltp - recltp) >= 20) {
    globalvar.breakoutData.action = "BOOK PROFIT";
    return;
  }
}

function getStrikePriceArr() {
  return new Promise((resolve, reject) => {
    var niftySP = [];
    osmosis.get(optionUrl)
      .find('//table[@id="octable"]//tr')
      .set({
        strikePrice: 'td[12]'
      })
      .data
      (item => {
        //console.log(item); 
        var sp = Number(item.strikePrice);
        if (!IsNullorUndefined(sp) && sp >= 10200 && sp <= 10900) {
          niftySP.push(item.strikePrice);
        }
      })
      .done(() => resolve(niftySP));
  });
}



IsNullorUndefined = function (obj) {
  if (obj == undefined || obj == null)
    return true;
  else
    return false;
}


function createOptionDataOutPutFile(obj) {
  var optionoutputfile = path.join(__dirname, '..', 'OptionOutputdata.json');
  fs.writeFile(optionoutputfile, JSON.stringify(obj), function (err) {
    if (err)
      return console.log(err);
  });
}


function IsExpiryWeekStarted() {
  console.log('checking for expiry week ', globalvar.niftyurl);
  return new Promise((resolve, reject) => {
    osmosis.get(globalvar.niftyurl)
      .find('//select[@id="date"]')
      .set({
        expiryDate: 'option[2]'
      }).data(item => {
        console.log('expiry date ', item.expiryDate);
        //var lastThirsday=moment(new Date(item.expiryDate)).format("DD-MM-YYYY");
        var today = moment(dt);
        var lsThir = moment(new Date(item.expiryDate));
        var expdt = moment(new Date(item.expiryDate));
        var lsmon = expdt.subtract(3, "days");
        var expiry = false;
        if (today >= lsmon && today <= lsThir) {
          console.log('exp started');
          expiry = true;
          resolve(expiry);
          return true
        }
        else {
          resolve(expiry);
        }
      })


  });
}

function CalculateCOI(latestspdata) {
  var callarrSPs = [];
  var putarrSPs = [];
  callarrSPs.push(atmSP);
  callarrSPs.push(callATM1);
  callarrSPs.push(callATM2);

  putarrSPs.push(atmSP);
  putarrSPs.push(putATM1);
  putarrSPs.push(putATM2);
  console.log('put arr ', putarrSPs);
  var arrCallCOI = [];
  var arrCallOI = [];
  var arrPutOI = [];

  var arrPutCOI = [];
  var arrPutOI = [];
  var arrCallLtp = [];
  var arrPutLtp = [];
  //var data = latestspdata;
  //console.log('saved data ', data);
  callarrSPs.forEach(element => {
    console.log('input call sp ', element);
    //var picked = lodash.filter(latestspdata, x => x.sp == element);
    var picked = latestspdata.find(x => x.sp == element);
    //console.log('call picked ', picked);
    var temp = lodash.replace((picked.callcoi), ',', '');
    arrCallCOI.push(parseFloat(temp));
    arrCallLtp.push(parseFloat(picked.callltp));
    var flOI = parseFloat(picked.calloi);
    flOI = flOI.toFixed(2);
    arrCallOI.push(flOI);

  });

  putarrSPs.forEach(element => {
    var picked = latestspdata.find(x => x.sp == element);
    //lodash.filter(latestspdata, x => x.sp == element);
    var temp = lodash.replace((picked.putcoi), ',', '');
    arrPutCOI.push(parseFloat(temp));
    arrPutLtp.push(parseFloat(picked.putltp));
    var flOI = parseFloat(picked.putoi);
    flOI = flOI.toFixed(2);
    arrPutOI.push(flOI);
  });

  var dt = new Date();

  var newtime = moment(dt).format("HH-mm-ss");
  console.log('CALL Details ++++++++++++', newtime);
  console.log('CALL ATM:' + callarrSPs[0], 'CALL1:' + callarrSPs[1], 'CALL2:' + callarrSPs[2]);
  console.log('CALL OI:' + arrCallOI[0], 'OI1:' + arrCallOI[1], 'OI2:' + arrCallOI[2]);
  console.log('CALL COI:' + arrCallCOI[0], 'COI1:' + arrCallCOI[1], 'COI2:' + arrCallCOI[2]);
  console.log('Callltp:' + arrCallLtp[0], 'LTP1:' + arrCallLtp[1], 'LTP2:' + arrCallLtp[2]);

  console.log('PUT Details ------------', newtime);
  console.log('PUT ATM:' + putarrSPs[0], 'PUT1:' + putarrSPs[1], 'PUT2:' + putarrSPs[2]);
  console.log('PUT COI:' + arrPutCOI[0], 'COI1:' + arrPutCOI[1], 'COI2:' + arrPutCOI[2]);
  console.log('Put ltp:' + arrPutLtp[0], 'LTP1:' + arrPutLtp[1], 'LTP2:' + arrPutLtp[2]);

  var totalCallCOI = arrCallCOI[0] + arrCallCOI[1] + arrCallCOI[2];  //atmcoi+call1coi+call2coi
  totalCallCOI = parseFloat(totalCallCOI);
  totalCallCOI = totalCallCOI.toFixed(2);
  console.log('totalCallCOI: ' + totalCallCOI);

  var totalPutCOI = arrPutCOI[0] + arrPutCOI[1] + arrPutCOI[2];   //atmcoi+put1coi+put2coi
  totalPutCOI = parseFloat(totalPutCOI);
  totalPutCOI = totalPutCOI.toFixed(2);
  console.log('totalPutCOI1: ' + totalPutCOI);

  //
  var item = {};
  var now = new Date();
  var currtime = moment(now).format("HH-mm-ss");
  item.time = currtime;
  item.calloi = arrCallOI[0];
  item.putoi = arrPutOI[0];
  var precision = 3;
  //console.log('OIII ', item.calloi, item.putoi);
  item.callcoi = parseFloat(totalCallCOI);
  item.putcoi = parseFloat(totalPutCOI);
  console.log('current day ', now.getDate());
  if (now.getDate() <= 10) { //OTM
    console.log('OTM');
    item.callsp = callarrSPs[1];
    item.putsp = putarrSPs[2];
    item.callltp = arrCallLtp[1];
    item.putltp = arrPutLtp[2];
  }
  else if (now.getDate() > 10 && now.getDate() <= 20) { //ATM
    console.log('ATM');
    item.callsp = callarrSPs[0];
    item.putsp = putarrSPs[0];
    item.callltp = arrCallLtp[0];
    item.putltp = arrPutLtp[0];
  }
  else if (now.getDate() > 20 && now.getDate() <= 31) { //ITM

    item.callsp = callarrSPs[2];
    item.putsp = putarrSPs[1];
    item.callltp = arrCallLtp[2];
    item.putltp = arrPutLtp[1];
    console.log('ITM', item.callltp, item.putltp);
  }

  //niftyoptiondata.latestspdata = [];
  console.log('Appending wview data ');
  AppendDataToJsonFile(item, wviewfile);
  latestspdata = null;
  //

  if (globalvar.breakoutData.Action == null) {
    LookForSignal(newtime, totalCallCOI, totalPutCOI, item.callsp, item.putsp,
      item.callltp, item.putltp);
  }
  else {
    CheckForExit(newtime, totalCallCOI, totalPutCOI, item.callsp, item.putsp,
      item.callltp, item.putltp);
  }

}

CheckWritersView = function (newspdata) {

  var latestspdata = newspdata;
  //console.log('INPUT SP data for writed view ', latestspdata);
  var sumcallCOI, sumputCOI;

  niftyoptiondata.getATM()
    .then(function (atmDT) {
      // console.log(atm);
      console.log('after getatm');
      atmSP = Number(atmDT[0]);
      //if (IsExpiryWeekStarted()) {
      IsExpiryWeekStarted()
        .then
        (expiry => {
          if (expiry) {
            console.log('inside expiry  ');
            callATM1 = atmSP - 50; // ITM
            callATM2 = atmSP - 100; //FAR ITM

            putATM1 = atmSP + 50; // ITM
            putATM2 = atmSP + 100; // FAR ITM
            CalculateCOI(latestspdata);
          } else {
            callATM1 = atmSP + 50; //OTM
            callATM2 = atmSP - 50;//ITM

            putATM1 = atmSP + 50;//ITM
            putATM2 = atmSP - 50;//OTM
            CalculateCOI(latestspdata);
          }
        })

      //console.log(atm, callATM1, callATM2, putATM1, putATM2);

      // .catch(function (error) {
      //   console.log(error.message);
      // });
    });
}

function AppendDataToJsonFile(obj, filename) {
  //console.log('write obj ', obj);

  jsonfile.writeFile(filename, obj, { flag: 'a' }, function (err) {
    if (err)
      console.error(err)
  })
}

exports.CheckWritersView = CheckWritersView;