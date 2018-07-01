
var path = require('path');

exports.niftyurl = "https://www.nseindia.com/live_market/dynaContent/live_watch/option_chain/optionKeys.jsp";
exports.moneyControlURL = 'https://www.moneycontrol.com/indian-indices/nifty-50-9.html';

exports.BASE_DATA_DIR = path.join(__dirname, '..', '..', 'niftydata');

//Breakouts
exports.breakoutData = { Recotime: null, CurrLTP: null, StrikePrice: null, ROI: null, Action: null };