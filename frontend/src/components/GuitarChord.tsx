import React from 'react';
import type { GuitarFret } from '../utils/chordDictionaries';

interface GuitarChordProps {
    chordName: string;
    fingering: GuitarFret[];
}

const GuitarChord: React.FC<GuitarChordProps> = ({ chordName, fingering }) => {
    // 6 strings: index 0 to 5
    const numStrings = 6;
    const numFrets = 4; // We display a 4-fret span

    const playedFrets = fingering.filter(f => typeof f === 'number' && f > 0) as number[];
    const minFret = playedFrets.length > 0 ? Math.min(...playedFrets) : 1;
    const maxFret = playedFrets.length > 0 ? Math.max(...playedFrets) : 4;

    let startFret = 1;
    if (maxFret > 4) {
        // Center the frets around the minFret
        startFret = minFret > 1 ? minFret - 1 : minFret;
        // Ensure it fits 4 frets
        if (maxFret - startFret > 3) {
            startFret = maxFret - 3;
        }
    }

    const width = 60;
    const height = 70;
    const paddingX = 10;
    const paddingY = 15;
    
    const stringSpacing = width / (numStrings - 1);
    const fretSpacing = height / numFrets;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 8px' }}>
            <span style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#1a1814' }}>{chordName}</span>
            <svg width={width + paddingX * 2} height={height + paddingY * 2} style={{ overflow: 'visible' }}>
                <g transform={`translate(${paddingX}, ${paddingY})`}>
                    {/* Draw Nut or Top Fret */}
                    {startFret === 1 ? (
                        <line x1={0} y1={0} x2={width} y2={0} stroke="#1a1814" strokeWidth={3} />
                    ) : (
                        <text x={-10} y={fretSpacing / 2 + 4} fontSize={10} fill="#8a8680" textAnchor="end">
                            {startFret}fr
                        </text>
                    )}

                    {/* Draw Frets (horizontal lines) */}
                    {[...Array(numFrets + 1)].map((_, i) => (
                        <line 
                            key={`fret-${i}`} 
                            x1={0} y1={i * fretSpacing} 
                            x2={width} y2={i * fretSpacing} 
                            stroke={startFret === 1 && i === 0 ? "transparent" : "#b0aba5"} 
                            strokeWidth={1} 
                        />
                    ))}

                    {/* Draw Strings (vertical lines) */}
                    {[...Array(numStrings)].map((_, i) => (
                        <line 
                            key={`string-${i}`} 
                            x1={i * stringSpacing} y1={0} 
                            x2={i * stringSpacing} y2={height} 
                            stroke="#b0aba5" 
                            strokeWidth={1} 
                        />
                    ))}

                    {/* Draw fingerings and open/muted strings */}
                    {fingering.map((fret, stringIndex) => {
                        const x = stringIndex * stringSpacing;
                        
                        if (fret === 'x') {
                            return (
                                <text key={`f-${stringIndex}`} x={x} y={-5} fontSize={10} fill="#dc2626" textAnchor="middle">×</text>
                            );
                        } else if (fret === 0) {
                            return (
                                <circle key={`f-${stringIndex}`} cx={x} cy={-8} r={3} fill="none" stroke="#8a8680" strokeWidth={1} />
                            );
                        } else {
                            // Calculate position relative to startFret
                            const relativeFret = fret - startFret;
                            const y = (relativeFret * fretSpacing) + (fretSpacing / 2);
                            return (
                                <circle key={`f-${stringIndex}`} cx={x} cy={y} r={4.5} fill="#1a1814" />
                            );
                        }
                    })}
                </g>
            </svg>
        </div>
    );
};

export default GuitarChord;
