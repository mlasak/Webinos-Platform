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

/*
  Arduino Web Server and Client - Katwarn - M2M
 */

#include <SPI.h>
#include <Ethernet.h>


/******************************************* CONFIG ******************
* change/add to fit your network conditions!
*/

//
// Server
//

/*our first arduino board, used for SmartEnergyMonitor initially*/
byte mac[] = {0x90, 0xA2, 0xDA, 0x0D, 0x66, 0xC2};
/*our second board, Arduino Uno with Ethernet Shield*/
//byte mac[] = {0x90, 0xA2, 0xDA, 0x0D, 0x51, 0x3B };

/*Arduino Board IP and port*/
IPAddress ip(192,168,1, 99);
EthernetServer server(80);

//
// Client (Arduino is client and pushes sensor vaules to remote service at...)
//

/*SmartEnergyApp machine IP and port*/
IPAddress pushToServer(192,168,1,100); 
int pushToServerPort = 3008;

/*Post inverval*/
const unsigned long postingInterval = 60*1000; //post sensor data once each 60 seconds. Notice: if changes occur more frequent, then they will be pushed anyway
/******************************************* CONFIG *****************/

EthernetClient client;

/******************************************* TinkerKit Stuff ********/
#define I0 A0
#define I1 A1
#define I2 A2
#define I3 A3
#define I4 A4
#define I5 A5
#define O0 11
#define O1 10
#define O2 9
#define O3 6
#define O4 5
#define O5 3
#define I6 A6
#define I7 A7
#define I8 A8
#define I9 A9
#define D13 13
#define D12 12
#define D8 8
#define D7 7
#define D4 4
#define D2 2

/*
 * Thermistor Class and Methods
 */
 
class TKThermistor 
{
	public:
		TKThermistor(uint8_t pin);
		inline int get() { return analogRead(_pin); }
		float getCelsius();
		float getFahrenheit();
		
	protected:
		uint8_t _pin;
		const static float ADCres = 1023.0;
		const static int Beta = 3950;			// Beta parameter
		const static float Kelvin = 273.15;	// 0°C = 273.15 K
		const static int Rb = 10000;			// 10 kOhm
		const static float Ginf = 120.6685;	// Ginf = 1/Rinf
														// Rinf = R0*e^(-Beta/T0) = 4700*e^(-3950/298.15)
};	

/*
 * LightSensor Class and Methods
 */

class TKLightSensor
{
	public:
		TKLightSensor(uint8_t pin);
		inline int get() { return analogRead(_pin); }
		
	protected:
		uint8_t _pin;
};

/******************************************* TinkerKit Stuff ********/

int led_orange = O2;
int led_red = O3;
int led_purple = O4;
int led_green = O5;

TKThermistor therm(I1); 
TKLightSensor light(I2);
float tempc, tempcold;
int lightvalue, lightvalueold;

int switchalert=0;

char c;
String s;
String acceptedQueryPrefix = "GET /?";

unsigned long lastConnectionTime = 0;        



void setup() {
  tempcold=0;
  lightvalueold=0;
  
 // Open serial communications and wait for port to open:
  Serial.begin(115200);
   while (!Serial) {
    ; // wait for serial port to connect. Needed for Leonardo only
  }

  // start the Ethernet connection and the server:
  Ethernet.begin(mac, ip);
  server.begin();
  Serial.print("server is at ");
  Serial.println(Ethernet.localIP());
  
  pinMode(led_orange, OUTPUT); 
    pinMode(led_red, OUTPUT);
      pinMode(led_purple, OUTPUT);
      pinMode(led_green, OUTPUT);
 
      
}


