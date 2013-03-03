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
 * Copyright 2011 Alexander Futasz, Fraunhofer FOKUS
 ******************************************************************************/
(function () {
    if (typeof webinos === "undefined") webinos = {};
    var channel = null;

    /**
     * Creates the socket communication channel
     * for a locally hosted websocket server at port 8080
     * for now this channel is used for sending RPC, later the webinos
     * messaging/eventing system will be used
     */
    function createCommChannel (successCB) {
        var channel = null;
        if (typeof WebinosSocket !== 'undefined') { // Check if we are inside Android widget renderer.
            channel = new WebinosSocket ();
        } else { // We are not in Android widget renderer so we can use a browser websocket.
            var port, hostname;
            var defaultHost = "localhost";
            var defaultPort = "8080";
            var isWebServer = true;
            var useDefaultHost = false;
            var useDefaultPort = false;

            // Get web server info.

            // Get web server port.
            port = window.location.port - 0 || 80;
            // Find web server hostname.
            hostname = window.location.hostname;
            if (hostname == "") isWebServer = false; // We are inside a local file.

            // Find out the communication socket info.

            // Set the communication channel's port.
            if (isWebServer) {
                var config = fetchWebinosConfig();
                if (config) {
                    port = config.websocketPort;
                }else{ // We are not inside a pzp or widget server OR the XMLHttpRequest failed.
                    console.log("CAUTION: webinosConfig.json failed to load. Will try to detect local webinos server.");
                    var webinosFileLocation = getCurrentScriptLocation();
                    if (webinosFileLocation.origin != window.location.origin) {
                        hostname = webinosFileLocation.hostname;
                        port = webinosFileLocation.port;
                        console.log("CAUTION: The pzp communication host and port are unknown. Trying webinos.js location info (" + hostname + ":" + port + ").");
                    } else {
                        console.log("CAUTION: The pzp communication host and port are unknown. Trying the default communication channel (" + defaultHost + ":" + defaultPort + ").");
                        useDefaultHost = true;
                        useDefaultPort = true;
                    }
                }
            } else { // Let's try the default pzp hostname and port.
                console.log ("CAUTION: No web server detected. Using a local file? Trying the default communication channel (" + defaultHost + ":" + defaultPort + ").");
                useDefaultHost = true;
                useDefaultPort = true;
            }
            // Change the hostname to the default if required.
            if (useDefaultHost) hostname = defaultHost;
            // Change the port to the default if required.
            if (useDefaultPort) port = defaultPort;

            // We are ready to make the connection.

            // Get the correct websocket object.
            var ws = window.WebSocket || window.MozWebSocket;
            try {
                channel = new ws ("ws://" + hostname + ":" + port);
            } catch (err) { // Websockets are not available for this browser. We need to investigate in order to support it.
                throw new Error ("Your browser does not support websockets. Please report your browser on webinos.org.");
            }
        }
        webinos.session.setChannel (channel);
        webinos.session.setPzpPort (port);

        channel.onmessage = function (ev) {
            console.log ('WebSocket Client: Message Received : ' + JSON.stringify (ev.data));
            var data = JSON.parse (ev.data);
            if (data.type === "prop") {
                webinos.session.handleMsg (data);
            } else {
                webinos.messageHandler.setGetOwnId (webinos.session.getSessionId ());
                webinos.messageHandler.setObjectRef (this);
                webinos.messageHandler.setSendMessage (webinos.session.message_send_messaging);
                webinos.messageHandler.onMessageReceived (data, data.to);
            }
        };
        channel.onopen = function() {
          var url = window.location.pathname;
          var filename = url.substring(url.lastIndexOf('/')+1);
          webinos.session.message_send({type: 'prop', payload: {status:'registerBrowser', value: filename}});
        };
    }

    createCommChannel ();

    /**
     * Returns the webinos configuration in JSON object format or false if there was an error.
     * The default behavior is to check the current page root for the config.
     * eg.
     * - If you are accessing a demo served from the pzp server, http://localhost:8080/apps/demo/index.html,
     *   it will try to fetch http://localhost:8080/webinosConfig.js
     * @param {string} [pzpRootBaseUrl] define the full path for the pzp root
     * @return {Object|Boolean} false or JSON object of config
     */
    function fetchWebinosConfig(pzpRootBaseUrl){
        try {
            pzpRootBaseUrl = pzpRootBaseUrl || "";
            var xmlhttp = new XMLHttpRequest();
            console.log("Fetching: " + pzpRootBaseUrl + "/webinosConfig.json");
            xmlhttp.open("GET", pzpRootBaseUrl + "/webinosConfig.json", false);
            xmlhttp.send();
            if (xmlhttp.status == 200) {
                return JSON.parse(xmlhttp.responseText);
            } else {
                return false;
            }
        } catch (err) { // XMLHttpRequest is not supported or something went wrong with it.
            console.log("ERROR: XMLHttpRequest is not supported or failed by your browser.");
            return false;
        }
    }

    function getCurrentScriptLocation() {
        var retLocation = {
            hash: "",
            host: "",
            hostname: "",
            href: "",
            origin: "",
            pathname: "",
            port: "",
            protocol: "",
            search: ""
        };
        var scriptTags = document.getElementsByTagName('script');
        // We take the last script tag because it's the one we are executed in
        var path = scriptTags[scriptTags.length - 1].src;
        var parser = document.createElement('a');
        parser.href = path;
        for (var i in retLocation) {
            retLocation[i] = parser[i];
        }
        return retLocation;
    }

    webinos.rpcHandler = new RPCHandler (undefined, new Registry ());
    webinos.messageHandler = new MessageHandler (webinos.rpcHandler);
    webinos.discovery = new ServiceDiscovery (webinos.rpcHandler);
    webinos.ServiceDiscovery = webinos.discovery; // for backward compat

} ());
