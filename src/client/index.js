import SocketUtil from './socket-util'
import URI from 'urijs'
import WebAudio from './web-audio'

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

let audio = null;
let audioStarted = false;

console.log("Starting silencecaptive");
//  Sanity check
setInterval(() => {
    if (audio && audio.source && lastRoomState != 'SIREN_PLAY') {
        audio.stop();
    }
},100);

SocketUtil.initWithUrl(window.location.protocol + "//" + window.location.host);

SocketUtil.socket.on('ready', () => {
    console.log('Joining room');
    SocketUtil.socket.emit('join');
})

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
        if (audio && audioStarted) {
            audio.stop();
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
            if (audio && audioStarted) {
                audio.stop();
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
        audioStarted = false;
    }
    else if (state == 'SIREN_PLAY') {
        $("#siren-press").hide();
        $("#siren-anim").show();
        $("#siren-pause").hide();
        console.log("Restarting audio at", audioTime);
        audio.play(audioTime);
    }
    else if (state == 'SIREN_OVER') {
        $("#siren-container").hide();
        $("#siren-over").show();
        audio.stop();
        if ($('#auth-form').length > 0) {
            console.log("Authenticating...");
            setTimeout(() => {
                $('#auth-form').submit();
            },3000);
        }
    }
    else if (state == 'GONE') {
        window.location.reload();
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

    // Init audio object
    //audio = new HTMLAudio($("#" + front + "-audio")[0]);
    let src = "/audio/" + front;
    if (isIphone()) {
        src += ".m4a";
    } else {
        src += ".ogg";
    }
    console.log("Audio src", src);
    audio = new WebAudio(src);
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
    $('.thumb-button').bind('touchstart', (event) => {
        let target = $(event.currentTarget);
        target.addClass('pressed');
        thumbState[target.data('thumb')] = 1;

        if (!audioStarted) {
            audioStarted = true;
            audio.unlock();
        }
        updateThumbState();
    });

    $('.thumb-button').bind('touchend', (event) => {
        let target = $(event.currentTarget);
        target.removeClass('pressed');
        thumbState[target.data('thumb')] = 0; 

        /* WEB DEBUG 
        if (thumbState[target.data('thumb')] == 0) {
            thumbState[target.data('thumb')] = 1; 
            target.addClass('pressed');
        } else {
            thumbState[target.data('thumb')] = 0; 
            target.removeClass('pressed');
            } */

        updateThumbState();

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

function isIphone() {
    let userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return true;
    } else {
        return false;
    }
}


