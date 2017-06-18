var express = require('express');
var cors = require('cors')
var airbnb = require('./airapi');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '5mb' })); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' })); // support encoded bodies

app.use(cors());

var ObjectId = require('mongodb').ObjectID;

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/db';


app.post('/schedule', function (req, res) {
  var data = req.body.data;

  var promises = data.map(function(d) {
    var airbnb_pk = d.airbnb_pk;
    var _id = d._id;
    var dt = new Date();
    return new Promise(function(resolve, reject) {
      airbnb.getCalendar(airbnb_pk, {
        currency: 'USD',
        month: dt.getMonth() + 1,
        year: dt.getFullYear(),
        count: 3
      }).then(function(schedule) {
        MongoClient.connect(url, function(err, db) {
           db.collection('hosts').findOneAndUpdate(
             { _id: ObjectId(_id) },
             { $set: { 'schedule': schedule } }
           ).then(function() {
             console.log(JSON.stringify(arguments))
             db.close();
             resolve(schedule);
           })
        });
      }, function() {
        resolve({error: 'airbnb not found'});
      });
    });
  });

  Promise.all(promises).then(function(results) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(results));
  });

})


app.get('/', function (req, res) {
  airbnb.search({
   location: '大阪',
   checkin: '06/03/2017',
   checkout: '06/06/2017',
   guests: 2,
   page: 5000,
  }).then(function(searchResults) {
    console.log(searchResults);
    res.send(searchResults)
  });
})

app.post('/fetch', function (req, res) {
  var data = req.body.data;

  var promises = data.map(function(d) {
    var airbnb_pk = d.airbnb_pk;
    var _id = d._id;
    return new Promise(function(resolve, reject) {
      airbnb.getInfo(airbnb_pk).then(function(doc) {
        MongoClient.connect(url, function(err, db) {
           if (_id) {
               delete d._id;
               d.listing = doc.listing;
               db.collection('hosts')
                 .replaceOne({_id: ObjectId(_id)}, d)
                 .then(function() {
                   db.close();
                   d._id = _id;
                   for (var prop in doc.listing) {
                     d['list_' + prop] = doc.listing[prop];
                   }
                   delete d.listing;
                   resolve(d);
                 });
           }
        });
      }, function() {
        resolve({error: 'airbnb not found'});
      });
    });
  });

  Promise.all(promises).then(function(results) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(results));
  });
})

app.get('/host', function (req, res) {
    // Connect using MongoClient
    MongoClient.connect(url, function(err, db) {
       db.collection('hosts').find().toArray(function(err, docs) {
         docs.forEach(function(doc) {
            for (var prop in doc.listing) {
              doc['list_' + prop] = doc.listing[prop];
            }
            delete doc.listing;
         });
         res.setHeader('Content-Type', 'application/json');
         res.send(JSON.stringify(docs));
         db.close();
       });
    });
})

app.post('/host', function (req, res) {
    var data = req.body.data;
    // Connect using MongoClient
    MongoClient.connect(url, function(err, db) {
       data.forEach(function(d) {
           var _id = d._id;
           if (_id) {
               delete d._id;
               db.collection('hosts')
                 .replaceOne({_id: ObjectId(_id)}, d)
                 .then(function() {
                   db.close();
                 });
           } else {
               db.collection('hosts')
                 .insertOne(d)
                 .then(function() {
                   db.close();
                 });
           }
       })
       res.setHeader('Content-Type', 'application/json');
       res.send(JSON.stringify(data));
    });
})

app.delete('/host', function (req, res) {
    var data = req.body;
    // Connect using MongoClient
    MongoClient.connect(url, function(err, db) {
       data.forEach(function(_id) {
         db.collection('hosts')
           .deleteOne({_id: ObjectId(_id)})
           .then(function() {
             db.close();
             res.setHeader('Content-Type', 'application/json');
             res.send(JSON.stringify(arguments));
           });
       })
    });
})

app.get('/currency',  function (req, res) {
    MongoClient.connect(url, function(err, db) {
      db.collection('currency').find().toArray(function(err, rates) {
        if (rates.length === 1) {
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify(rates));
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify([{
            usd2jpy: -1,
            usd2cny: -1,
          }]));
        }
        db.close();
      });
    });
})

app.post('/currency', function (req, res) {
    var data = req.body.data;
    var _db;
    var insertOne = function() {
      _db.collection('currency')
        .insertOne(data.currency)
        .then(function(err, r) {
           res.setHeader('Content-Type', 'application/json');
           res.send(JSON.stringify(data));
           db.close();
        });
    };

    MongoClient.connect(url, function(err, db) {
       _db = db;
       db.collection('currency').find().toArray(function(err, rates) {
         if (rates.length === 0 && data.currency) {
            insertOne();
         } else {
            db.collection('currency').drop(insertOne);
         }
       });
    });
})

app.listen(8000, function () {
  console.log('Example app listening on port 8000!')
})
