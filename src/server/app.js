import memwatch from 'memwatch-next'
import express from 'express'
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compress from 'compression'
import cors from 'cors'
import socketio from 'socket.io'

import SilenceManager from './silence-manager'
import i18n from './i18n'


if (process.env.NODE_ENV == 'development') {
    memwatch.on('leak', (info) => {
      console.error('Memory leak detected:\n', info);
    });
}

console.log("Starting Moment of Silence server");

const SUPPORTED_LANGS = {
    'en' : 'en',
    'he': 'he'
}

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
    let i18nData = i18n.he;
    if (req.query.lang && SUPPORTED_LANGS[req.query.lang]) {
        i18nData = i18n[req.query.lang];
    }
    res.render('index', {i18n: i18nData});
})

// Server routes
const server = 
    app.listen(3030, () => {

    let host = server.address().address
    let port = server.address().port

    console.log('Node/Feathers app listening at http://%s:%s', host, port);
});
const io = socketio(server);

const silenceManager = new SilenceManager(io);

io.on('connection', (socket) => {
    silenceManager.newClient(socket);
    socket.on('disconnect', () => silenceManager.clientDisconnected(socket));
    socket.on('thumbState', (state) => silenceManager.thumbStateChanged(socket,state));
});
