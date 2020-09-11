const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const cors = require('cors');

const mongo = require('mongodb');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(`Database connection complete`))
  .catch(err => console.log(err));

const exerciseSchema = new mongoose.Schema({
  "description": { "type": String, "required": true },
  "duration": { "type": Number, "required": true, min: 0 },
  "date": { "type": Date, "required": true, "default": Date.now }
});

const exerciserSchema = new mongoose.Schema({
  "username": { "type": String, "required": true },
  "log": [ exerciseSchema ]
});

const Exerciser = mongoose.model('Exerciser', exerciserSchema);

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});





app.post("/api/exercise/new-user", (req, res) => {
  const username = req.body.username;

  let user = new Exerciser({ username });
  user.save((err, data) => {
    if (err) { return res.json({ "error": "Could not create user"}); }
    return res.json(data);
  });
});

// just return username and id list
app.get("/api/exercise/users", (req, res) => {
  const exercisers = Exerciser.aggregate([
    { "$project": { "__v": 0, "log": 0 }}
  ], (err, data) => {
    if (err) { console.log(err); return res.json({ "error": "Couldn't get user list" }); }
    return res.json(data);
  });
});


// I can add an exercise to any user by posting form data userId(_id), description,
// duration, and optionally date. If no date supplied it will use current date.
//
// Returned will be the user object with also with the exercise fields added.
// {"username":"fcc_test_15866768105","description":"fake exercise","duration":3,"_id":"Sy4UEHeuL","date":"Tue Apr 21 2020"}
app.post("/api/exercise/add", (req, res) => {

  const filter = { "_id": req.body.userId };
  const description = req.body.description;
  const duration = parseInt(req.body.duration, 10);

  if ((description === undefined) || (duration === undefined)) {
    console.log(`Don't have the required fields to add a workout`);
    return res.json({ "error": "Missing required field." });
  }

  let workout = { "description": description, "duration": duration };
  if ( req.body.date !== undefined) { workout.date = req.body.date; }

  let update = { $push: { "log": workout }};

  Exerciser.findOneAndUpdate(filter, update, { "new": true }, (err, data) => {
    if (err) {
      return res.json({ "error": "Problem adding workout to log"});
    }

    return res.json({
      "username": data.username,
      "_id": req.body.userId,
      description,
      duration,
      "date": data.log[data.log.length-1].date.toDateString()
    });

  });
});

// I can retrieve a full exercise log of any user by passing a userId(_id).
// I can retrieve part of the log of any user by also passing along optional parameters
// of from & to or limit. (Date format yyyy-mm-dd, limit = int)
//
// Return will be the user object with added array log and count (total exercise count).
// {"_id":"Sy4UEHeuL","username":"fcc_test_15866768105","count":1,"log":[
//   {"description":"fake exercise","duration":3,"date":"Tue Apr 21 2020"}
// ]}
app.get("/api/exercise/log/", (req, res) => {
  
  const userId = req.query.userId;
  const startDate = req.query.from;
  const endDate = req.query.to;
  const limit = parseInt(req.query.limit, 10);
  
  let pipeline = [
    { "$match": { "_id": mongoose.Types.ObjectId(userId)}},
    { "$addFields": { "count": { "$size": "$log" }}},
    { "$project": { "__v": 0, "log._id": 0}}
  ];

  if ((startDate !== undefined) && (endDate !== undefined)) {
    pipeline.push({ "$project": {
      "log": { "$filter": {
        "input": "$log",
        "as": "workout",
        "cond": { "$and": [
          { "$gte": [ "$$workout.date", new Date(startDate) ]},
          { "$lt": [ "$$workout.date", new Date(endDate) ]}
        ]}
      }},
      username: 1,
      _id: 1
    }});
    pipeline.push({ "$addFields": { "count": { "$size": "$log" }}});
  }
  
  if (isNaN(limit) === false) {
    pipeline.push({ "$project": { "log": { "$slice": [ "$log", limit ]}}});
  }

  const exercisers = Exerciser.aggregate(pipeline, (err, data) => {
    if (err) {
      return res.json({ "error": "Couldn't get user log" });
    }

    if (data.length === 0) { return res.json({}); }

    let logs = data[0].log.map((log) => {
      return {
        description: log.description,
        duration: log.duration,
        date: new Date(log.date).toDateString()
      };
    });

    return res.json({
      "_id": data[0]._id,
      "username": data[0].username,
      "count": data[0].count,
      "log": logs
    });
    
  });
});



// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: "not found"});
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || `Internal Server Error`;
  }
  res.status(errCode).type('txt')
    .send(errMessage);
});



const listener = app.listen(PORT, () => {
  console.log(`Your app is listening on port ${PORT}`);
});
