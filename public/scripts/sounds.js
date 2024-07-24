document.addEventListener('DOMContentLoaded', async () => await initialize());
async function initialize() {
    const keyNoteMap = new Map([
        ['y', 261.63], // C4
        ['s', 277.18], // C#4
        ['x', 293.66], // D4
        ['d', 311.13], // D#4
        ['c', 329.63], // E4
        ['v', 349.23], // F4
        ['g', 369.99], // F#4
        ['b', 392.00], // G4
        ['h', 415.30], // G#4
        ['n', 440.00], // A4
        ['j', 466.16], // A#4
        ['m', 493.88], // B4
        ['q', 523.25], // C5
        [',', 523.25], // C5
        ['2', 554.37], // C#5
        ['l', 554.37], // C#5
        ['w', 587.33], // D5
        ['.', 587.33], // D5
        ['3', 622.25], // D#5
        ['ö', 622.25], // D#5
        ['e', 659.25], // E5
        ['-', 659.25], // E5
        ['r', 698.46], // F5
        ['5', 739.99], // F#5
        ['t', 783.99], // G5
        ['6', 830.61], // G#5
        ['z', 880.00], // A5
        ['7', 932.33], // A#5
        ['u', 987.77], // B5
        ['i', 1046.50], // C6
        ['9', 1108.73], // C#6
        ['o', 1174.66], // D6
        ['0', 1244.51], // D#6
        ['p', 1318.51], // E
    ]);
    const audioCtx = new AudioContext();
    const activeOsc = new Map();
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(20000, audioCtx.currentTime);
    filter.connect(audioCtx.destination);
    let oscType = 'sine';
    document.getElementById('sine-btn').addEventListener('click', () => oscType = 'sine');
    document.getElementById('square-btn').addEventListener('click', () => oscType = 'square');
    document.getElementById('sawtooth-btn').addEventListener('click', () => oscType = 'sawtooth');
    document.getElementById('triangle-btn').addEventListener('click', () => oscType = 'triangle');
    document.getElementById('filterCutoff').addEventListener('input', (event) => {
        const minValue = 20;
        const maxValue = 20000;
        const value = parseFloat(event.target.value);
        const logValue = minValue * (Math.pow(maxValue / minValue, value / 20000));
        filter.frequency.setValueAtTime(logValue, audioCtx.currentTime);
    });
    document.getElementById('detune').addEventListener('input', (event) => {
        const newFrequencyDetune = parseFloat(event.target.value);
        activeOsc.forEach((oscillators, key) => {
            const baseFrequency = keyNoteMap.get(key);
            if (baseFrequency) {
                oscillators.forEach((osc, index) => {
                    osc.frequency.setValueAtTime(baseFrequency + (index / (index * newFrequencyDetune - 4) - 1), audioCtx.currentTime);
                });
            }
        });
    });
    document.addEventListener('keydown', (event) => {
        if (keyNoteMap.has(event.key) && !activeOsc.has(event.key)) {
            const frequency = keyNoteMap.get(event.key);
            const oscillators = [];
            const detune = parseFloat(document.getElementById('detune').value);
            for (let i = 0; i < 6; i++) {
                const osc = audioCtx.createOscillator();
                osc.type = oscType;
                osc.frequency.setValueAtTime(frequency + (i / (i * detune - 4) - 1), audioCtx.currentTime);
                osc.connect(filter);
                osc.start();
                oscillators.push(osc);
            }
            activeOsc.set(event.key, oscillators);
            let keyElement = document.querySelector(`div[data-note="${event.key}"]`);
            if (keyElement.classList.contains('white-key')) {
                keyElement.classList.add('white-key-active');
            }
            else if (keyElement.classList.contains('black-key')) {
                keyElement.classList.add('black-key-active');
            }
        }
    });
    document.addEventListener('keyup', (event) => {
        if (activeOsc.has(event.key)) {
            const oscillators = activeOsc.get(event.key);
            oscillators.forEach(osc => osc.stop());
            activeOsc.delete(event.key);
            const keyElement = document.querySelector(`div[data-note="${event.key}"]`);
            if (keyElement.classList.contains('white-key')) {
                keyElement.classList.remove('white-key-active');
            }
            else if (keyElement.classList.contains('black-key')) {
                keyElement.classList.remove('black-key-active');
            }
        }
    });
}
