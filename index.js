require('dotenv').config();
const express = require('express');
const moment = require('moment');
const cors = require('cors');
const app = express();
let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}
const Schema = mongoose.Schema;

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

// DB
mongoose.connect(process.env.URL, { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new Schema({
  username: String,
  exercises: [{
    duration: Number,
    description: String,
    date: Date
  }]
});

var User = mongoose.model('User', userSchema);

// Routes

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/users', (req, res) => {
  console.log(req.body)
  if (req.body.username) {
    User
      .findOne({
        username: req.body.username   // search query
      })
      .then(doc => {
        if (doc) {

          res.send({ username: doc.username, _id: doc._id })
        }
        else {
          new User({ username: req.body.username, exercises: [] })
            .save((err, usr) => {
              if (err) return done(err);
              res.send({ username: usr.username, _id: usr._id });
            });
        }
      })
      .catch(err => {
        console.error(err)
      })
  }
})

app.get('/api/users', (req, res) => {
  User.find({}, function(err, users) {
    var userMap = [];

    users.forEach(function(usr) {
      userMap.push({ username: usr.username, _id: usr._id });
    });

    res.send(userMap);
  });
})

app.post('/api/users/:_id/exercises', (req, res) => {
  var description = req.body.description;
  var duration = req.body.duration;
  var date = req.body.date ? new Date(Date.parse(req.body.date)) : new Date(Date.now());
  User
    .findOne({
      _id: req.params._id   // search query
    })
    .then(doc => {
      User.updateOne({
        _id: req.params._id   // search query
      },
        {
          exercises: [...doc.exercises, {
            duration: Number(duration),
            description: description,
            date: date
          }]
        }, (err, docs) => {
          console.log(date, typeof date);
          res.json({
            username: doc.username,
            description: description,
            duration: Number(duration),
            date: date.toDateString(),
            _id: doc._id
          })
        }
      );

    })
    .catch(err => { })
})

app.get('/api/users/:_id/logs', (req, res) => {
  User.findOne({
    _id: req.params._id   // search query
  })
    .then(doc => {
      var exercises = [];
      if (!doc) {
        res.send({ error: 'not found' })
        return;
      }
      doc.exercises.forEach((ex) => {
        if ((!req.query.to || new Date(req.query.to) >= new Date(ex.date)) && (!req.query.from || new Date(req.query.from) <= new Date(ex.date)))
          exercises.push({
            description: ex.description,
            duration: ex.duration,
            date: ex.date.toDateString()
          })
      })
      if (req.query.limit)
        exercises = exercises.slice(0, Number(req.query.limit))

      res.send(
        {
          username: doc.username,
          count: exercises.length,
          _id: doc._id,
          log: exercises
        });
    }).catch(err => { })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
