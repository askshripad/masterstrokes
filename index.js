
var osmosis = require('osmosis');
var fs = require('fs');
var jsonfile = require('jsonfile');
var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    app = express();

var cors = require('cors');
var lodash = require('lodash');
var moment = require('moment');
const readLastLine = require('read-last-line');

var globalvar = require('./common/globalvar');
var niftyoptions = require('./routes/niftyoptiondata.js');
var wview = require('./routes/writersview.js');
var banknifty = require('./routes/bankniftyoptiondata.js');

const html = path.join(__dirname, 'build');
var dt = new Date();

app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(html));

app.use('/writersview', function (req, res, next) {
    console.log("A new writersview request received at " + Date.now());
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers , *");
    next();
});

app.use('/niftyoptiondata', function (req, res, next) {
    console.log("A new niftyoptiondata request received at " + Date.now());
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers , *");
    next();
});

app.use('/bankniftydata', function (req, res, next) {
    console.log("A new Bank Nifty request received at " + Date.now());
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers , *");
    next();
});

app.use('/writersview', wview);
app.use('/niftyoptiondata', niftyoptions);
app.use('/bankniftydata', banknifty.router);

var port = process.env.PORT || 8080;// 5000;

var niftydata = 'niftydata';
var BASE_DATA_DIR = path.join(__dirname, niftydata);



app.get('/niftyopen', function (req, res) {
    console.log('inside niftyopen ');

    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(`https://www.nseindia.com/live_market/dynaContent/live_watch/live_index_watch.htm`);

        const data = await page.evaluate(() => {
            const tds = Array.from(document.querySelectorAll('table tr td'))
            return tds.map(td => td.innerHTML)
        });

        //You will now have an array of strings
        //[ 'One', 'Two', 'Three', 'Four' ]
        console.log(data);
        res.send({ IndexData: data[0] });
        //One
        //console.log(data[0]);
        await browser.close();
    })();

});

app.post('/nifty', function (req, res) {
    //var sp = req.body.sp;
    console.log('getting nifty data for ', req.body.sp);
    if (IsNullorUndefined(req.body.sp)) {
        console.log('Required SP is null.', req.body.sp);
        res.send({ error: "Required SP is null." });
        return;
    }
    var sp = req.body.sp;
    var index = 0;
    var result = [];
    ReadSPData(sp, index, result, res)
    return;

});

app.post('/dashboard', function (req, res) {
    console.log('getting dashboard data for ');
    var breakoutData = { recotime: null, callltp: null, strikeprice: null, ROI: null, action: null };
    //var breakoutData = globalvar.breakoutData;
    var nifty50 = globalvar.nifty50;
    res.send({ breakout: breakoutData, nifty50: nifty50, makertoff: globalvar.marketoff });
});

app.get('/*', function (req, res) {
    // res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // res.send();

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


function beep() {
    process.stdout.write('\x07');
}

var server = app.listen(port, function () {

    // var d = new Date();
    // var n = d.getTimezoneOffset();
    // d.setMinutes(d.getMinutes() + Math.abs(n));
    // console.log('After Timezone offset ', d);
    // console.log("Listening to port %s", server.address().port);
    //console.log('\u0007');    
    //process.stdout.write('\x07');
    // beep(5);

    console.log('listening ', port);
    if (!fs.existsSync(globalvar.BASE_DATA_DIR)) {
        fs.mkdirSync(globalvar.BASE_DATA_DIR);
        console.log('dir created ', globalvar.BASE_DATA_DIR);
    }
    else {
        fs.readdir(globalvar.BASE_DATA_DIR, (err, files) => {
            if (err)
                console.log('error in readdir ', err);
            else {
                for (const file of files) {
                    fs.unlink(path.join(globalvar.BASE_DATA_DIR, file), err => {
                        if (err)
                            console.log('error while deleting files ', err);;
                    });
                }
            }
        });
    }
});


