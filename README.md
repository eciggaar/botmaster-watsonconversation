# Botmaster | Messenger | Watson Conversation
<div align="center">
Powered by <img src="http://botmasterai.com/images/botmaster_light.svg" width="100">
</div>

Botmaster framework with IBM Watson Conversation dependencies to deploy Facebook messenger bot. Botmaster is a lightweight highly extendable, highly configurable chatbot framework. It was meant to be used both in small scale and large scale projects. Its purpose is to integrate your chatbot into a variety of messaging channels.
<div align="center">
<a href="https://bluemix.net/deploy?repository=https://github.com/eciggaar/botmaster-watsonconversation.git" # [required]><img src="https://bluemix.net/deploy/button.png" alt="Deploy to Bluemix"></a></div>

# Before you begin

* Create a Bluemix account
    *    [Sign up](https://bluemix.net/registration) in Bluemix, or use an existing account. Your account must have available space for at least 1 app and 1 service.
* Make sure that you have the following prerequisites installed:
    * [The Node.js runtime](https://nodejs.org/en/) (including the npm package manager)
    * [The Cloud Foundry and Bluemix](https://console.ng.bluemix.net/docs/cli/index.html#cli) command-line client

## Getting Watson Conversation Credentials

In order for Watson Conversation to integrate with Botmaster, the following credentials are required
  - Service Credentials
  - Conversation Workspace ID

### Service Credentials
---
1. Find your service within Bluemix and click to view the service details screen. Create a new Watson Conversation servivce if you don't already have one.
![Find your service] (https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/services.png?raw=true)
2. From this screen click the "Service Credentials" tab
![Get workspace ID](https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/servicecredentials.png?raw=true)
3. Copy the username and password information (we will use this later when connecting our conversation to Botmaster)

### Conversation Workspace ID
---
1. Open the conversation instance you have created.
2. In the service instance detail click "Launch Tool".
![Launch tooling](https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/launchtool.png?raw=true)
3. Once in the Conversation tooling locate your conversation workspace. If you don't have a Conversation workspace yet, this the place where you have to create one.
4. Click the menu located top right and select "View Details".
<div align="center">![Get workspace ID](https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/workspaceid.png?raw=true)</div>
5. Copy your workspace ID and make note (we will use this with service credentials to connect our Watson Conversation to Botmaster).


###Set up your Facebook page
---
In order to connect to Facebook messenger, you must first have a Facebook Developers account and page created.

[Click here to see how] (https://medium.com/@yrezgui/setup-your-first-messenger-chatbot-a28482a407d4#.k2f7xpobi)


# Getting Started with Botmaster on Bluemix

If you wish to simply deploy a Botmaster instance without having to edit any of the pre existing code or do not wish to connect any additional API or additional functionality, use the steps below.

1. In order to setup botmatser and a webhook for messenger to link to your Watson conversation we first need to deploy a Bluemix application. So go ahead and hit the button.
<div align="center">
<a href="https://bluemix.net/deploy?repository=https://github.com/eciggaar/botmaster-watsonconversation.git" # [required]><img src="https://bluemix.net/deploy/button.png" alt="Deploy to Bluemix"></a></div>

2. Log into Bluemix.
3. Give you application a unique name (this will be the URL for the base of your webhook e.g wwww.helloworld.mybluemix.net/webhook)
4. Select the space and organisation to deploy to.
![Name your application] (https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/bluemixname.png?raw=true)
5. Once complete you will be presented with this screen, now you can click edit code if you wish to add additional functionality.
![Success deployment] (https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/success.png?raw=true)
6. Once successfully deployed, go to your Bluemix app dashboard and view your app.
![Success deployment] (https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/appdetail.png?raw=true)
7. Select Runtime followed by Environment Variables.
![Success deployment] (https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/envvar.png?raw=true)
8. Populate these fields with the required information. You don't need to fill in variable values for Slack and Skyscanner if you do not plan to use these.
9. Hit save to restart your application.

### Connecting Facebook

6. Go to your Facebook Developer page for your application.
7. Under Webhooks, create "New Subscription" for pages.
![Facebook Webhook] (https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/facebookwebhook.png?raw=true)
8. In the callback URL field, paste in your app URL from Bluemix using your webhook by default this is set to /webhook (e.g myapp.bluemix.net/messenger/webhook) or in code **line 34**.
9. Enter your verify token you created in Environent Variables or in code **Line 29**.
10. Select the following fields `messages`, `messaging_postbacks`.
11. Once your webhook is set up you need to subscribe to events within messenger.
12. Go to Messenger in the Facebook Developer portal product tab.
13. Go to Settings.
14. Locate Webhooks.
15. Subscribe your event to the page you created.
![Subscribe Webhook] (https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/messengerevent.png?raw=true)

# Getting started with Botmaster Locally

The best way to begin to utilise Botmaster is to run the app locally. This will allow you to customise the code if you so wish. If however you are happy with what is already included go ahead and skip to Getting Started with Botmaster on Bluemix.

Begin by changing to the directory of this repository you have just cloned or downloaded.

* This can be done via command line e.g `cd Desktop/Botmaster-FBMessenger-Watson `

To customise your Botmaster framework, such as adding additional actions or API services find documentation here [Botmaster Documentation] (https://botmasterai.com/)

Otherwise lets get going!

## Connecting IBM Watson Conversation & Facebook Messenger
You will notice within the repository files is a manifest.yml file. This file is where we will enter our credentials to connect Botmaster to IBM Watson Conversation and Facebook Messenger. In order to achieve this change the following lines with your information.
![Environment Variables] (https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/env.png?raw=true)


##Logging into Bluemix
Bluemix is where we will host our application, therefore we will make use of the cloud foundry to help us manage and push the application.

1. Open terminal or command prompt.
2. Set the API endpoint of your Bluemix space.
	* `cf api https://api.ng.bluemix.net` - US South
	* `cf api https://api.eu-gb.bluemix.net` - UK
3. Login to Bluemix using:
	* `cf login`
	* Enter your email address of your Bluemix account.
	* Hit enter.
	* Enter your password of your Bluemix Account (*it will appear your password is not typing*)
	* Hit enter.
4. Select your space following on screen prompt.
5. To confirm and check which region, org and space is currently targeted type:
	* `cf target`

Once you have successfully logged in and targeted Bluemix you can now push your application to Bluemix.

##Pushing to Bluemix
Once you have finished working on your application you can now push this to Bluemix to be hosted. Using the steps above login to Bluemix.

1. Open terminal or command prompt.
2. Login to Bluemix.
2. Change directory to your repository using `cd yourrepository`.
3. Use the following command to push to Bluemix `cf push`.
	* Note: Before you use cf push ensure you have edited the manifest.yml file. You will need to update lines **6** and **7** using the unique name of your application.

#Exporting Your Conversation
If you wish to export your conversation in the raw .json format to share with others or backup, this can be achieved by following:

1. Log into Bluemix.
2. Locate your conversation service.
3. Within your conversation service locate you conversation instance.
![Conversation instance] (https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/instance.png?raw=true)
4. Using the menu in the top right of the conversation instance.
![Menu icon] (https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/menuicon.png?raw=true)
5. Click "Download as JSON".
![Conversation instance] (https://github.com/eciggaar/botmaster-watsonconversation/blob/master/readmeimages/instance.png?raw=true)

#Connecting Third Party API
Botmaster supports Third party API integration to enable the conversation of your bot to be enriched. Within the app.js you will see a pre included Weather API that makes use of IBM Weather Company Data.

This sample code is able to be adapted to call any API function that returns a .json response. This is outputted as a message to the user within the specified channel.

##Calling the API
To invoke an API call, Botmaster requires a trigger. In this case we have set the API trigger within the watson.output.action json tag. We have set this within Watson conversation advanced dialog, when the specified node is reached by the user the action is triggered.

In the example code we have set Watson Conversation to have the following output.

```
{
"action:"weather",
"output":{
	"text":"Hello World! Heres the weather!"
	}
}
```

Within Botmaster we have the app.js to recognise this action trigger using.

```
watsonUpdate.output.action === 'weather';

```
#Additional Links

Botmaster Documentation : [Botmaster Documentation] (https://botmasterai.com/)

Facebook Messenger Webhook Reference : [Facebook Webhooks] (https://developers.facebook.com/docs/messenger-platform/webhook-reference#setup)

Watson Conversation Documentation : [Watson Conversation] (http://www.ibm.com/watson/developercloud/doc/conversation/index.html)
