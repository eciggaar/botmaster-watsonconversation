
const Botmaster = require('botmaster');
const watsonConversationStorageMiddleware = require('./watson_conversation_storage_middleware');
const watson = require('watson-developer-cloud');
const cfenv = require('cfenv');
const dotenv = require('dotenv');
const moment = require('moment');
const request = require('request-promise');

const appEnv = cfenv.getAppEnv();

// Load environment variables from local .env when running locally. Otherwise use values from Bluemix
// environment variables
if (appEnv.isLocal) {
  dotenv.load();
}

const skyscanner = require('./lib/api/skyscanner.js');

// Set today and tomorrow's date in active language
moment.locale(process.env.CONVERSATION_LANG);
const today = moment();
const tomorrow = moment(today).add(1, 'day');

const watsonConversation = watson.conversation({
  username: process.env.WATSON_CONVERSATION_USERNAME,
  password: process.env.WATSON_CONVERSATION_PASSWORD,
  version: 'v1',
  version_date: '2016-05-19',
});

const messengerSettings = {
  credentials: {
    verifyToken: process.env.FACEBOOK_VERIFY_TOKEN,
    pageToken: process.env.FACEBOOK_PAGE_TOKEN,
    fbAppSecret: process.env.FACEBOOK_APP_SECRET,
  },
  // !! see Readme if you have any issues with understanding webhooks
  webhookEndpoint: '/webhook',
};

messengerBot = new Botmaster.botTypes.MessengerBot(messengerSettings);

const slackSettings = {
  credentials: {
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    verificationToken: process.env.SLACK_VERIFY_TOKEN
  },
  webhookEndpoint: '/webhook-slack',
  storeTeamInfoInFile: true,
};

const slackBot  = new Botmaster.botTypes.SlackBot(slackSettings);
const botmaster = new Botmaster();

botmaster.addBot(slackBot);
botmaster.addBot(messengerBot);

botmaster.use('incoming', watsonConversationStorageMiddleware.retrieveSession);

botmaster.on('update', (bot, update) => {
  console.log(update);

  //In case bot type is Facebook, populate context with facebook user_profile info
  if (bot.type === 'messenger') {
    if (!update.session.context) {
      const requestOptions = {
        url: 'https://graph.facebook.com/v2.6/' + update.sender.id + '?access_token=' + process.env.FACEBOOK_PAGE_TOKEN,
        json: true,
      }

      request(requestOptions)
      .promise()
      .bind(this)
      .then((body) => {
        update.session.context = {};
        update.session.context.system = {
          dialog_stack: ['root'],
          dialog_turn_counter: 1,
          dialog_request_counter: 1
        };

        update.session.context.firstname = body.first_name;
        update.session.context.today = today.format('D') + ' ' + today.format('MMMM');
        update.session.context.tomorrow = tomorrow.format('D') + ' ' + tomorrow.format('MMMM');

        callWatson(bot, update);
      })
      .catch((err) => {
        console.log(err);
      })

    } else {

      callWatson(bot, update);
    }
  } else {

    callWatson(bot, update);
  }
});

botmaster.on('server running', (message) => {
  console.log(message);
});

botmaster.on('error', (bot, err) => {
  console.log(err.stack);
});

function callWatson(bot, update) {
  const messageForWatson = {
    context: update.session.context,
    workspace_id: process.env.WATSON_WORKSPACE_ID,
    input: {
      text: update.message.text,
    }
  };

  watsonConversation.message(messageForWatson, (err, watsonUpdate) => {
    watsonConversationStorageMiddleware.updateSession(update.sender.id, watsonUpdate);

    const watsontext = watsonUpdate.output.text;
    bot.sendTextCascadeTo(watsontext,update.sender.id)

    if (watsonUpdate.context.action === 'show_buttons') {

      console.log('inside show_buttons....TEXT: ' + JSON.stringify(watsonUpdate.output.text));
      console.log('inside show_buttons....BUTTONS: ' + watsonUpdate.context.action);
      const buttonArray = ['Ja', 'Nee'];
      //bot.sendDefaultButtonMessageTo(buttonArray, update.sender.id, 'Selecteer');
      delete watsonUpdate.context.action; //remove the trigger from the context;

    }

    if (watsonUpdate.context.action === "call_skyscanner") {
      const params = { "outbounddate": watsonUpdate.context.outDate,
                       "inbounddate": watsonUpdate.context.returnDate,
                       "origin": watsonUpdate.context.origin,
                       "destination": watsonUpdate.context.destination,
                       "today": watsonUpdate.context.today,
                       "tomorrow": watsonUpdate.context.tomorrow,
                     };

      skyscanner.getFlightDetails(params, function(response) {
        const watsontext = response.text;
        delete watsonUpdate.context.action; //remove the trigger from the context
        bot.sendTextCascadeTo(watsontext,update.sender.id);
      });
    }
  });
}
