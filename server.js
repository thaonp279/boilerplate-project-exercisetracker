const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
process.env.MONGO_URI="mongodb+srv://thaonp279:RzcuS7jEmuKTCjN@cluster0.adfqp.mongodb.net/Cluster0?retryWrites=true&w=majority";
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});
const { Schema } = mongoose;
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

var userSchema = new Schema({
  username: {type: String, required: true}
});

var exerciseSchema = new Schema({
  userId: {type: String, required: true},
  username: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: Number
});

var User = mongoose.model('User', userSchema);
var Exercise = mongoose.model('Exercise', exerciseSchema);

//create new user
const createUser = (username, done) => {
  let user = new User({username});
  user.save((err, data) => {
    if (err) return done(err);
    done(null, data)
  })
}

//receive new user request
app.post('/api/exercise/new-user', (req, res, next) => {
  let user = req.body.username;
  User.findOne({username: user}).exec((err, data) => {
    if (err) return next(err);
    if (data) {
      res.send("Username already taken");
    } else {
      createUser(user, (err, newUser) => {
        if (err) return next(err);
        console.log(newUser);
        res.json(newUser);
      })
    }
  })
  
})

//receive exercise request
app.post('/api/exercise/add', (req, res, next) => {
  User.findById(req.body.userId).exec((err, user) => {
    console.log('looking for user');
    if (err) return next(err);
    let date;
    if (req.body.date) {
      date = new Date(req.body.date).valueOf();
    } else {
      date = new Date().setHours(0,0,0,0).valueOf();
    }
    let userId = user._id;
    let username = user.username;
    let description = req.body.description;
    let duration = req.body.duration;
    
    let exercise = new Exercise({
      userId, username, description, duration, date
    });
    exercise.save((err, data) => {
      if (err) return next(err);
      console.log("exercise logged: "+data)
      res.json({_id: data.userId, username: data.username, description: data.description, duration: data.duration, date: new Date(data.date).toDateString()});
    })
  })
})

//retrieve exercise log
app.get('/api/exercise/log', (req, res, next) => {
  console.log('request query: ', req.query);
  let userId = req.query.userId;
  let start = new Date(req.query.from).valueOf();
  let end = new Date(req.query.to).valueOf();
  let limit = Number(req.query.limit);
  let query, username;
  if(!userId){
    res.send("Unknown userId");
  } else {
    User.findById(userId).exec((err, data) => {
      if (err) return next(err);
      username = data.username;
    })
    query = {userId};
    if (start) {
      query.date = {};
      query.date.$gte = start;
    };
    if (end) {
      if (!query.date) {
        query.date = {};
      }
      query.date.$lte = end;
    };
  }
  console.log('mongo query : ',query);
  Exercise.find(query).limit(limit).exec((err, data) => {
    if (err) return next(err);
    let response = {_id: userId, username};
    console.log('query result: ', data);
    if (start) {
      response.from = new Date(start).toDateString();
    };
    if (end) {
      response.to = new Date(end).toDateString();
    };
    response.count = data.length;
    response['log'] = data.map(log => {
      return {description: log.description, duration: log.duration, date: new Date(log.date).toDateString()}
      });
    res.json(response);
  })
})

app.get('/api/exercise/users', (req, res, next) => {
  User.find({}, '-__v').exec((err, data) => {
    if (err) next(err);
    res.json(data);
  })
})

Exercise.find().exec((err, data) => {console.log(data)});
