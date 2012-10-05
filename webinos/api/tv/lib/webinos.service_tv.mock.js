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

// Implementation of the tv module API that works without any specific STB hardware

var MOCK_CHANNELS_FILE = __dirname + '/../tools/mock-channels.json';
 
(function() {

	var WebinosTV, TVManager, TVDisplayManager, TVDisplaySuccessCB, TVTunerManager, TVSuccessCB, TVErrorCB, TVError, TVSource, Channel, ChannelChangeEvent;

	var channelChangeHandlers = [];

	/**
	 * Set the configuration parameters for the mock service.
	 */
	exports.tv_setConf = function(params) {
		if(params && params.path){
			MOCK_CHANNELS_FILE = params.path;
		}
	}

	/**
	 * Creates tv object.
	 * 
	 */
	WebinosTV = function() {
		this.tv = new TVManager();
	};
	WebinosTV.prototype.tv = null;

	/**
	 * Interface to manage what's currently displayed on TV screen.
	 * 
	 * 
	 * This interface is useful when an app doesn't want to show the broadcast
	 * itself, but let the TV natively handle playback, i.e. not in a web
	 * context. Useful to build an control interface that allows channel
	 * switching.
	 * 
	 */
	TVDisplayManager = function() {

	};

	/**
	 * Switches the channel natively on the TV (same as when a hardware remote
	 * control would be used).
	 * 
	 */
	TVDisplayManager.prototype.setChannel = function(channel, successCallback,
			errorCallback) {
		var i;
		// return the set channel immediatelly
		successCallback(channel);
		// send the channel change information to all registered handlers
		for (i = 0; channelChangeHandlers.length > i; i++) {
			channelChangeHandlers[i](channel);
		}
	};

	/**
	 * Callback function when current channel changed successfully.
	 * 
	 */
	TVDisplaySuccessCB = function() {

	};
	TVDisplaySuccessCB.prototype.onSuccess = function(channel) {

		return;
	};

	/**
	 * Get a list of all available TV tuners.
	 * 
	 */
	TVTunerManager = function() {

	};

	/**
	 * Get a list of all available TV tuners.
	 * 
	 */
	TVTunerManager.prototype.getTVSources = function(successCallback,
			errorCallback) {

		var readChannels, tvTuners=[], channelList= [];

		try{
			readChannels = require(MOCK_CHANNELS_FILE);
		}catch(e){		
console.log(MOCK_CHANNELS_FILE+' '+readChannels);process.exit();
			if (typeof errorCallback === 'function') {
				errorCallback();
			}
			return;
		}


		if(readChannels && readChannels.sourceName && readChannels.channelList){
			for(var i=0; i<readChannels.channelList.length; i++){
				channelList.push(new Channel(
									0,
									readChannels.channelList[i].channelName,
									'Long name of '+readChannels.channelList[i].channelName,
									readChannels.channelList[i].channelURL,
									new TVSource(readChannels.sourceName)));
			}
			if(channelList.length){
				tvTuners.push({name:readChannels.sourceName,channelList:channelList});
			}
		}

		if (typeof successCallback === 'function') {
			successCallback(tvTuners);
			return;
		}

		if (typeof errorCallback === 'function') {
			errorCallback();
		}
	};

	/**
	 * Callback for found TV tuners.
	 * 
	 */
	TVSuccessCB = function() {

	};

	/**
	 * Callback that is called with the found TV sources.
	 * 
	 */
	TVSuccessCB.prototype.onSuccess = function(sources) {

		return;
	};

	/**
	 * Error callback for errors when trying to get TV tuners.
	 * 
	 */
	TVErrorCB = function() {

	};

	/**
	 * Callback that is called when an error occures while getting TV sources
	 * 
	 */
	TVErrorCB.prototype.onError = function(error) {

		return;
	};

	/**
	 * Error codes.
	 * 
	 */
	TVError = function() {

		this.code = Number;
	};

	/**
	 * An unknown error.
	 * 
	 */
	TVError.prototype.UNKNOWN_ERROR = 0;

	/**
	 * Invalid input channel.
	 * 
	 */
	TVError.prototype.ILLEGAL_CHANNEL_ERROR = 1;

	/**
	 * Code.
	 * 
	 */
	TVError.prototype.code = Number;

	/**
	 * TV source: a list of channels with a name.
	 * 
	 */
	TVSource = function(tvsourcename) {

		this.name = tvsourcename;
		// TODO: get the real channel list from device
		this.channelList = [];
	};

	/**
	 * The name of the source.
	 * 
	 * 
	 * The name should describe the kind of tuner this source represents, e.g.
	 * DVB-T, DVB-C.
	 * 
	 */
	TVSource.prototype.name = String;

	/**
	 * List of channels for this source.
	 * 
	 */
	TVSource.prototype.channelList = Number;

	/**
	 * The Channel Interface
	 * 
	 * 
	 * Channel objects provide access to the video stream.
	 * 
	 */
	Channel = function(channelType, name, longName, stream, tvsource) {

		if (typeof channelType === 'number') {
			this.channelType = channelType;
		}

		if (typeof name === 'string') {
			this.name = name;
		}

		if (typeof longName === 'string') {
			this.longName = longName;
		}

		this.stream = stream;

		this.tvsource = tvsource;
	};

	/**
	 * Indicates a TV channel.
	 * 
	 */
	Channel.prototype.TYPE_TV = 0;

	/**
	 * Indicates a radio channel.
	 * 
	 */
	Channel.prototype.TYPE_RADIO = 1;

	/**
	 * The type of channel.
	 * 
	 * 
	 * Type of channel is defined by one of the TYPE_* constants defined above.
	 * 
	 */
	Channel.prototype.channelType = Number;

	/**
	 * The name of the channel.
	 * 
	 * 
	 * The name of the channel will typically be the call sign of the station.
	 * 
	 */
	Channel.prototype.name = String;

	/**
	 * The long name of the channel.
	 * 
	 * 
	 * The long name of the channel if transmitted. Can be undefined if not
	 * available.
	 * 
	 */
	Channel.prototype.longName = String;

	/**
	 * The video stream.
	 * 
	 * 
	 * This stream is a represents a valid source for a HTMLVideoElement.
	 * 
	 */
	Channel.prototype.stream = null;

	/**
	 * The source this channels belongs too.
	 * 
	 */
	Channel.prototype.tvsource = null;

	/**
	 * Event that fires when the channel is changed.
	 * 
	 * 
	 * Changing channels could also be invoked by other parties, e.g. a hardware
	 * remote control. A ChannelChange event will be fire in these cases which
	 * provides the channel that was switched to.
	 * 
	 */
	ChannelChangeEvent = function() {

		this.channel = new Channel();
	};

	/**
	 * The new channel.
	 * 
	 */
	ChannelChangeEvent.prototype.channel = null;

	/**
	 * Initializes a new channel change event.
	 * 
	 */
	ChannelChangeEvent.prototype.initChannelChangeEvent = function(type,
			bubbles, cancelable, channel) {

		return;
	};

	/**
	 * Adding a handler for the channel change event.
	 * 
	 */
	// TODO: does not conform API Spec, but needs to be added!
	TVDisplayManager.prototype.addEventListener = function(eventname,
			channelchangeeventhandler, useCapture) {
		if (eventname === 'channelchange'
				&& typeof channelchangeeventhandler === 'function') {
			channelChangeHandlers.push(channelchangeeventhandler);
		}
		return;
	};

	/**
	 * Access to tuner and display managers.
	 * 
	 */
	TVManager = function() {

		this.display = new TVDisplayManager();
		this.tuner = new TVTunerManager();
	};

	exports.tv = new WebinosTV();
}());
