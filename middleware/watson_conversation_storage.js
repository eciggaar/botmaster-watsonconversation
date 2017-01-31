'use strict';
const moment = require('moment');
const store = {};

// Set today and tomorrow's date in active language
moment.locale(process.env.WATSON_CONVERSATION_LANG);
const today = moment();
const tomorrow = moment(today).add(1, 'day');


function retrieveSession(bot, update, next) {
  // try to retrieve the session object for a certain id
  // if no session is found, set the session to an empty object
  if (store[update.sender.id]) {
    update.session = store[update.sender.id];
  } else {
    // on the first pass, this will be our session object
    update.session = {};
    // If there is no Watson conversation context in the session, create one and store today and tomorrow's date

    update.session.context = {};
    update.session.context.system = {
      dialog_stack: ['root'],
      dialog_turn_counter: 1,
      dialog_request_counter: 1
    };

    update.session.context.today = today.format('D') + ' ' + today.format('MMMM');
    update.session.context.tomorrow = tomorrow.format('D') + ' ' + tomorrow.format('MMMM');

  }
  next();
}

function updateSession(userId, session) {
  // update or store the session for the first time.
  // the update is expected to be found in the message object
  // for the platform. Because we don't need to send it over,
  // we delete it after saving the session.

  store[userId] = session;
}

module.exports = {
  retrieveSession,
  updateSession
};
