const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

// שמירת משתמשים
const USERS_FILE = path.join(__dirname, "users.json");
let users = {};
if(fs.existsSync(USERS_FILE)) users = JSON.parse(fs.readFileSync(USERS_FILE));
function saveUsers(){ fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); }

// יצירת משתמש חדש
app.post("/create-user", (req, res) => {
    const id = uuidv4().slice(0,6).toUpperCase();
    users[id] = { friends: [], socketId: "" };
    saveUsers();
    res.json({ id });
});

// הוספת חבר
app.post("/add-friend", (req, res) => {
    const { myId, friendId } = req.body;
    if(users[myId] && users[friendId]){
        if(!users[myId].friends.includes(friendId)) users[myId].friends.push(friendId);
        if(!users[friendId].friends.includes(myId)) users[friendId].friends.push(myId);
        saveUsers();
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Socket.io
io.on("connection", socket => {
    socket.on("register", (userId) => {
        if(users[userId]) users[userId].socketId = socket.id;
        saveUsers();
    });
    socket.on("send-message", ({ to, from, text }) => {
        const friend = users[to];
        if(friend && friend.socketId) io.to(friend.socketId).emit("receive-message", { from, text });
    });
    socket.on("disconnect", () => {
        for(let id in users) if(users[id].socketId===socket.id) users[id].socketId="";
        saveUsers();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));