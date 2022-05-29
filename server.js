require("dotenv").config();

// Its first step
const express = require("express");
const app = express();

// Database connection
const DbConnect = require("./database");

// Importing routes
const router = require("./routes");

// Socket io
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// For allowing Access-Control-Allow-Origin
const cors = require("cors");

const cookieParser = require("cookie-parser");
const ACTIONS = require("./action");

app.use(cookieParser());
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// for static image loading
app.use("/storage", express.static("storage"));

// Defining in which server will run
const PORT = process.env.PORT || 5500;

DbConnect(); // database connection

app.use(express.json({ limit: "16mb" })); // Accepting json data
app.use(router); // using router

app.get("/", (req, res) => {
  res.send("Its Working");
});

// sOCKET,IO LOGICS

const socketUserMapping = {};

io.on("connection", (socket) => {
  console.log("New Connection", socket.id);
  socket.on(ACTIONS.JOIN, ({ roomId, user }) => {
    socketUserMapping[socket.id] = user;

    // Getting all user from rooms or get empty array
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    clients.forEach(clientId => {
      io.to(clientId).emit(ACTIONS.ADD_PEER, {
        peerId: socket.id,
        createOffer: false,
        user
      });
      // FOR own emit
      socket.emit(ACTIONS.ADD_PEER, {
        peerId: clientId,
        createOffer: true,
        user: socketUserMapping[clientId]
      });
    });

    socket.join(roomId);
  });


  // Handle relay ice
  socket.on(ACTIONS.RELAY_ICE, ({ peerId, icecandidate }) => {
    io.to(peerId).emit(ACTIONS.ICE_CANDIDATE, {
      peerId: socket.id,
      icecandidate,
    });
  });

  console.log('Upto here')

   // HAndle relay sdp (session desc)
   socket.on(ACTIONS.RELAY_SDP, ({ peerId, sessionDescription }) => {
    io.to(peerId).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerId: socket.id,
      sessionDescription,
    })
    console.log("Hello", sessionDescription);
  });

  // Mute and unmute
  socket.on(ACTIONS.MUTE,({roomId, userId}) =>{
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    clients.forEach(clientId =>{
        io.to(clientId).emit(ACTIONS.MUTE,{
          peerId: socket.id,
          userId,
        })
    })
  });

  socket.on(ACTIONS.UN_MUTE,({roomId, userId}) =>{
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    clients.forEach(clientId =>{
        io.to(clientId).emit(ACTIONS.UN_MUTE,{
          peerId: socket.id,
          userId,
        })
    })
  });

  // LEaving room
  const leaveRoom = ({roomId}) =>{
    const {rooms} = socket;
    Array.from(rooms).forEach(roomId => {
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || [] )
      clients.forEach(clientId =>{
        io.to(clientId).emit(ACTIONS.REMOVE_PEER,{
          peerId: socket.id,
          userId: socketUserMapping[socket.id]?.id,
        })

        socket.emit(ACTIONS.REMOVE_PEER,{
          peerId: clientId,
          userId: socketUserMapping[socket.id]?.id,
        });
      });
      socket.leave(roomId)
    });
    delete socketUserMapping[socket.id];
    
  }
  socket.on(ACTIONS.LEAVE, leaveRoom);
  socket.on('disconnecting', leaveRoom)

});

server.listen(PORT, () => console.log(`Server started on ${PORT}`));


