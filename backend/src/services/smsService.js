const { sms } = require("../config/africastalking");

exports.sendSMS = async (phone, message) => {

  const options = {
    to: [phone],
    message
  };

  try {

    const response = await sms.send(options);
    console.log("SMS sent:", response);

  } catch (error) {

    console.error("SMS error:", error);

  }
};