/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
var request = require('request');
var Client = require('node-rest-client').Client;
var Localize = require('localize');
var moment = require('moment');

var myLocalize = new Localize({
    'There is no direct flight found for the specified dates. Please try again with other dates.': {
        'nl': 'Er zijn helaas geen directe vluchten gevonden voor de opgegeven data. Probeer het aub nogmaals met andere data.'
    },
    'We\'ve found a flight for you for ': {
        'nl': 'We hebben een vlucht gevonden voor '
    },
    'Outbound flight: ': {
        'nl': 'Uitgaand: '
    },
    'Inbound flight: ': {
        'nl': 'Inkomend: '
    },
    'Operated by: ': {
        'nl': 'Operator: '
    },
    ' on ': {
        'nl': ' op '
    },
    'This service is powered by IBM Watson and Skyscanner.': {
        'nl': 'Deze service is powered by IBM Watson en Skyscanner.'
    },
    'Go to http://skyscanner.net to actually book this flight.': {
        'nl': 'Ga naar http://skyscanner.net voor het boeken van deze vlucht.'
    },
    'Can I help you with anything else?': {
        'nl': 'Kan je nog ergens anders mee helpen?'
    },
    'today': {'nl': 'vandaag'},
    'tomorrow': {'nl': 'morgen'}
});

myLocalize.setLocale(process.env.WATSON_CONVERSATION_LANG);

var SKYSCANNER_API_KEY = process.env.SKYSCANNER_API_KEY;
var SKYSCANNER_URL = 'http://partners.api.skyscanner.net/apiservices/pricing/v1.0';
var SKYSCANNER_COUNTRY = process.env.SKYSCANNER_COUNTRY;
var SKYSCANNER_CURRENCY = process.env.SKYSCANNER_CURRENCY;
var SKYSCANNER_LOCALE = process.env.SKYSCANNER_LOCALE;
var SKYSCANNER_SCHEMA = process.env.SKYSCANNER_SCHEMA;

