let express = require('express');

let bodyParser = require('body-parser');

let mongodb = require('mongodb');

let objectId = require('mongodb').ObjectId;

let multiparty = require("connect-multiparty");

let fs = require("fs");

let app = express();

//configuracao do body parser
app.use(bodyParser.urlencoded({extended : true}));

app.use(bodyParser.json());

app.use(multiparty());

app.use(function(req,res,next){

	res.setHeader("Access-Control-Allow-Origin","*");
	res.setHeader("Access-Control-Allow-Methods","GET, POST, PUT, DELETE");
	res.setHeader("Access-Control-Allow-Headers","content-type");
	res.setHeader("Access-Control-Allow-Credentials", true);

	next();
});

module.exports = app;