export default class HTMLAudio {
    constructor(audioElement) {
        console.log("Init HTML Audio", audioElement);
        this.element = audioElement;
    }
    mute() {
        this.element.volume = 0;
    }
    unmute() {
        this.element.volume = 1;
    }
    play(time = 0) {
        this.element.play();
    }
    pause() {
        this.element.pause();
    }
    setTime(time) {
        this.element.currentTime = time;
    }
}
