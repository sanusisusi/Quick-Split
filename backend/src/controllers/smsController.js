exports.handleSMSReply = async (req, res) => {

  const { from, text } = req.body;

  console.log("SMS from:", from);
  console.log("Message:", text);

  if (text.toLowerCase() === "pay") {

    console.log("User confirmed payment");

  }

  res.send("OK");
};