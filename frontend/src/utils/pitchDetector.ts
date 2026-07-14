import { useState, useEffect, useRef, useCallback } from 'react';
import { YIN } from 'pitchfinder';

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getNoteFromFrequency(frequency: number): string {
    const noteNum = 12 * (Math.log2(frequency / 440)) + 69;
    const roundedNoteNum = Math.round(noteNum);
    return notes[roundedNoteNum % 12];
}

export function usePitchDetector() {
    const [isListening, setIsListening] = useState(false);
    const [currentNote, setCurrentNote] = useState<string>('--');
    const [error, setError] = useState<string>('');

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const detectPitchRef = useRef<((float32Array: Float32Array) => number | null) | null>(null);

    const onNoteDetectedRef = useRef<((note: string) => void) | null>(null);

    const startListening = useCallback(async (onNoteDetected: (note: string) => void) => {
        try {
            onNoteDetectedRef.current = onNoteDetected;
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: false,
                } 
            });
            
            streamRef.current = stream;
            
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;
            
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            
            detectPitchRef.current = YIN({ sampleRate: audioContext.sampleRate });
            
            setIsListening(true);
            setError('');
            
            const buffer = new Float32Array(analyser.fftSize);
            
            const processAudio = () => {
                if (!analyserRef.current || !detectPitchRef.current) return;
                
                analyserRef.current.getFloatTimeDomainData(buffer);
                const pitch = detectPitchRef.current(buffer);
                
                if (pitch && pitch > 50 && pitch < 2000) { // filter out extreme highs/lows
                    const note = getNoteFromFrequency(pitch);
                    setCurrentNote(note);
                    if (onNoteDetectedRef.current) {
                        onNoteDetectedRef.current(note);
                    }
                }
                
                animationFrameRef.current = requestAnimationFrame(processAudio);
            };
            
            processAudio();
            
        } catch (err: any) {
            setError(err.message || 'Microphone access denied or unavailable.');
            setIsListening(false);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setIsListening(false);
        setCurrentNote('--');
    }, []);

    useEffect(() => {
        return () => {
            stopListening();
        };
    }, [stopListening]);

    return {
        isListening,
        currentNote,
        error,
        startListening,
        stopListening
    };
}
