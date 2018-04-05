export default class SilenceManager {
    constructor(io) {
        this.roomCounter = 0;
        this.waitingRoom = null;
        this.socketData = {};
        this.io = io;
        this.roomData = {};

        this.WAIT_FOR_SIREN_SECONDS = 5;
        this.UPDATE_INTERVAL = 100;

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
                name: this.waitingRoom,
                numberInRoom: 0,
                state: 'WAITING',
                sockets: []
            }
        }

        console.log("Joining room " + this.waitingRoom);
        this.socketData[socket.id] = {
            room: this.waitingRoom,
            thumbState: 0
        }
        let roomData = this.roomData[this.waitingRoom];
        roomData.numberInRoom++;
        roomData.sockets.push(socket.id);
        if (roomData.numberInRoom >= 2) {
            // Set the siren in 15 seconds
            roomData.sirenTime = new Date().getTime() + this.WAIT_FOR_SIREN_SECONDS * 1000;
        }
        socket.join(this.waitingRoom);
        this.io.to(this.waitingRoom).emit('numberInRoom',roomData.numberInRoom);
    }

    clientDisconnected(socket) {
        console.log("Client disconnected ", socket.id);
        if (this.socketData[socket.id]) {
            if (this.socketData[socket.id].room) {
                let socketRoom = this.socketData[socket.id].room;
                let roomData = this.roomData[socketRoom];
                console.log("Leaving room " + socketRoom);
                let index = roomData.sockets.findIndex(sid => sid == socket.id);
                if (index != -1) {
                    console.log("Splicing index " + index);
                    roomData.sockets.splice(index, 1);
                } else {
                    console.warn("Couldn't find socket in room data!")
                }
                socket.leave(socketRoom);
                roomData.numberInRoom--;
                this.io.to(socketRoom).emit('numberInRoom',roomData.numberInRoom);
                if (roomData.numberInRoom == 0 && (!this.waitingRoom || this.waitingRoom != roomData.name)) {
                    console.log("Disposing room " + roomData.name);
                    delete this.roomData[roomData.name];
                }
            }
            delete this.socketData[socket.id];
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

                if (secondsRemain == 0) {
                    this.changeState(this.waitingRoom, 'SIREN_PAUSE')
                    this.waitingRoom = null;
                }
            }
        }
    }

    thumbStateChanged(socket,state) {
        console.log("Thumb state changed!", state);
        if (this.socketData[socket.id]) {
            let socketData = this.socketData[socket.id];
            socketData.thumbState = state;
            let roomData = this.roomData[socketData.room];
            if (roomData) {
                if (state == 1) {
                    // Check if everyone in the room have the thumbs down
                    let allStates = 1;
                    for (let i = 0; i < roomData.sockets.length && allStates; i++) {
                        allStates = this.socketData[roomData.sockets[i]].thumbState;                        
                    }
                    if (allStates) {
                        console.log("Everyone has thumbs down!");
                        this.changeState(roomData.name, 'SIREN_PLAY');
                    }
                }
            } else {
                console.error("No room data for " + socket.room)
            }
        }
    }

    changeState(room, state) {
        if (this.roomData[room]) {
            this.roomData[room].state = state;
            this.io.to(room).emit('state',state);
        } else {
            console.error("changeState - No room data for " + room);
        }
    }
}
