
const Botmaster = require('botmaster');
const watson = require('watson-developer-cloud');
const cfenv = require('cfenv');
const dotenv = require('dotenv');
const request = require('request-promise');
const incomingMiddleware = require('./middleware/incoming');

const appEnv = cfenv.getAppEnv();

// Load environment variables from local .env when running locally. Otherwise use values from Bluemix
// environment variables
if (appEnv.isLocal) {
  dotenv.load();
}

const watsonConversationStorageMiddleware = require('./middleware/watson_conversation_storage');
const skyscanner = require('./lib/api/skyscanner.js');

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

const botmasterSettings = {
  port: appEnv.isLocal ? 3000 : appEnv.port,
};

const slackBot  = new Botmaster.botTypes.SlackBot(slackSettings);
const botmaster = new Botmaster(botmasterSettings);

botmaster.addBot(slackBot);
botmaster.addBot(messengerBot);

botmaster.use('incoming', watsonConversationStorageMiddleware.retrieveSession);
botmaster.use('incoming', { type: 'messenger' }, incomingMiddleware.userInfo.addUserInfoToUpdate);

botmaster.on('update', (bot, update) => {
  console.log(update);

  const messageForWatson = {
    context: update.session.context,
    workspace_id: process.env.WATSON_WORKSPACE_ID,
    input: {
      text: update.message.text,
    }
  };

  watsonConversation.message(messageForWatson, (err, watsonUpdate) => {
    watsonConversationStorageMiddleware.updateSession(update.sender.id, watsonUpdate);

    if (watsonUpdate.context.action === 'show_buttons') {
      const watsontext = watsonUpdate.output.text;
      const lastEntry = watsontext.pop();

      if (watsontext.length > 0) {
        bot.sendTextCascadeTo(watsontext,update.sender.id);
      }

      setTimeout(function () {
        const buttonArray = ['Ja', 'Nee'];
        bot.sendDefaultButtonMessageTo(buttonArray, update.sender.id, lastEntry);
        delete watsonUpdate.context.action; //remove the trigger from the context;
      }, 1000);
    } else {
      const watsontext = watsonUpdate.output.text;
      bot.sendTextCascadeTo(watsontext,update.sender.id);
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
});

botmaster.on('server running', (message) => {
  console.log(message);
});

botmaster.on('error', (bot, err) => {
  console.log(err.stack);
});
