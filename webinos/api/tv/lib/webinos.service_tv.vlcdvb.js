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

// Implementation of the tv module API for linux machines capable of receiving DVB streams ( http://linuxtv.org/ ) and having vlc 2.0 installed

// Location of the channel configuration file
// this can be configured by passing the absolute path to a channels.conf file
// into the params object configuring the tv module added to the pzp, e.g.:
//   {name: "tv", params: {impl:"vlcdvb", path:"/path/to/channels.conf"}}
var CHANNELS_CONF_FILE = __dirname + '/../tools/berlin-dvbt-channels.conf';

// port for dvb streams
var VLC_STREAM_PORT = 8888;

// vlc http interface host
var VLC_HOST = "localhost";

// playback url for transcoded dvb stream
var VLC_STREAM_URL = 'http://'+VLC_HOST+':' + VLC_STREAM_PORT + '/tv.ogg';

// bitrate for transcoding
var VLC_TRANSCODE_BITRATE = '4000'; //kbps

// vlc http interface port
var VLC_HTTP_PORT = 8020;

// vlc http interface playlist offset, playlist items start at 5
var VLC_PLAYLIST_OFFSET = 4;

// command line to invoke vlc in transcoding and streaming mode
var VLC_COMMANDLINE = 'cvlc ' + CHANNELS_CONF_FILE + ' --sout "#transcode{vcodec=theo,vb='+VLC_TRANSCODE_BITRATE+',scale=1,acodec=vorb,ab=128,channels=2,samplerate=44100}:http{dst=:' + VLC_STREAM_PORT + '/tv.ogg}" --sout-keep -I http --http-port ' + VLC_HTTP_PORT;

(function() {

	var fs = require('fs');
	var http = require('http');
	var client;
	var util = require('util'),
		exec = require('child_process').exec,
		child;

	/**
	 * Determine local PZP network IF
	 */
	var os=require('os');
	var ifaces=os.networkInterfaces();
	for (var dev in ifaces) {
	  ifaces[dev].forEach(function(details){
	    if (details.family=='IPv4') {
	      VLC_HOST=details.address;
	    }
	  });
	}


	
	/**
	 * Set the configuration parameters for the transcoder.
	 */
	exports.tv_setConf = function(params) {

		VLC_STREAM_PORT=params.streamPort?params.streamPort:VLC_STREAM_PORT;
		VLC_HTTP_PORT=params.rcHttpPort?params.rcHttpPort:VLC_HTTP_PORT;
		VLC_HOST=(params.config&&params.config.pzpHost)?params.config.pzpHost:VLC_HOST;
		VLC_TRANSCODE_BITRATE=params.bitrate?params.bitrate:VLC_TRANSCODE_BITRATE;
		VLC_STREAM_URL = 'http://'+VLC_HOST+':' + VLC_STREAM_PORT + '/tv.ogg';
		
		if(params.path){
			CHANNELS_CONF_FILE = params.path;
		}
		VLC_COMMANDLINE = 'cvlc ' + CHANNELS_CONF_FILE + ' --sout "#transcode{vcodec=theo,vb='+VLC_TRANSCODE_BITRATE+',scale=1,acodec=vorb,ab=128,channels=2,samplerate=44100}:http{dst=:' + VLC_STREAM_PORT + '/tv.ogg}" --sout-keep -I http --http-port ' + VLC_HTTP_PORT;



	};

	var WebinosTV, TVManager, TVDisplayManager, TVDisplaySuccessCB, TVTunerManager, TVSuccessCB, TVErrorCB, TVError, TVSource, Channel, ChannelChangeEvent;

	var channelChangeHandlers = [];

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
		
		var requestChannel,
			tries = 5;

		if (channel && channel.stream) {
			var chkChan = channel.stream.split('#');

			if (chkChan.length !== 2) {
				console.log('#TV: could not extract stream, setChannel fail: ', channel.stream);
				return;
			}

			var streamUri = chkChan[1];
			var uriSplitted = streamUri.split('://');

			if (uriSplitted.length === 2 && uriSplitted[0] === 'dvb') {
				var playlistId = parseInt(uriSplitted[1]) + VLC_PLAYLIST_OFFSET;
				console.log('#TV: sending out: goto ' + playlistId);
				requestChannel(playlistId);
			}
		}
		
		function requestChannel(playlistId) {
			var options = {
					host: '127.0.0.1', //local connection only!
					port: VLC_HTTP_PORT,
					path: '/requests/status.json?command=pl_play&id=' + playlistId
			};

			http.get(options, function(res) {
				console.log('channel change successfully requested.');

				// fix, wait until dvb hardware is ready for stream out
				setTimeout(function(){
				successCallback(channel);

				// send the channel change information to all registered handlers
				for (var i = 0; channelChangeHandlers.length > i; i++) {
					channelChangeHandlers[i](channel);
				}
				},3500);

			}).on('error', function(err) {
				if (err.code === 'ECONNREFUSED' && tries > 0) {
					console.log('got error, requesting channel change again. ');
					tries -= 1;
					setTimeout(function() {
						requestChannel(playlistId);
					}, 2500);
					return;
				}
				if (typeof errorCallback === 'function') {
					errorCallback(err);
				}
				console.log('got error, channel change failed.');
			});
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

		exec('killall vlc');

		child = exec(VLC_COMMANDLINE,
				function (error, stdout, stderr) {
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if (error !== null) {
				console.log('exec error: ' + error);
			}
		});

		fs.readFile(CHANNELS_CONF_FILE, 'utf8', function(err,data){
			if (err) {
				if (typeof errorCallback === 'function') {
					errorCallback();
				}				
				return;
			}

			var dvbtTuners = [{
				name : "DVB-T",
				channelList : [ ] }];
			var chans = data.split('\n');
			for (var cix=0; cix<chans.length; cix++) {
				if (chans[cix]) {
					var onechan = chans[cix].split(':')[0];
					if (onechan) {
						dvbtTuners[0].channelList.push(new Channel(
								0,
								onechan,
								'Long name of '+onechan,
								VLC_STREAM_URL + '#dvb://'+(cix+1),
								new TVSource('DVB-T')));
					}				
				}			
			}

			successCallback(dvbtTuners);
		});
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
