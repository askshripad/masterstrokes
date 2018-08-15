
var path = require('path');

exports.niftyurl = "https://www.nseindia.com/live_market/dynaContent/live_watch/option_chain/optionKeys.jsp";
exports.moneyControlURL = 'https://www.moneycontrol.com/indian-indices/nifty-50-9.html';

exports.bankniftyurl = "https://www.nseindia.com/live_market/dynaContent/live_watch/option_chain/optionKeys.jsp?symbolCode=-9999&symbol=BANKNIFTY&symbol=BANKNIFTY&instrument=OPTIDX&date=-&segmentLink=17&segmentLink=17";
exports.moneyControlBankNiftyURL = "http://www.moneycontrol.com/indian-indices/bank-nifty-23.html";

exports.BASE_DATA_DIR = path.join(__dirname, '..', 'niftydata');
//exports.EXPIRY_DIR = path.join(__dirname, '..', 'niftydata');
//Breakouts
exports.breakoutData = { recotime: null, callltp: null, strikeprice: null, ROI: null, action: null };
exports.nifty50 = { open: null, high: null, low: null, close: null };
exports.banknifty = { open: null, high: null, low: null, close: null };
exports.marketoff = false;
exports.wviewfile = null;
exports.convertLocalDatetoUTCDate = function (date) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

exports.convertUTCDateToLocalDate = function (date) {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
}

exports.ConvertToLocalTime = function (country, offset) {

    // create Date object for current location
    d = new Date();

    // convert to msec
    // add local time zone offset 
    // get UTC time in msec
    utc = d.getTime() + (d.getTimezoneOffset() * 60000);

    // create new Date object for different country
    // using supplied offset
    nd = new Date(utc + (3600000 * offset));

    // return time as a string
    console.log("The local time in " + country + " is " + nd.toLocaleString());
    return nd;

}