import SocketUtil from './socket-util'
/*
window.IS_SERVER = false
window.IS_CLIENT = true
*/
console.log("Starting silencecaptive");
SocketUtil.initWithUrl(window.location.protocol + "//" + window.location.host);
