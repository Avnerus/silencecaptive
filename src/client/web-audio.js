export default class WebAudio {
    constructor(audioURL) {
        console.log("Init Web Audio ", audioURL);
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();

        let request = new XMLHttpRequest();
        request.open('GET', audioURL, true);
        request.responseType = 'arraybuffer';
        request.onload = () => {
          let audioData = request.response;

          this.context.decodeAudioData(audioData, (buffer) => {
              this.buffer = buffer;
              console.log("Loaded audio buffer", this.buffer);
            },
            (e) => {console.log("Error with decoding audio data" ,e)});
        }
        request.send();
    }
    mute() {
        if (this.gainNode) {
            this.gainNode.gain.value = 0;
        }
    }
    unmute() {
        if (this.gainNode)  {
            this.gainNode.gain.value = 1;
        }
    }
    play(time = 0) {
        if (this.source) {
            this.stop();
        }
        console.log("Playing buffer");
        this.source = this.context.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.connect(this.context.destination);
        this.source.start(0,time);
    }
    unlock() {
        console.log("Unlocking");
        this.source = this.context.createBufferSource();
        this.source.buffer = this.buffer;
        this.gainNode = this.context.createGain();
        this.gainNode.gain.value = 0;
        this.source.connect(this.gainNode);
        this.gainNode.connect(this.context.destination);
        this.source.start(0);
    }
    pause() {

    }
    setTime(time) {
    }
    stop() {
        if (this.source) {
            console.log("Stopping audio",this.source);
            this.source.stop();
            this.source.disconnect();
            this.source = null;
        }
    }
}
