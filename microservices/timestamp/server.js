// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/timestamp/:date_string?", function(req, res) {
  let d = new Date();  // default date to today
  
  // if there's a date string in the URL
  if (req.params.date_string !== undefined) {
    let dateString = req.params.date_string;
    if (/^\d*$/.test(dateString) === true) {
      dateString = parseInt(dateString);
    }
    d = new Date(dateString);
  }
  
  let unixDate = d.getTime();
  let utcDate = d.toUTCString();

  if (utcDate === "Invalid Date") {
    // instructions were contradictory, but this passes the tests
    return res.json({ "error": "Invalid Date" });
  }
  
  return res.json({ "unix": unixDate, "utc": utcDate });
});



// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});