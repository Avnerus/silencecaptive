// Socket Util
class SocketUtil {
    constructor() {

    }
    initWithUrl(url) {
        this.url = url;
        this.socket = io(url);

        this.socket.on('connect', () => {
            console.log("Socket connection is open");
        });
        this.socket.on('error', (error) => {
            console.log('Error connecting to socket', error);
        }); 

        this.socket.on('reconnect', (attemptNumber) => {
            console.log("Socket reconnected");
            this.trigger('socket_reconnect');
        }); 
    }

    reconnect() {
        /*
        console.log("Socket Util - Reconnecting socket");
        this.initWithUrl(this.url);*/
    }

    rpc(...args) {
        return new Promise((resolve, reject) => {
            console.log("Socket util sending ",args);
            args.push( (error, result) => {
                if (error) { 
                    reject(error)
                } else {
                    resolve(result);
                }
            });
                
            this.socket.emit.apply(this.socket,args);
        });
    }
};

// Singleton
let instance = new SocketUtil();
export default instance;
