document.addEventListener('DOMContentLoaded', async () => initialize());

let audioCtx;

async function initialize() {
    const keyNoteMap = new Map<string, number>([
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

    const activeOsc = new Map<string, { oscillators: OscillatorNode[], gainNode: GainNode }>();
    audioCtx = new AudioContext();


    // Effects
    //
    //

    const distortion = audioCtx.createWaveShaper();
    distortion.oversample = '4x';

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'allpass';
    filter.frequency.setValueAtTime(20000, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.connect(filter);
    filter.connect(audioCtx.destination);

    document.getElementById('distortionToggle').addEventListener('click', () => {
        if ((document.getElementById('distortionToggle') as HTMLInputElement).checked) {
            gain.disconnect();
            distortion.disconnect();
            gain.connect(distortion);
            distortion.connect(filter);
        }
        else {
            distortion.disconnect();
            gain.disconnect();
            gain.connect(filter);
        }
    });

    document.getElementById('distortionToggle').click();

    distortion.curve = makeDistortionCurve(parseFloat((document.getElementById('distortion') as HTMLInputElement).value));
    document.getElementById('distortion').addEventListener('input', () => {
        distortion.curve = makeDistortionCurve(parseFloat((document.getElementById('distortion') as HTMLInputElement).value));
    });

    document.getElementById('lowpass-btn').addEventListener('click', () => filter.type = 'lowpass');
    document.getElementById('highpass-btn').addEventListener('click', () => filter.type = 'highpass');
    document.getElementById('bandpass-btn').addEventListener('click', () => filter.type = 'bandpass');
    document.getElementById('allpass-btn').addEventListener('click', () => filter.type = 'allpass');

    let oscType = 'sine';
    document.getElementById('sine-btn').addEventListener('click', () => oscType = 'sine');
    document.getElementById('square-btn').addEventListener('click', () => oscType = 'square');
    document.getElementById('sawtooth-btn').addEventListener('click', () => oscType = 'sawtooth');
    document.getElementById('triangle-btn').addEventListener('click', () => oscType = 'triangle');

    document.getElementById('filterCutoff').addEventListener('input', (event) => {
        const minValue = 20;
        const maxValue = 20000;
        const value = parseFloat((event.target as HTMLInputElement).value);
        const logValue = minValue * (Math.pow(maxValue / minValue, value / 20000));
        filter.frequency.setValueAtTime(logValue, audioCtx.currentTime);
    });

    //
    //
    //

    document.getElementById('octave-down-btn').addEventListener('click', () => {
       if (keyNoteMap.get('y') <= (261.63 / 8)) {
           return;
       }
       keyNoteMap.forEach((value, key) => keyNoteMap.set(key, value / 2));
    });

    document.getElementById('octave-up-btn').addEventListener('click', () => {
        keyNoteMap.forEach((value, key) => keyNoteMap.set(key, value * 2));
    });

    document.getElementById('detune').addEventListener('input', (event) => {
        const newDetuneValue = parseFloat((event.target as HTMLInputElement).value);

        activeOsc.forEach((value, key) => {
            const baseFrequency = keyNoteMap.get(key);
            if (baseFrequency) {
                value.oscillators.forEach((osc, index) => {
                    const detuneAmount = (index / (index * newDetuneValue - 4) - 1);
                    const newFrequency = baseFrequency + detuneAmount;
                    osc.frequency.setValueAtTime(newFrequency, audioCtx.currentTime);
                });
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (keyNoteMap.has(event.key) && !activeOsc.has(event.key)) {
            const frequency = keyNoteMap.get(event.key);
            const oscillators = [];
            const noteGain = audioCtx.createGain();
            noteGain.connect(gain);

            const attack = document.getElementById('attack') as HTMLInputElement;
            const decay = document.getElementById('decay') as HTMLInputElement;
            const sustain = document.getElementById('sustain') as HTMLInputElement;
            applyADSR(noteGain, parseFloat(attack.value), parseFloat(decay.value), parseFloat(sustain.value));


            for (let i = 0; i < 6; i++) {
                const osc = audioCtx.createOscillator();
                osc.type = oscType as OscillatorType;
                osc.frequency.setValueAtTime(frequency + (i / (i * parseFloat((document.getElementById('detune') as HTMLInputElement).value) - 4) - 1), audioCtx.currentTime);
                osc.connect(noteGain);
                osc.start();
                oscillators.push(osc);
            }
            activeOsc.set(event.key, { oscillators, gainNode: noteGain });

            lightKeys(event.key, true);
        }
    });

    document.addEventListener('keyup', async (event) => {
        if (activeOsc.has(event.key)) {
            const { oscillators, gainNode } = activeOsc.get(event.key);

            const releaseTime = parseFloat((document.getElementById('release') as HTMLInputElement).value); // in seconds

            gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
            gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
            if (audioCtx.currentTime + releaseTime < audioCtx.currentTime) {
                gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
            }
            else {
                gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + releaseTime);
            }

            setTimeout(() => {
                oscillators.forEach(osc => {
                    osc.stop();
                    osc.disconnect();
                });
                gainNode.disconnect();
                activeOsc.delete(event.key);
            }, releaseTime * 1000);

            lightKeys(event.key, false);
        }
    });
}

function applyADSR(gainNode: GainNode, attack: number, decay: number, sustain: number) {
    const volume: number = parseFloat((document.getElementById('volume') as HTMLInputElement).value);
    gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + attack);
    gainNode.gain.linearRampToValueAtTime(volume * sustain, audioCtx.currentTime + attack + decay);
}

function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

function lightKeys(key: string, activate: boolean) {
    if (activate) {
        let keyElement = document.querySelector(`div[data-note="${key}"]`);
        if (keyElement.classList.contains('white-key')) {
            keyElement.classList.add('white-key-active');
        } else if (keyElement.classList.contains('black-key')) {
            keyElement.classList.add('black-key-active');
        }
    }
    else {
        let keyElement = document.querySelector(`div[data-note="${key}"]`);
        if (keyElement.classList.contains('white-key')) {
            keyElement.classList.remove('white-key-active');
        } else if (keyElement.classList.contains('black-key')) {
            keyElement.classList.remove('black-key-active');
        }
    }
}