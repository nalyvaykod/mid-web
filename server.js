const http = require("http")
const path = require("path")
const fs = require("fs")
const db = require("./database")

const indexHtmlFile = fs.readFileSync(path.join(__dirname, "static", "index.html"))
const registerHtmlFile = fs.readFileSync(path.join(__dirname, "static", "register.html"))
const authScript = fs.readFileSync(path.join(__dirname, "static", "auth.js"))
const scriptFile = fs.readFileSync(path.join(__dirname, "static", "script.js"))
const styleFile = fs.readFileSync(path.join(__dirname, "static", "style.css"))

const server = http.createServer((req, res) => {
    if (req.method === "GET") {
        switch(req.url) {
            case "/": return res.end(indexHtmlFile)
            case "/script.js": return res.end(scriptFile)
            case "/style.css": return res.end(styleFile)
            case "/register": return res.end(registerHtmlFile)
            case "/auth.js": return res.end(authScript)
        }
    }

    if (req.method === "POST") {
        switch(req.url) {
            case "/api/register": return registerUser(req, res)
        }
    }


    res.statusCode = 404
    return res.end("Error 404")
})

server.listen(3000)

const { Server } = require("socket.io")
const io = new Server(server)

io.on("connection", async (socket) => {
    console.log("user connected. id - " + socket.id)
    let userNickName = "user"

    let messages = await db.getMessages()
    socket.emit("all_messages", messages)

    socket.on("set_nickname", (nickname) => {
        userNickName = nickname
    })

    socket.on("new_message", (message) => {
        console.log(`${socket.id} - ${message}`)
        db.addMessage(message, 1)
        io.emit("message", userNickName + ":" + message)
    })
})

function registerUser(req, res) {
    let data = ""
    req.on("data", function(chunk) {
        data += chunk
    })

    req.on("end", async function(chunk) {
        console.log(db)
        try {
            const user = JSON.parse(data)
            console.log(data)
            if (!user.login || !user.password) {
                return res.end("Empty login or password")
            }

            if (await db.isUserExist(user.login)) {
                return res.end("User already exist")
            }

            await db.addUser(user)
            return res.end("Registration is successfull!")

        } catch (error) {
            return res.end(error)
        }
    })

}
