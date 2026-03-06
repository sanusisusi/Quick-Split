const AfricasTalking = require('africastalking');
require('dotenv').config();

const africastalking = AfricasTalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME
});

const sms = africastalking.SMS;

module.exports = {
  africastalking,
  sms
};