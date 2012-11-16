/*******************************************************************************
*  Code contributed to the webinos project
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*  
*     http://www.apache.org/licenses/LICENSE-2.0
*  
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* 
* Copyright 2011 Louay Bassbouss, Fraunhofer FOKUS
******************************************************************************/

var express = require('express');
var app = express.createServer();
app.use(express.bodyParser());
var sensors = require('./sensors.json');
var actuators = require('./actuators.json');
var providers = require('./providers.json');
var users = require('./users.json');
var tokens = require('./tokens.json');

var notifySensor = function(sensorId,sensorValue){
	var sensor = sensors[sensorId];
	if (sensor && typeof sensorValue == "number") {
		var listener = sensor.listener;
		if (typeof listener == "function" ) {
			listener(sensorValue);
		}
		return true;
	}
	return false;
};

//Login
app.post('/login', function(req, res){
	var username = req.param('username');
	var password = req.param('password');
	var user = users[username];
	if (user && user['password'] === password) {
		var token = user['token'];
		res.header('token', token);
		res.send(204);
	}
	else {
		res.send(403);
	}
});

// check login
app.get('/rest/*', function(req, res,next){
	var token = req.header('token') || req.param('token');
	var token = tokens[token];
	var user = users[token && token.username];
	if (user) {
		req.user = user;
		next();
	}
	else {
		res.send(401);
	}
});

// Sensors
app.get('/rest/sensors', function(req, res){
	res.send(sensors);
});

app.get('/rest/sensors/:id', function(req, res){
	var id = req.params.id;
	var sensor = sensors[id];
	res.send(sensor || 404);
});

app.get('/rest/notify/sensors/:id', function(req, res){
	var id = req.params.id;
	var value = req.param('value') && parseFloat(req.param('value'));
	var ok = notifySensor(id,value);
	res.send(ok && 200 || 400);
});

app.get('/rest/notify/sensors', function(req, res){
	var ids = req.param('id');
	var values = req.param('value');
	if (ids && !(ids instanceof Array)) {
		ids = [ids];
	}
	if (values && !(values instanceof Array)) {
		values = [values];
	}
	if (ids && values && ids.length === values.length) {
		for ( var i = 0; i < ids.length; i++) {
			var id = ids[i];
			var value = values[i] && parseFloat(values[i]);
			notifySensor(id,value);
		}
		res.send(200);
	}
	else {
		res.send(400);
	}
});

// actuators
app.get('/rest/actuators/:id', function(req, res){
	var id = req.param('id');
	var value = req.param('value');
	var callback = req.param('callback') || 'actuator_callback';
	res.header('Content-Type','text/javascript');
	res.send(callback+'({"id": "'+id+'", "value": '+value+'})');
});

app.get('/rest/actuators', function(req, res){
	res.send(actuators);
});

app.get('/rest/actuators/:id', function(req, res){
	var id = req.params.id;
	var actuator = actuators[id];
	res.send(actuator || 404);
});

// providers
app.get('/rest/providers', function(req, res){
	res.send(providers);
});

app.get('/rest/providers/:id', function(req, res){
	var id = req.params.id;
	var provider = providers[id];
	res.send(provider || 404);
});

app.get('/actuators/:id', function(req, res){
	var id = req.params.id;
	var callback = req.param("callback");
	var actuator = actuators[id];
	var rsp = callback? callback+"({})": {};
	res.header('Content-Type','text/javascript');
	res.send(rsp);
});

app.listen(3000);

module.exports.server = app;
module.exports.sensors = sensors;
module.exports.actuators = actuators;
