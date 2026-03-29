const fs = require("fs");

let users = {};
let messages = {};

// טעינה
if (fs.existsSync("users.json")) users = JSON.parse(fs.readFileSync("users.json"));
if (fs.existsSync("messages.json")) messages = JSON.parse(fs.readFileSync("messages.json"));

function saveAll(){
    fs.writeFileSync("users.json", JSON.stringify(users,null,2));
    fs.writeFileSync("messages.json", JSON.stringify(messages,null,2));
}

// register
app.post("/register",(req,res)=>{
    const {username,password} = req.body;
    if(users[username]) return res.json({success:false});

    users[username] = {
        password,
        friends:[],
        avatar:"",
        displayName:username
    };

    saveAll();
    res.json({success:true});
});

// login
app.post("/login",(req,res)=>{
    const {username,password} = req.body;

    if(!users[username] || users[username].password !== password)
        return res.json({success:false});

    res.json({success:true, user:users[username]});
});

// update profile
app.post("/update-profile",(req,res)=>{
    const {username, displayName, avatar} = req.body;

    if(users[username]){
        users[username].displayName = displayName;
        users[username].avatar = avatar;
        saveAll();
        res.json({success:true});
    }
});

// add friend
app.post("/add-friend",(req,res)=>{
    const {myUsername, friendUsername} = req.body;

    if(users[friendUsername]){
        users[myUsername].friends.push(friendUsername);
        users[friendUsername].friends.push(myUsername);
        saveAll();
        res.json({success:true});
    } else res.json({success:false});
});

// socket
io.on("connection",(socket)=>{

    socket.on("register",username=>{
        socket.username = username;
    });

    socket.on("send-message",({to,from,text})=>{

        const key = [from,to].sort().join("_");

        if(!messages[key]) messages[key] = [];
        messages[key].push({from,text});

        saveAll();

        io.emit("receive-message",{to,from,text});
    });

});