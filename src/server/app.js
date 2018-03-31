import memwatch from 'memwatch-next'
import express from 'express'
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compress from 'compression'
import cors from 'cors'
import socketio from 'socket.io'

import SilenceManager from './silence-manager'


if (process.env.NODE_ENV == 'development') {
    memwatch.on('leak', (info) => {
      console.error('Memory leak detected:\n', info);
    });
}


console.log("Starting Moment of Silence server");

const app = express()
.set('views', __dirname + "/views")
.set('view engine', 'ejs')
.use(compress())
.options('*', cors())
.use(cors())
.use(cookieParser())
.use(bodyParser.json())
.use(bodyParser.urlencoded({ extended: true  }))
.use(express.static(__dirname + "/../../public"))

app.get('/', function (req, res) {
    res.render('index');
})

// Server routes
const server = 
    app.listen(3030, () => {

    let host = server.address().address
    let port = server.address().port

    console.log('Node/Feathers app listening at http://%s:%s', host, port);
});
const io = socketio(server);

const silenceManager = new SilenceManager();

io.on('connection', (socket) => {
    silenceManager.newClient(socket);
});
