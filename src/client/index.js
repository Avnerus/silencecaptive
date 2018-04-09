import SocketUtil from './socket-util'
import URI from 'urijs'

let numberInRoom = 0;
let secondsRemain = 9999;

let thumbState = {
    left: 0,
    right: 0
}

let lastThumbState = 0;
let roomState = 'WAITING';
let lastRoomState = 'WAITING';
let totalSirenTime = 0;
let audioTime = 0;

let currentFill = [];
let lang = 'he';
let front = '';

let audioStarted = false;


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
        $("#siren-over").hide();
        if (front != '' && audioStarted) {
            $("#" + front + "-audio")[0].volume = 0;
        }
        audioTime = 0;
        $('.thumb-button').removeClass('pressed');
        lastThumbState = 0;
        thumbState.left = thumbState.right = 0;
    }
    else if (state == 'SIREN_PAUSE') {
        if (lastRoomState == 'WAITING') {
            $("#siren-wait").hide();
            $("#siren-container").show();
            $("#siren-press").show();
            $("#siren-anim").hide();
        } else {
            console.log("Someone let go!");
            if (front != '' && audioStarted) {
                $("#" + front + "-audio")[0].volume = 0;
            }
            $('#siren-pause').show();
            if (lastThumbState == 0) {
                // It's me
                $('#you-paused').show();                                
                $('#they-paused').hide();
            } else {
                // It's them
                $('#they-paused').show();
                $('#you-paused').hide();                                
            }
        }
    }
    else if (state == 'SIREN_PLAY') {
        $("#siren-press").hide();
        $("#siren-anim").show();
        $("#siren-pause").hide();
        console.log("Restarting audio at", audioTime);
        $("#" + front + "-audio")[0].volume = 1.0;
        $("#" + front + "-audio")[0].currentTime = audioTime;
    }
    else if (state == 'SIREN_OVER') {
        $("#siren-container").hide();
        $("#siren-over").show();
        $("#" + front + "-audio")[0].pause();
        if ($('#auth-form').length > 0) {
            console.log("Authenticating...");
            setTimeout(() => {
                $('#auth-form').submit();
            },3000);
        }
    }
    lastRoomState = state;
})
SocketUtil.socket.on('sirenPrep', (data) => {
    console.log("Siren prep data", data);
    $('#siren-count').text(data.totalTime / 1000);
    totalSirenTime = data.totalTime;

    front = data.animation;
    let back = front == 'yes' ? 'no' : 'yes';
    
    $('.' + front).css("stroke", "#0025ff");
    $('.' + back).css("stroke", "#1b1b1b");

    $('.' + front).insertAfter('.' + back);

    currentFill = [
        $('.' + front).data('fillY'),
        $('.' + front).data('fillHeight'),
    ];
    $('#fillRect').attr("y", currentFill[0] + currentFill[1]);
    $('#fillRect').attr("height", 0);
    $('#fillRect').attr("clip-path", "url(#sirenClip-" + front + ")");
    

        /*
    $('#fillRect').velocity({
        y: 65,
        height: 240,
        }, {duration: 60000,queue: false, easing: 'linear'});
        */
})

SocketUtil.socket.on('sirenCountdown', (countdown) => {
    $('#siren-count').text(Math.round(countdown / 1000));

    audioTime = (totalSirenTime - countdown) / 1000;
    console.log("Siren countdown " + countdown + " audio " + audioTime);
    let percentFilled = ((totalSirenTime - countdown) / totalSirenTime);
    percentFilled = Math.min(1, percentFilled + 0.006) // Prediction

    let newY = currentFill[0] + currentFill[1] - (currentFill[1] * percentFilled);
    let newHeight = currentFill[1] * percentFilled;

    $('#fillRect').velocity({
        y: newY,
        height: newHeight,
        }, {duration: 1000,queue: false, easing: 'linear'}); 
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

        if (!audioStarted && front != '') {
            audioStarted = true;
            $("#" + front + "-audio")[0].play();
            $("#" + front + "-audio")[0].volume = 0;
        }
    })

    $(".lang-link").click((e) => {
        e.preventDefault();
        let selectedLang = $(e.currentTarget).data('lang');
        let uri = URI(location);
        uri.removeSearch("lang").addSearch("lang", selectedLang);
        window.location = uri.toString();
    })

})

function updateThumbState() {
    let newThumbState = thumbState['left'] && thumbState['right'];
    if (newThumbState != lastThumbState) {
       console.log("Update thumb state", newThumbState);
       SocketUtil.socket.emit('thumbState', newThumbState); 
    }
    lastThumbState = newThumbState;
}



