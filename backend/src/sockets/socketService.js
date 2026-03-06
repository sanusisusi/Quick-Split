let io;

function initSocket(server) {

  const socketIO = require("socket.io");

  io = socketIO(server, {
    cors: {
      origin: "*",
    }
  });

  io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    socket.on("joinSessionRoom", (sessionId) => {
      socket.join(sessionId);
      console.log(`User joined room ${sessionId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });

  });

}

/**
 * Emit event to session
 */
function emitSessionUpdate(sessionId, data) {

  if (io) {
    io.to(sessionId).emit("sessionUpdated", data);
  }

}

module.exports = {
  initSocket,
  emitSessionUpdate
};