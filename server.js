'use strict';

const express = require('express');
const morgan = require('morgan');

require('dotenv').config();

const {logger} = require('./utilities/logger');
const {sendEmail} = require('./emailer');
const {FooError, BarError, BizzError} = require('./errors');
const {ALERT_FROM_EMAIL, ALERT_FROM_NAME, ALERT_TO_EMAIL} = process.env;
const app = express();


const russianRoulette = (req, res) => {
  const errors = [FooError, BarError, BizzError];
  throw new errors[
    Math.floor(Math.random() * errors.length)]('It blew up!');
};

const sendEmailAlerts = (err , req , res , next) =>{
logger.info(`Attempting to send error alert email to ${ALERT_TO_EMAIL}`);
if ( err instanceof FooError || err instanceof BarError)  {
  const emailData = {
      from: ALERT_FROM_EMAIL,
      to: ALERT_TO_EMAIL,
      subject: `SERVICE ALERT: ${err.name}`,
      text: `Something went wrong. Here's what we know:\n\n${err.stack}`
    };
    sendEmail(emailData);
  }
  next(err);
}
  
  


app.use(morgan('common', {stream: logger.stream}));

// for any GET request, we'll run our `russianRoulette` function
app.get('*', russianRoulette);

app.use(sendEmailAlerts);
// YOUR MIDDLEWARE FUNCTION should be activated here using
// `app.use()`. It needs to come BEFORE the `app.use` call
// below, which sends a 500 and error message to the client

app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({error: 'Something went wrong'}).end();
});

const port = process.env.PORT || 8080;

const listener = app.listen(port, function () {
  logger.info(`Your app is listening on port ${port}`);
});
