const express = require("express");
const cors = require("cors");
require("dotenv").config();

const http = require("http");

const sessionRoutes = require("./routes/sessionRoutes");
const ussdRoutes = require("./routes/ussdRoutes");
const smsRoutes = require("./routes/smsRoutes");

const { initSocket } = require("./sockets/socketService");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", sessionRoutes);
app.use("/", ussdRoutes);
app.use("/", smsRoutes);

const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});