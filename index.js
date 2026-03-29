const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");

app.use(express.static("public"));
app.use(bodyParser.json());

let users = {}; // שמירת משתמשים {username: {password, friends: []}}
let onlineSockets = {}; // מי מחובר עכשיו

// יצירת משתמש חדש
app.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (users[username]) return res.json({ success: false, msg: "Username exists" });
    users[username] = { password, friends: [] };
    res.json({ success: true });
});

// התחברות
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!users[username] || users[username].password !== password)
        return res.json({ success: false, msg: "Invalid credentials" });
    res.json({ success: true });
});

// הוספת חבר
app.post("/add-friend", (req, res) => {
    const { myUsername, friendUsername } = req.body;
    if (!users[friendUsername]) return res.json({ success: false });
    if (!users[myUsername].friends.includes(friendUsername))
        users[myUsername].friends.push(friendUsername);
    if (!users[friendUsername].friends.includes(myUsername))
        users[friendUsername].friends.push(myUsername);
    res.json({ success: true });
});

// Socket.io – צ'אט
io.on("connection", (socket) => {
    socket.on("register", (username) => {
        onlineSockets[username] = socket;
    });

    socket.on("send-message", ({ to, from, text }) => {
        if (onlineSockets[to]) onlineSockets[to].emit("receive-message", { from, text });
    });

    socket.on("disconnect", () => {
        for (let u in onlineSockets) if (onlineSockets[u] === socket) delete onlineSockets[u];
    });
});

http.listen(3000, () => console.log("Server running on port 3000"));