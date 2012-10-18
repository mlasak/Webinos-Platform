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
* Copyright 2011 Andre Paul, Fraunhofer FOKUS
******************************************************************************/
(function() {

/**
 * Webinos Actuator service constructor (server side).
 * @constructor
 * @alias ActuatorModule
 * @param rpcHandler A handler for functions that use RPC to deliver their result.  
 */
var ActuatorModule = function(rpcHandler) {
	// inherit from RPCWebinosService
	this.base = RPCWebinosService;
	this.base({
		api:'http://webinos.org/api/actuator',
		displayName:'Actuator',
		description:'A Webinos Adrino Mapping Actuator Service.'
	});
	
	this.setValue = function (value, successHandler, errorHandler, objectRef){
		console.log(value);	
		
		if (value.length >= 1){ 
			var ev = new ActuatorEvent(value);
			successHandler(ev);
		}
		else{
			errorHandler();
		}
		
	};

};

ActuatorModule.prototype = new RPCWebinosService;

/**
 * Get some initial static actuator data.
 * @param params (unused)
 * @param successCB 
 * @param errorCB
 */
ActuatorModule.prototype.getStaticData = function (params, successCB, errorCB){
	var tmp = {};
	tmp.range = [];
	tmp.range[0] = {};
	tmp.range[0].minValue = 0;
	tmp.range[0].maxValue = 3;    
	tmp.unit = ["absolute"];
	tmp.vendor = "FhG";  
	tmp.version = "0.2"; 
    successCB(tmp);
};



function ActuatorEvent(value){
	this.actuatorType = "adruino";
	this.actuatorId = "anyID";
	this.actualValue = new Array();
	if (value.length > 0) this.actualValue[0] = value[0];
	else value[0] = 0;
	if (value.length > 1) this.actualValue[1] = value[1];
	else value[1] = 0;
	if (value.length > 2) this.actualValue[2] = value[2];
	else value[2] = 0;
	if (value.length > 3) this.actualValue[3] = value[3];
	else value[3] = 0;
	
}

//export our object
exports.Service = ActuatorModule;

})();
