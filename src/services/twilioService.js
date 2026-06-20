const twilio = require('twilio');
const env = require('../config/env');

let client;

const getClient = () => {
  if (!env.twilio.accountSid || !env.twilio.authToken || !env.twilio.whatsappNumber) {
    const err = new Error('Twilio no está configurado en las variables de entorno');
    err.statusCode = 503;
    throw err;
  }

  if (!client) client = twilio(env.twilio.accountSid, env.twilio.authToken);
  return client;
};

const withWhatsappPrefix = (number) =>
  number.startsWith('whatsapp:') ? number : `whatsapp:${number}`;

const normalizePhone = (number = '') => number.replace(/^whatsapp:/i, '').trim();

const sendWhatsAppMessage = async ({ to, body }) =>
  getClient().messages.create({
    from: withWhatsappPrefix(env.twilio.whatsappNumber),
    to: withWhatsappPrefix(to),
    body,
  });

const buildTwimlResponse = (message) => {
  const response = new twilio.twiml.MessagingResponse();
  response.message(message);
  return response.toString();
};

module.exports = {
  sendWhatsAppMessage,
  buildTwimlResponse,
  normalizePhone,
};
