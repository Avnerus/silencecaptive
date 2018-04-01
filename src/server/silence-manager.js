export default class SilenceManager {
    constructor(io) {
        this.roomCounter = 0;
        this.waitingRoom = null;
        this.socketRooms = {};
        this.io = io;
        this.roomData = {};

        setInterval(() => {
            this.updateRooms();
        },100)
    }

    newClient(socket) {
        console.log("New silence client connected!", socket.id);
        // Is there a waiting room?
        if (this.waitingRoom) {

        } else {
            // Create a new waiting room
            this.roomCounter++;
            let roomName = 'silence' + this.roomCounter;
            console.log("Created new waiting room " + roomName);
            this.waitingRoom = roomName;
            this.roomData[this.waitingRoom] = {
                numberInRoom: 0
            }
        }

        console.log("Joining room " + this.waitingRoom);
        this.socketRooms[socket.id] = this.waitingRoom;
        let roomData = this.roomData[this.waitingRoom];
        roomData.numberInRoom++;
        if (roomData.numberInRoom >= 2) {
            // Set the siren in 15 seconds
            roomData.sirenTime = new Date().getTime() + 15000;            
        }
        socket.join(this.waitingRoom);
        this.io.to(this.waitingRoom).emit('numberInRoom',roomData.numberInRoom);
    }

    clientDisconnected(socket) {
        console.log("Client disconnected ", socket.id);
        if (this.socketRooms[socket.id]) {
            let socketRoom = this.socketRooms[socket.id];
            let roomData = this.roomData[socketRoom];
            console.log("Leaving room " + socketRoom);
            socket.leave(socketRoom);
            roomData.numberInRoom--;
            this.io.to(socketRoom).emit('numberInRoom',roomData.numberInRoom);
            delete this.socketRooms[socket.id];
        }
    }

    updateRooms() {
        if (this.waitingRoom) {
            let waitingRoom = this.roomData[this.waitingRoom];
            if (waitingRoom.numberInRoom >= 2) {
                let now = new Date().getTime();
                let millisRemain = waitingRoom.sirenTime - now;
                let secondsRemain = Math.floor(millisRemain / 1000);
                this.io.to(this.waitingRoom).emit('secondsRemain',secondsRemain);
            }
        }
    }
}