void loop() {
  // listen for incoming clients
  client = server.available();
  if (client) {
    Serial.println("new client");
    s = "";
    // an http request ends with a blank line
    boolean currentLineIsBlank = true;
    while (client.connected()) {
      if (client.available()) {
        c = client.read();
        s += c;
        Serial.write(c);
        // if you've gotten to the end of the line (received a newline
        // character) and the line is blank, the http request has ended,
        // so you can send a reply
        if (c == '\n' && currentLineIsBlank) {


          
          //parse the request header
          if(s.startsWith(acceptedQueryPrefix)){
            
            
            s = s.substring(6);//cut the "GET /?" part
            
                       
              // send a standard http response header
              client.println("HTTP/1.1 200 OK");
              client.println("Content-Type: application/json");
              client.println("Connnection: close");
              client.println();   
              client.print("{\"result\":[");
            
            if(s.startsWith("a=")){
              s = s.substring(2);
              
              s = s.substring(0, s.indexOf(' '));
              
              int actuatorIndex =0;
              while(true){
                
                int bis = s.indexOf(',');
                
                String value;
                if(bis==-1 ){
                  value=s;
                }else{
                  value = s.substring(0,bis);
                  s = s.substring(bis+1);
                }
                
                
                
                client.print(value[0]); 
                client.print(","); 
                
                switch(actuatorIndex){
                  case 0:
                  
                   if(value[0]=='1'){
                     digitalWrite(led_green, HIGH); 
                   }else{
                    digitalWrite(led_green, LOW); 
                   }
                  break;
                  case 1:
             
                   if(value[0]=='1'){
                     digitalWrite(led_orange, HIGH); 
                   }else{
                     digitalWrite(led_orange, LOW); 
                   }         
                  break;
                  case 2:
            
                   if(value[0]=='1'){
                     digitalWrite(led_red, HIGH); 
                   }else{
                     digitalWrite(led_red, LOW); 
                   }         
                  break;
                  case 3:
                
                   if(value[0]=='1'){
                     digitalWrite(led_purple, HIGH); 
                   }else{
                     digitalWrite(led_purple, LOW); 
                   }         
                  break;
            
                        
                }
                
                actuatorIndex++;
                
                if(bis==-1 ){
                  break;
                }
              
              }

              client.print("0]}"); 
            }
            else {
              if (s.startsWith("s=")){          
              //TODO: Sensor
              }
              else {
              client.println("HTTP/1.1 404 Not found");
              client.println("Content-Type: application/json");
              client.println("Connnection: close");  
              client.println(); 
              client.println("{}");           
            
            }}

          /*
          switch(switchalert){
            case 0:
              digitalWrite(led_orange, HIGH);   
              digitalWrite(led_purple, LOW);
              switchalert=1;
              client.println("orange");
            break;
            case 1:
              digitalWrite(led_red, HIGH);   
              digitalWrite(led_orange, LOW);
              switchalert=2;
              client.println("red");
            break;
            case 2:
               digitalWrite(led_purple, HIGH);   
              digitalWrite(led_red, LOW);
              switchalert=0;
              client.println("purple");
            break;
            default:
            switchalert=0;
          }
          */
          
            s = "";
          }else{
            client.println("HTTP/1.1 405 Method not allowed");
            client.println("Content-Type: application/json");
            client.println("Connnection: close");  
            client.println(); 
            client.println("{}");         
          }
          
          break;
        }
        if (c == '\n') {
          // you're starting a new line
          currentLineIsBlank = true;
        } 
        else if (c != '\r') {
          // you've gotten a character on the current line
          currentLineIsBlank = false;
        }
      }
    }
    // give the web browser time to receive the data
    delay(1);
    // close the connection:
    client.stop();
    Serial.println("client disonnected");
  }
  
    // if you're not connected, and ten seconds have passed since
    // your last connection, then connect again and send data:
    tempc = therm.getCelsius();
    lightvalue = light.get()*0.09765625;
    
    if(!client.connected() && ((millis() - lastConnectionTime > postingInterval) || tempc < tempcold-0.2 || tempc > tempcold+0.2 || lightvalue <  lightvalueold-2 || lightvalue > lightvalueold+2 )) {
 
      httpRequest();
    }
}


// this method makes a HTTP connection to the server:
void httpRequest() {
  // if there's a successful connection:
  
  if(tempc < tempcold-0.2 || tempc > tempcold+0.2){
    if (client.connect(pushToServer,pushToServerPort)) {
      Serial.println("connecting and pushing temperature...");
      // send the HTTP PUT request:
      client.print("GET /rest/notify/sensors/");
      client.print("2C302300");
      client.print("?value=");
      
      client.print(tempc);
      client.print("&token=");
      client.print("VnXY3UWJ");
      client.println(" HTTP/1.1");
      client.println("Host: www.arduino.cc");
      client.println("User-Agent: arduino-ethernet");
      client.println("Connection: close");
      client.println();
  
      // note the time that the connection was made:
      lastConnectionTime = millis();
      
    } 
    else {
      // if you couldn't make a connection:
      Serial.println("connection failed");
      Serial.println("disconnecting.");
      client.stop();
    }
    tempcold = tempc;
  }
    
  if(lightvalue <  lightvalueold-2 || lightvalue > lightvalueold+2 ){
    if (client.connect(pushToServer,pushToServerPort)) {
      Serial.println("connecting and pushing light...");
      // send the HTTP PUT request:
      client.print("GET /rest/notify/sensors/");
      client.print("2C302320");
      client.print("?value=");
      
      client.print(lightvalue);
      client.print("&token=");
      client.print("VnXY3UWJ");
      client.println(" HTTP/1.1");
      client.println("Host: www.arduino.cc");
      client.println("User-Agent: arduino-ethernet");
      client.println("Connection: close");
      client.println();
  
      // note the time that the connection was made:
      lastConnectionTime = millis();
      
    } 
    else {
      // if you couldn't make a connection:
      Serial.println("connection failed");
      Serial.println("disconnecting.");
      client.stop();
    }  
  
    lightvalueold = lightvalue;  
    
  }
}







//TinkerKit
/*
 * Thermistor Class and Methods
 */
  
TKThermistor::TKThermistor(uint8_t pin) { _pin = pin; }

float TKThermistor::getCelsius()
{
	float Rthermistor = Rb * (ADCres / TKThermistor::get() - 1);
	float _temperatureC = Beta / (log( Rthermistor * Ginf )) ;
		
	return _temperatureC - Kelvin;
}

float TKThermistor::getFahrenheit()
{
	float _temperatureF = (TKThermistor::getCelsius() * 9.0)/ 5.0 + 32.0; ;
	
	return _temperatureF;
}

/*
 * LightSensor Class and Methods
 */

TKLightSensor::TKLightSensor(uint8_t pin) { _pin = pin; }