module.exports = {
  /**
   * Returns the Geo location based on a city name
   * @param  {array}   An array containing the 4 parameters: destination, origin, outbounddate and inbounddate
   * @param  {Function} callback The callback
   * @return {void}
   */
  getFlightDetails: function(params, callback) {
    if (Object.keys(params).length != 6) {
      callback('The skyscanner API call needs 6 input parameters: destination, origin, outbounddate, inbounddate, today and tomorrow.');
    }

    console.log('Parameters received: ' + JSON.stringify(params));

    // Prepare date fields
    var poll_url = '';
    var year = (new Date()).getFullYear();

    //Change to language
    moment.locale(process.env.WATSON_CONVERSATION_LANG);

    var outboundDate;

    console.log('myLocalize call: ' + myLocalize.translate('today').toString());
    console.log('params outbounddate: ' + params.outbounddate.toString());

    if (params.outbounddate == myLocalize.translate('today')) {
      outboundDate = moment(params.today + year,"DD MMM YYYY");
    } else if (params.outbounddate == myLocalize.translate('tomorrow')) {
      outboundDate = moment(params.tomorrow + year,"DD MMM YYYY");
    } else {
      outboundDate = moment(params.outbounddate + year,"DD MMM YYYY");
    }

    var outBoundMonth = new String(outboundDate.month() + 1).length < 2 ? '0'.concat((outboundDate.month() + 1)) : (outboundDate.month() + 1);
    var outBoundDay = new String(outboundDate.date()).length < 2 ? '0'.concat(outboundDate.date()) : outboundDate.date();

    console.log('outbounddate: ' + year + '-' + outBoundMonth + '-' + outBoundDay);

    var inboundDate;

    if (params.inbounddate == myLocalize.translate('today')) {
      inboundDate = moment(params.today + year,"DD MMM YYYY");
    } else if (params.inbounddate == myLocalize.translate('tomorrow')) {
      inboundDate = moment(params.tomorrow + year,"DD MMM YYYY");
    } else {
      inboundDate = moment(params.inbounddate + year,"DD MMM YYYY");
    }

    var inBoundMonth = new String(inboundDate.month() + 1).length < 2 ? '0'.concat((inboundDate.month() + 1)) : (inboundDate.month() + 1);
    var inBoundDay = new String(inboundDate.date()).length < 2 ? '0'.concat(inboundDate.date()) : inboundDate.date();

    console.log('inbounddate: ' + year + '-' + inBoundMonth + '-' + inBoundDay);

    // Send the input to the skyscanner service
    request({
      url: SKYSCANNER_URL, //URL to hit
      method: 'POST',
      //Lets post the following key/values as form
      form: {
              apiKey: SKYSCANNER_API_KEY,
              country: SKYSCANNER_COUNTRY,
              currency: SKYSCANNER_CURRENCY,
              locale: SKYSCANNER_LOCALE,
              originplace: params.origin,
              destinationplace: params.destination,
              locationschema: SKYSCANNER_SCHEMA,
              outbounddate: year + '-' + outBoundMonth + '-' + outBoundDay,
              inbounddate: year + '-' + inBoundMonth + '-' + inBoundDay
            }
    }, function(err,res) {
      if (err) {
        return res.status(err.code || 500).json(err);
      }
    }).on('complete', function(resp) {
      // Setting arguments for polling skyscanner API. Looking for cheapest direct flight
      var args = {
          parameters: {
                        apiKey: SKYSCANNER_API_KEY,
                        pageindex: 0,
                        pagesize: 3,
                        sortorder: "asc",
                        sorttype: "price",
                        stops: 0
                      }
      };

      var client = new Client();
      poll_url = resp.headers.location;

      console.log('Response header Skyscanner call: ' + JSON.stringify(resp.headers));

      if (poll_url === undefined) {
        //callback(null, {text: [myLocalize.translate('There is no direct flight found for the specified dates. Please try again with other dates.')]});
        callback({text: [myLocalize.translate('There is no direct flight found for the specified dates. Please try again with other dates.')]});
      } else {
        var inProgress = true;
        var i = 0, howManyTimes = 80;

        function pollSkyscanner() {
          if (inProgress) {
            console.log( 'Polling skyscanner API using session url..');
            client.get(poll_url, args, function(data, response) {
              console.log('polling...');

              if (response.statusCode == '200' && data.Status != 'undefined') {
                console.log('status: ' + data.Status);
              }

              if (data.Status == 'UpdatesComplete') {
                console.log('poll_url: ' + poll_url);

                inProgress = false;
                if (data.Itineraries[0] === undefined) {
                  callback({text: [myLocalize.translate('There is no direct flight found for the specified dates. Please try again with other dates.')]});
                } else {
                  var price = data.Itineraries[0].PricingOptions[0].Price;

                  // Initialize variables for outbound flight
                  var outboundCarrierId = '';
                  var outboundOperatorCarrierId = '';
                  var outboundOperatorCarrierName = '';
                  var outboundCarrierName = '';
                  var outboundCarrierCode = '';
                  var outboundFlightNumber = '';
                  var outboundDepature = '';
                  var outboundArrival = '';
                  var outboundLegId = data.Itineraries[0].OutboundLegId;

                  // Initialize variables for inbound flight
                  var inboundCarrierId = '';
                  var inboundOperatorCarrierId = '';
                  var inboundOperatorCarrierName = '';
                  var inboundCarrierName = '';
                  var inboundCarrierCode = '';
                  var inboundFlightNumber = '';
                  var inboundDepature = '';
                  var inboundArrival = '';
                  var inboundLegId = data.Itineraries[0].InboundLegId;
                  var inboundDate = '';

                  for (var i=0, l=data.Legs.length; i < l; i++) {
                    if (data.Legs[i].Id === outboundLegId) {
                      outboundDepature = data.Legs[i].Departure;
                      outboundArrival = data.Legs[i].Arrival;
                      outboundCarrierId = data.Legs[i].FlightNumbers[0].CarrierId;
                      outboundOperatorCarrierId = data.Legs[i].OperatingCarriers[0];
                      outboundFlightNumber = data.Legs[i].FlightNumbers[0].FlightNumber;
                    } else if (data.Legs[i].Id === inboundLegId) {
                      inboundDepature = data.Legs[i].Departure;
                      inboundArrival = data.Legs[i].Arrival;
                      inboundCarrierId = data.Legs[i].FlightNumbers[0].CarrierId;
                      inboundOperatorCarrierId = data.Legs[i].OperatingCarriers[0];
                      inboundFlightNumber = data.Legs[i].FlightNumbers[0].FlightNumber;
                    }
                  }

                  for (var i=0, l=data.Carriers.length; i < l; i++) {
                    if (data.Carriers[i].Id === outboundCarrierId) {
                      outboundCarrierName = data.Carriers[i].Name;
                      outboundCarrierCode = data.Carriers[i].Code;
                    }

                    if (data.Carriers[i].Id === outboundOperatorCarrierId) {
                      outboundOperatorCarrierName = data.Carriers[i].Name;
                    }

                    if (data.Carriers[i].Id === inboundCarrierId) {
                      inboundCarrierName = data.Carriers[i].Name;
                      inboundCarrierCode = data.Carriers[i].Code;
                    }

                    if (data.Carriers[i].Id === inboundOperatorCarrierId) {
                      inboundOperatorCarrierName = data.Carriers[i].Name;
                    }
                  }

                  callback({text: [myLocalize.translate('We\'ve found a flight for you for ') + '€' + Math.round(price) + '. :-) <pause wait=\'2000\'/>' +
                                   myLocalize.translate('Outbound flight: ') + outboundCarrierCode + outboundFlightNumber + myLocalize.translate(' on ') + outboundDepature.substring(0,10) + ', ' + params.origin + ' ' + outboundDepature.substring(11,16) + ' -> ' + params.destination + ' ' + outboundArrival.substring(11,16) + '  (' + outboundOperatorCarrierName + ')<pause wait=\'3000\'/>' +
                                   myLocalize.translate('Inbound flight: ') + inboundCarrierCode + inboundFlightNumber + myLocalize.translate(' on ') + inboundDepature.substring(0,10) + ', ' + params.destination + ' ' + inboundDepature.substring(11,16) + ' -> '+ params.origin + ' ' + inboundArrival.substring(11,16) + '  (' + inboundOperatorCarrierName + ')<pause wait=\'3000\'/>' +
                                   myLocalize.translate('This service is powered by IBM Watson and Skyscanner.') + '<pause wait=\'2000\'/>' +
                                   myLocalize.translate('Go to http://skyscanner.net to actually book this flight.') + '<pause/>' +
                                   myLocalize.translate('Can I help you with anything else?')
                  ]});
                }
              }
            })
          } else {
            i = howManyTimes; // Stop polling skyscanner, updates are complete
          }

          i++;

          if( i < howManyTimes ){
            setTimeout( pollSkyscanner, 2000 );
          }
        }
        pollSkyscanner();
      }
    })
  }
}
