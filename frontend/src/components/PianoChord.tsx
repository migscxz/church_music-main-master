import React from 'react';

interface PianoChordProps {
    chordName: string;
    notes: number[]; // Array of keys to press (0-23)
}

const PianoChord: React.FC<PianoChordProps> = ({ chordName, notes }) => {
    // 2 octaves starting from C
    // 14 white keys, 10 black keys
    
    const keyWidth = 12;
    const keyHeight = 40;
    const blackKeyWidth = 8;
    const blackKeyHeight = 24;
    
    // Map of all 24 keys. index: { type: 'white' | 'black', position: X }
    const keys = [];
    let whiteIndex = 0;
    
    for (let i = 0; i < 24; i++) {
        const octaveNote = i % 12;
        const isBlack = [1, 3, 6, 8, 10].includes(octaveNote);
        
        if (isBlack) {
            keys.push({
                index: i,
                isBlack: true,
                x: (whiteIndex * keyWidth) - (blackKeyWidth / 2)
            });
        } else {
            keys.push({
                index: i,
                isBlack: false,
                x: whiteIndex * keyWidth
            });
            whiteIndex++;
        }
    }

    const totalWidth = 14 * keyWidth;
    const totalHeight = keyHeight;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 8px' }}>
            <span style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#1a1814' }}>{chordName}</span>
            <svg width={totalWidth + 2} height={totalHeight + 2} style={{ overflow: 'visible' }}>
                <g transform="translate(1, 1)">
                    {/* Draw White Keys First */}
                    {keys.filter(k => !k.isBlack).map((k) => {
                        const isPressed = notes.includes(k.index);
                        return (
                            <rect
                                key={`key-${k.index}`}
                                x={k.x}
                                y={0}
                                width={keyWidth}
                                height={keyHeight}
                                fill={isPressed ? '#c9a84c' : '#ffffff'}
                                stroke="#b0aba5"
                                strokeWidth={1}
                                rx={2}
                            />
                        );
                    })}

                    {/* Draw Black Keys on Top */}
                    {keys.filter(k => k.isBlack).map((k) => {
                        const isPressed = notes.includes(k.index);
                        return (
                            <rect
                                key={`key-${k.index}`}
                                x={k.x}
                                y={0}
                                width={blackKeyWidth}
                                height={blackKeyHeight}
                                fill={isPressed ? '#c9a84c' : '#1a1814'}
                                rx={1}
                            />
                        );
                    })}
                    
                    {/* Draw little dot on pressed notes for extra clarity */}
                    {keys.map((k) => {
                        const isPressed = notes.includes(k.index);
                        if (!isPressed) return null;
                        
                        const dotY = k.isBlack ? blackKeyHeight - 6 : keyHeight - 8;
                        const dotX = k.x + (k.isBlack ? blackKeyWidth / 2 : keyWidth / 2);
                        
                        return (
                            <circle 
                                key={`dot-${k.index}`} 
                                cx={dotX} 
                                cy={dotY} 
                                r={k.isBlack ? 1.5 : 2} 
                                fill={k.isBlack && !isPressed ? '#fff' : (k.isBlack ? '#1a1814' : '#fff')} 
                            />
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};

export default PianoChord;
