export default class SilenceManager {
    constructor() {
    }

    newClient(socket) {
        console.log("New silence client connected!", socket.id);
    }
}
