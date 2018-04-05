import SocketUtil from './socket-util'

let numberInRoom = 0;
let secondsRemain = 9999;

let thumbState = {
    left: 0,
    right: 0
}

let lastThumbState = 0;
let roomState = 'WAITING';
let lastRoomState = '';

console.log("Starting silencecaptive");
SocketUtil.initWithUrl(window.location.protocol + "//" + window.location.host);

SocketUtil.socket.on('numberInRoom', (number) => {
    console.log("Number in room!", number);
    $('#connected-value').text(number);
    if (number >= 2) {
        $('#siren-countdown').show();
    } else {
        $('#siren-countdown').hide();
    }
})

SocketUtil.socket.on('secondsRemain', (seconds) => {
    console.log("Seconds remaining", seconds);
    $('#countdown-value').text(seconds);
})

SocketUtil.socket.on('state', (state) => {
    console.log("Changed room state", state);
    if (state == 'WAITING') {
        $("#siren-wait").show();
        $("#siren-container").hide();
    }
    else if (state == 'SIREN_PAUSE') {
        $("#siren-wait").hide();
        $("#siren-container").show();
    }
})

$(document).ready(() => {
    console.log("Binding events");
    /* WEB DEBUG
    $('.thumb-button').bind('touchstart', (event) => {
        let target = $(event.currentTarget);
        target.addClass('pressed');
        thumbState[target.data('thumb')] = 1;
        })*/

    $('.thumb-button').bind('touchend', (event) => {
        let target = $(event.currentTarget);
        /* WEB DEBUG 
        target.removeClass('pressed');
        thumbState[target.data('thumb')] = 0; */

        if (thumbState[target.data('thumb')] == 0) {
            thumbState[target.data('thumb')] = 1; 
            target.addClass('pressed');
        } else {
            thumbState[target.data('thumb')] = 0; 
            target.removeClass('pressed');
        }

        updateThumbState();
    })

    let test = 60;
    setInterval(() => {
        let percentFilled = (60 - test) / 100;
        let newY = 300 - (250 * percentFilled);
        let newHeight = 250 * percentFilled;
        console.log("Height: ", newHeight, "Y: ", newY);
        $('#fillRect').velocity({
            y: newY,
            height: newHeight,
        }, {duration: 1500,queue: false});
        test-=1;
        },1000) 
            /* 
    $('#fillRect').velocity({
        y: 50,
        height: 300
        }, {duration: 60000}); */
})

function updateThumbState() {
    let newThumbState = thumbState['left'] && thumbState['right'];
    if (newThumbState != lastThumbState) {
       console.log("Update thumb state", newThumbState);
       SocketUtil.socket.emit('thumbState', newThumbState); 
    }
    lastThumbState = newThumbState;
}



