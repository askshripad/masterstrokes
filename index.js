
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
var niftyoptiondata = require('./routes/niftyoptiondata.js');
var wview = require('./routes/writersview.js');

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

app.use('/writersview', wview);

var port = process.env.PORT || 8080;// 5000;

var niftydata = 'niftydata';
var BASE_DATA_DIR = path.join(__dirname, '..', niftydata);



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
    var filetoread = sp10700;
    var sptoread = sp[index];
    if (sptoread === "10600")
        filetoread = sp10600;
    if (sptoread === "10700")
        filetoread = sp10700;
    readLastLine.read(filetoread, 1).then(function (line) {
        var data = JSON.parse(line);
        console.log('latest data ', data);
        res.send({ data: data });
    }).catch(function (err) {
        console.log(err.message);
        res.send({ error: err });
    });
});

app.post('/dashboard', function (req, res) {
    console.log('getting dashboard data for ');
    var breakoutData = globalvar.breakoutData;
    res.send({ breakout: breakoutData });
});

app.get('/*', function (req, res) {
    // res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // res.send();

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


var server = app.listen(port, function () {
    console.log("Listening to port %s", server.address().port);
    if (!fs.existsSync(BASE_DATA_DIR)) {
        fs.mkdirSync(BASE_DATA_DIR);
    }
});


