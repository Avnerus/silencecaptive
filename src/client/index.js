import SocketUtil from './socket-util'
/*
window.IS_SERVER = false
window.IS_CLIENT = true
*/
console.log("Starting silencecaptive");
SocketUtil.initWithUrl(window.location.protocol + "//" + window.location.host);

SocketUtil.socket.on('numberInRoom', (number) => {
    console.log("Number in room!", number);
    $('#connected-value').text(number);
})


