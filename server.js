'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose'),
    Schema = mongoose.schema,
    autoIncrement = require('mongoose-auto-increment');
var dns = require('dns');
const url = require('url');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
var connection = mongoose.createConnection(process.env.MONGOLAB_URI);

autoIncrement.initialize(connection);

var shortUrlSchema = new mongoose.Schema({ url: 'string' });

shortUrlSchema.plugin(autoIncrement.plugin, 'ShortUrl');
var ShortUrl = connection.model('ShortUrl', shortUrlSchema);

app.use(cors());

app.use(express.urlencoded({ extended: true })); 

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.post("/api/shorturl/new", function (req, res) {
  try {
    let newUrl = new URL(req.body.url);
    dns.lookup(newUrl.hostname, (err, addresses) => {
      if (err) {
        console.log(err.stack);
        res.json({error:"invalid URL"});
      } else {
        var url = new ShortUrl({url: req.body.url});
        url.save((err, result) => {
          if (err) {
            res.json({error:"record already exists"});
          } else {
            res.json({original_url: req.body.url, short_url: result._id});
          }
        });
      }
    });
    
  } catch (e) {
    if (e instanceof TypeError) {
      console.log(e);
      res.json({error:"invalid URL"});
    } else {
      throw e; 
    }
  }
});

app.get("/api/shorturl/:id", function (req, res) {
  var result = ShortUrl.findById(req.params.id, function(err, result) {
    if (err) throw err;
    res.redirect(result.url);
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});