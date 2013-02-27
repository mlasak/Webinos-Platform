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
* Copyright 2012-2013 Fraunhofer FOKUS
* Authors: André Paul, Martin Lasak
******************************************************************************/
(function() {

var fs = require('fs');
var RPCWebinosService = require("webinos-jsonrpc2").RPCWebinosService;
var exec = require('child_process').exec;

var dependencies = require("find-dependencies")(__dirname)	
var pzp = dependencies.global.require(dependencies.global.pzp.location,"lib/pzp.js")

	var not = null;
		
	if(process.platform=='android')
	{
		not = require('bridge').load('org.webinos.impl.WebNotificationManagerImpl', this);
	}
	
/**
 * ...
 * 
 * ...
 * @constructor
 * @param rpcHandler A handler for functions that use RPC to deliver their result.
 * @param params Parameters to initialize the service.
 */
var WebNotificationModule = function(rpcHandler, params) {
	// inherit from RPCWebinosService
	this.base = RPCWebinosService;
	this.base({
		api:'http://webinos.org/api/notifications',
		displayName:'Web Notification',
		description:'Web Notification API'
	});
	
}

WebNotificationModule.prototype = new RPCWebinosService;

/**
 * ...
 * @param params Array with parameters.
 * @param successCB Success callback.
 * @param errorCB Error callback.
 * @param objectRef RPC object reference.
 */
WebNotificationModule.prototype.notify = function(params, successCB, errorCB, objectRef){
	console.log("notify was invoked");
	console.log(params);
	
	var title = params[0].replace(/"/g,'');
	var body = params[1].body.replace(/"/g,'');
	var iconFileName = params[1].iconUrl.replace(/"/g,'');
	//var icon = pzp.session.getWebinosPath() + "/" + iconFileName;
	//TODO: fetch images from remote, currently only full path to image is supported 
	var icon = iconFileName;
	
	//on linux
	if(process.platform==='linux')
	{
		var notifysendexecutable = (fs.existsSync(__dirname+"/../src/platform/linux/notify-send-alternative"))?__dirname+"/../src/platform/linux/notify-send-alternative":"notify-send";
		exec(notifysendexecutable+" \"" + title + "\" \"" + body + "\" -i \"" + icon + "\"", function(error, stdout, stderr){
			console.log("Result: " + error + " " + stdout + " " + stderr);

			if (error && typeof errorCB === "function") {
				errorCB("Could not invoke native notification.");
				return;
			}

			if(stdout.indexOf("CLICKED") > -1) {
				successCB("onClick");
			}
			else{
				if(stdout.indexOf("CLOSED") > -1) {
					successCB("onClose");
				}
			}
		});
		
				
		//successCB("onShow");
		
	}

	//on win
	if(process.platform==='win32')
	{
		exec("notify-send \"" + title + "\" \"" + body + "\" -i \"" + icon + "\"", function(error, stdout, stderr){
			console.log("Result: " + error + " " + stdout + " " + stderr);

			if (error && typeof errorCB === "function") {
				errorCB("Could not invoke native notification.");
				return;
			}

			if(stdout.indexOf("CLICKED") > -1) {
				successCB("onClick");
			}
			else{
				if(stdout.indexOf("CLOSED") > -1) {
					successCB("onClose");
				}
			}
		});
		
				
		//successCB("onShow");
		
	}

	//on mac
	if(process.platform==='darwin' )
	{
		iconFileName = iconFileName.split('/');
		iconFileName = iconFileName[iconFileName.length-1];
		exec(__dirname+"/../src/platform/mac/cocoadialog/build/Default/CocoaDialog.app/Contents/MacOS/CocoaDialog bubble --title "+title+" --text "+body+" --icon-file "+__dirname+"/"+iconFileName, function(error, stdout, stderr){

			if (error && typeof errorCB === "function") {
				errorCB("Could not invoke native notification.");
				return;
			}

			if(stdout.indexOf("CLICKED") > -1) {
				successCB("onClick");
			}else{
		
				successCB("onClose");
				
			}
		});
		
				
		//successCB("onShow");
		
	}

	//on android
	if(process.platform==='android') //on android
	{
	  var toAndroid = [];
	  toAndroid.push(title);
	  toAndroid.push(body);
	  toAndroid.push(icon);
	  not.notify(toAndroid,function (res) {
		  	if (res == "onclick") successCB("onClick");
		  	if (res == "onShow") successCB("onShow");
		  	if (res == "onClose") successCB("onClose");
		  	console.log(res);
		  }, 
		  function (err) {
			  errorCB(err);
			  console.log(err);
		});
	}



	
	
}

// export our object
exports.Service = WebNotificationModule;

})();
