'use strict';

const dns = require('dns');
const util = require('util');
const url = require('url');

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');

const cors = require('cors');

const bodyParser = require('body-parser');


const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(`Database connection complete`))
  .catch(err => console.log(err));

const urlSchema = new mongoose.Schema({
  "url": { "type": String, "required": true },
  "code": { "type": Number, "required": true }
});

const Url = mongoose.model('Url', urlSchema);
// reset the collection each time the server is (re)started since we don't
// make any effort (for now) to handle duplicate short codes 
Url.collection.drop();

app.use(cors());

app.use(bodyParser.urlencoded());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


// never EVER do it this way in production to get offsets
// not even ideal here, except that solving this REALLY isn't 
// thing that we're supposed to be solving (just data persistency)
let shortOffset = -1;

app.post("/api/shorturl/new", function(req, res) {

// TODO: get input from request
  const input = req.body.url; // input = 'https://www.google.com';  // req.body.url;
  const genericErrorJSON = { "error": "invalid URL" };
  let hostname = '';  // can't declare in a try/catch block. so silly.

  try {
    hostname = new URL(input).hostname;
  } catch(e) {
    return res.json(genericErrorJSON);
  }
  
  const lookup = util.promisify(dns.lookup);

  lookup(hostname)
    .then((result) => {

      shortOffset += 1;
      let data = new Url({
        "url": input,
        "code": shortOffset
      });

      data.save(function(err, data) {
        if (err) {
          console.log(`DB Save failed`);
          return res.json(genericErrorJSON); }
        // MUCH BETTER short = data._id.toString().slice(-10);
        return res.json({ "original_url": input, "short_url": shortOffset });
      });

    }).catch((error) => {
      console.log(`DNS Lookup Failed.`);
      return res.json(genericErrorJSON);
    })

});

app.get("/api/shorturl/:id", function(req, res) {
  const short = req.params.id;
  Url.findOne({"code": short}, (err, data) => {
    if (err) res.send(`Code doesn't exist.`);  // no error handling specified
    res.redirect(data.url);
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});