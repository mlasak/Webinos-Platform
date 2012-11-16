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
* Copyright 2012 Martin Lasak, Fraunhofer FOKUS
******************************************************************************/
(function() {

var arduino   = require("./arduino/connector");

/**
 * Webinos Sensor service constructor (server side).
 * @constructor
 * @param rpcHandler A handler for functions that use RPC to deliver their result.  
 */

var SensorModule = function(rpcHandler, params) {
	this.params = params;
	var self = this;
	var sensor = params.sensor;
	console.log(sensor.name);
	// inherit from RPCWebinosService
	this.base = RPCWebinosService;
	this.base({
		api: sensor.type,
		displayName: sensor.name,
		description:sensor.description
	});
	var listeners = new Array();
	sensor.listener = function(value){
		console.log("***** Notify Sensor Value "+value);
		for ( var i in listeners) {
			console.log("***** Listerner"+i+": Notify Sensor Value "+value);
			var listener = listeners[i];
			var event = new SensorEvent(value);
			var rpc = rpcHandler.createRPC(listener.objectRef, "onEvent", event);
			rpcHandler.executeRPC(rpc);
		}
	};
	
	this.addEventListener = function (eventType, successHandler, errorHandler, objectRef){
		console.log("***** Add Sensor Event Listener");
		listeners.push({
			eventType: eventType,
			objectRef: objectRef
		});	
	};

	var SensorEvent = function(value){
		this.SENSOR_STATUS_ACCURACY_HIGH = 4;
		this.SENSOR_STATUS_ACCURACY_MEDIUM = 3;
		this.SENSOR_STATUS_ACCURACY_LOW = 2;
		this.SENSOR_STATUS_UNRELIABLE = 1;
		this.SENSOR_STATUS_UNAVAILABLE = 0;

		this.sensorType = sensor.type;
	    this.sensorId = self.id;
	    this.accuracy = 4;
	    this.rate = 2;
	    this.interrupt = false;
	    this.sensorValues = new Array();
	    this.sensorValues[0] = value;
	    this.timestamp = (new Date()).getTime();
	    this.unit = sensor.unit;
	};
};

SensorModule.prototype = new RPCWebinosService;

SensorModule.prototype.configureSensor = function (params, successCB, errorCB, objectRef){
	console.log("configuring temperature sensor");
	
	successCB();
}

SensorModule.prototype.getStaticData = function (params, successCB, errorCB, objectRef){
	var sensor = this.params.sensor;
	var tmp = {};
	tmp.maximumRange = 100;
	tmp.minDelay = 10;
	tmp.power = 50;
	tmp.resolution = 0.05;
	tmp.vendor = sensor.vendor;  
	tmp.version = sensor.version;
	tmp.unit = [sensor.unit];
    successCB(tmp);
};


//export our object
exports.Service = SensorModule;

})();
