exports.handleUSSD = (req, res) => {

  const { text } = req.body;

  let response = "";

  if (text === "") {

    response = `CON Welcome to Split & Tap
1. Join Bill
2. View My Share`;

  }

  else if (text === "1") {

    response = "END You joined the bill successfully";

  }

  else if (text === "2") {

    response = "END Your share is ₦3500";

  }

  else {

    response = "END Invalid option";

  }

  res.send(response);
};