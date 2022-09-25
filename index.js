



// Lambda Function code for Alexa.
// Paste this into your index.js file. 

const Alexa = require("ask-sdk-core");
const https = require("https");

const dbHelper = require('./dbHelper');
const userDBRequest = require('./userDBRequest');

const dynamoDBTableName = "dynamodb-starter";

//invocationName = "animal facts";
const invocationName = "vu factcode";




//Intent Handlers =============================================
//good for now?
const AMAZON_CancelIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.CancelIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;


        let say = 'Okay, talk to you later!';

        return responseBuilder
            .speak(say)
            .withShouldEndSession(true)
            .getResponse();
    },
};

//help intent
const AMAZON_HelpIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;

        let say = 'Some of the animals are dog, cat, and horse.';

        say += ' Here something you can ask me: Tell me about \'animal of your choice\', Add \'animal of your choice\'';

        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};

//good for now?
const AMAZON_StopIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.StopIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;

        let say = 'Okay, talk to you later!';

        return responseBuilder
            .speak(say)
            .withShouldEndSession(true)
            .getResponse();
    },
};

//Fallback intent is used to handle unrecognized response
const AMAZON_FallbackIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;

        return responseBuilder
            .speak('Sorry I did not understand what you said, say \' help \' to get some advice')
            .reprompt('Please try again!')
            .getResponse();
    },
};

const AMAZON_NavigateHomeIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NavigateHomeIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;

        let say = 'Hello from AMAZON.NavigateHomeIntent. ';


        return responseBuilder
            .speak(say)
            .reprompt('try again, ' + say)
            .getResponse();
    },
};

const AnimalNameIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AnimalNameIntent';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;

        let slotValues = getSlotValues(request.intent.slots);
        const animalName = slotValues.animalname.heardAs;
        
        return dbHelper.getAnimalFact(animalName)
            .then((data) => {
                var speechText = "There are some facts as about the " + animalName + " as following. "

                if (data.map(e => e.Animal_Name) != animalName) {
                    speechText = "Sorry the "+animalName+ " is not there yet, to request build Facts by saying \'add "+animalName+"\'."
                } else {
                    speechText += data.map(e => e.Fact1) +" If you want to hear more about "+animalName+". Say \'More About " + animalName+"\'."
                }
                return responseBuilder
                    .speak(speechText)
                    .reprompt("Please try again!")
                    .getResponse();
            })        
    },

};

const MoreFactIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'MoreFactIntent';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;

        let slotValues = getSlotValues(request.intent.slots);
        const animalName = slotValues.morefactanimalname.heardAs;
        
        return dbHelper.getAnimalFact(animalName)
            .then((data) => {
                if (data.map(e => e.Animal_Name) != animalName) {
                    speechText = "Sorry the " + animalName + " is not there yet, to request build Facts by saying \'add " + animalName + "\'."
                    return responseBuilder
                        .speak(speechText)
                        .reprompt("Please try again!")
                        .getResponse();
                } else {
                    var speechText = ""
                    if (data.map(e => e.Fact2) == "") {
                        speechText = "Sorry there is no more fact about " + animalName + " please try with other animal."
                    } else {
                        speechText += data.map(e => e.Fact2)
                    }
                    return responseBuilder
                        .speak(speechText)
                        .reprompt("Please try again!")
                        .getResponse();
                }
            })
    },

};

//request unknow animal
const AddAnimalIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AddAnimalIntent';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        const slots = request.intent.slots;
        const newAnimalName = slots.newanimalname.value;

        //check if animal already has fact
        return dbHelper.getAnimalFact(newAnimalName)
            .then((data) => {
                //check if animal request is sent
                if (data.map(e => e.Animal_Name) != newAnimalName) {
                    return userDBRequest.checkRequestName(newAnimalName)
                        .then((data1) => {
                            //if animal request doesn't exist either not having fact
                            if (data1.map(e => e.Request_Animal_Name) != newAnimalName) {
                                return userDBRequest.addRequest(newAnimalName)
                                    .then((data2) => {
                                        const speechText = 'You have sent request to create fact for ' + newAnimalName + '.';
                                        return responseBuilder
                                            .speak(speechText)
                                            .reprompt("Please try again!")
                                            .getResponse();
                                    })
                                    .catch((err) => {
                                        console.log("Error occured while sending request", err);
                                        const speechText = "we cannot request your animal right now. Try again!"
                                        return responseBuilder
                                            .speak(speechText)
                                            .getResponse();
                                    })
                            } else {
                                var speechText = "Sorry the request for " + newAnimalName + " is already sent."
                                return responseBuilder
                                    .speak(speechText)
                                    .reprompt("Please try again!")
                                    .getResponse();
                            }
                        })
                } else {
                    var speechText = "The fact for the " + newAnimalName + " already existed, please check by say \' tell me fact about " + newAnimalName +"\'."
                    return responseBuilder
                        .speak(speechText)
                        .reprompt("Please try again!")
                        .getResponse();
                }
            })
    },
};


//launch handler
const LaunchRequest_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;

        let say = 'Hello' + ' and welcome to ' + invocationName + ' to discover some facts for different animals! Say \'help\' to hear some options.';

        return responseBuilder
            .speak(say)
            .reprompt('Please try again, ' + say)
            .getResponse();
    },
};



const SessionEndedHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const request = handlerInput.requestEnvelope.request;

        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Sorry, an error occurred.  Please say again.')
            .reprompt('Sorry, an error occurred.  Please say again.')
            .getResponse();
    }
};


//Helper Functions ===================================================================

function getSlotValues(filledSlots) {
    const slotValues = {};

    Object.keys(filledSlots).forEach((item) => {
        const name = filledSlots[item].name;

        if (filledSlots[item] &&
            filledSlots[item].resolutions &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
                case 'ER_SUCCESS_MATCH':
                    slotValues[name] = {
                        heardAs: filledSlots[item].value,
                        resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                        ERstatus: 'ER_SUCCESS_MATCH'
                    };
                    break;
                case 'ER_SUCCESS_NO_MATCH':
                    slotValues[name] = {
                        heardAs: filledSlots[item].value,
                        resolved: '',
                        ERstatus: 'ER_SUCCESS_NO_MATCH'
                    };
                    break;
                default:
                    break;
            }
        } else {
            slotValues[name] = {
                heardAs: filledSlots[item].value,
                resolved: '',
                ERstatus: ''
            };
        }
    }, this);

    return slotValues;
}


//Exports handler function and setup ===================================================
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
    .addRequestHandlers(
        AMAZON_CancelIntent_Handler,
        AMAZON_HelpIntent_Handler,
        AMAZON_StopIntent_Handler,
        AMAZON_FallbackIntent_Handler,
        AMAZON_NavigateHomeIntent_Handler,
        AnimalNameIntent_Handler,
        MoreFactIntent_Handler,
        AddAnimalIntent_Handler,
        LaunchRequest_Handler,
        SessionEndedHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();

