import { useState, useRef, useEffect } from 'react';
import { transposeText, getStepDifference, ALL_KEYS } from '../utils/transposer';
import { FileDown, RefreshCcw, ZoomIn, ZoomOut, Maximize, Printer, FileText, Play, Pause, X, Moon } from 'lucide-react';

interface ChordViewerProps {
    originalKey: string;
    chords: string;
    songTitle: string;
    leaderName: string;
    tempo?: string;
    youtubeLink?: string | null;
}

const ChordViewer = ({ originalKey, chords, songTitle, leaderName, tempo, youtubeLink }: ChordViewerProps) => {
    const [targetKey, setTargetKey] = useState(originalKey || 'C');
    const [layoutCols, setLayoutCols] = useState(1);
    const [fontSize, setFontSize] = useState(14);
    
    // Practice Mode State
    const [isPracticeMode, setIsPracticeMode] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(5);

    const printRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLPreElement>(null);
    const practiceContainerRef = useRef<HTMLDivElement>(null);
    const exactScrollTop = useRef(0);

    // Initialize layout columns based on text length to default smartly
    useEffect(() => {
        if (chords) {
            const lineCount = chords.split('\n').length;
            if (lineCount > 65 && !isPracticeMode) {
                setLayoutCols(2);
            }
        }
    }, [chords, isPracticeMode]);

    // Calculate step difference and transpose text
    const stepDiff = getStepDifference(originalKey || 'C', targetKey);
    const transposedChordsRaw = transposeText(chords, stepDiff);
    
    // Auto-format: remove trailing spaces and replace 3+ consecutive newlines with 2 (1 blank line)
    const transposedChords = transposedChordsRaw
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // Auto-scroll logic for Practice Mode
    useEffect(() => {
        let animationFrameId: number;
        let lastTime = performance.now();

        const scroll = (time: number) => {
            if (!isPlaying || !isPracticeMode || !practiceContainerRef.current) return;
            
            const deltaTime = time - lastTime;
            lastTime = time;

            // Speed factor based on slider (1-10)
            const pixelsPerSecond = scrollSpeed * 8; 
            const scrollAmount = (pixelsPerSecond * deltaTime) / 1000;
            
            const container = practiceContainerRef.current;
            
            // Use exact float for tracking so slow speeds don't get rounded down to 0
            exactScrollTop.current += scrollAmount;
            container.scrollTop = exactScrollTop.current;
            
            // Auto-stop when reaching bottom
            if (Math.ceil(container.scrollTop + container.clientHeight) >= container.scrollHeight) {
                setIsPlaying(false);
                return;
            }
            
            animationFrameId = requestAnimationFrame(scroll);
        };

        if (isPlaying && isPracticeMode) {
            lastTime = performance.now();
            if (practiceContainerRef.current) {
                exactScrollTop.current = practiceContainerRef.current.scrollTop;
            }
            animationFrameId = requestAnimationFrame(scroll);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isPlaying, isPracticeMode, scrollSpeed]);

    // Calculate BPM
    const bpmMatch = tempo?.match(/(\d+)/);
    const bpm = bpmMatch ? parseInt(bpmMatch[1], 10) : 0;
    const beatDuration = bpm > 0 ? 60 / bpm : 1;

    // Quick Transpose
    const handleTranspose = (direction: 'up' | 'down') => {
        const currentIndex = ALL_KEYS.indexOf(targetKey);
        if (currentIndex === -1) return;
        let newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex >= ALL_KEYS.length) newIndex = 0;
        if (newIndex < 0) newIndex = ALL_KEYS.length - 1;
        setTargetKey(ALL_KEYS[newIndex]);
    };

    const handleExportPDF = () => {
        const originalTitle = document.title;
        document.title = `${songTitle} - ${targetKey} (${leaderName})`;

        alert("To save as a high-quality PDF:\n\n1. In the Print dialog, change the 'Destination' dropdown to 'Save as PDF'.");

        setTimeout(() => {
            window.print();
            document.title = originalTitle;
        }, 50);
    };

    const handleExportWord = () => {
        const isLandscape = layoutCols === 3;
        const fontSize = layoutCols === 3 ? '8.5pt' : (layoutCols === 2 ? '9.5pt' : '11pt');

        const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>${songTitle}</title>
            <style>
                @page Section1 {
                    size: ${isLandscape ? '11.0in 8.5in' : '8.5in 11.0in'};
                    mso-page-orientation: ${isLandscape ? 'landscape' : 'portrait'};
                    margin: 0.5in 0.5in 0.5in 0.5in;
                }
                @page Section2 {
                    size: ${isLandscape ? '11.0in 8.5in' : '8.5in 11.0in'};
                    mso-page-orientation: ${isLandscape ? 'landscape' : 'portrait'};
                    margin: 0.5in 0.5in 0.5in 0.5in;
                    mso-columns: ${layoutCols} even 0.3in;
                }
                div.Section1 { page: Section1; }
                div.Section2 { page: ${layoutCols > 1 ? 'Section2' : 'Section1'}; }
            </style>
        </head><body>`;
        const footer = "</body></html>";

        const chordsContent = transposedChords.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>").replace(/ /g, "&nbsp;");
        
        const chordsHtml = `<div style="font-family: 'Courier New', Courier, monospace; font-size: ${fontSize}; white-space: pre-wrap; line-height: 1.2; column-count: ${layoutCols}; column-gap: 3rem;">
${chordsContent}
        </div>`;

        const content = `
            <div class="Section1" style="font-family: Arial, sans-serif;">
                <h1 style="font-size: 24pt; margin-bottom: 4pt;">${songTitle}</h1>
                <p style="color: #666; font-size: 11pt; margin-top: 0;">Leader: <strong>${leaderName}</strong> &nbsp;|&nbsp; Key: <strong>${targetKey}</strong></p>
                <hr style="border: 1px solid #ccc; margin-bottom: 16pt;" />
            </div>
            <div class="${layoutCols > 1 ? 'Section2' : 'Section1'}">
                ${chordsHtml}
            </div>
        `;

        const sourceHTML = header + content + footer;
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);

        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `${songTitle} - ${targetKey} (${leaderName}).doc`;
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    const handleAutoFit = () => {
        if (!contentRef.current) return;

        let optimumSize = 16;
        contentRef.current.style.fontSize = `${optimumSize}px`;

        while ((contentRef.current.scrollHeight > 850 || contentRef.current.scrollWidth > contentRef.current.clientWidth) && optimumSize > 9) {
            optimumSize -= 0.5;
            contentRef.current.style.fontSize = `${optimumSize}px`;
        }

        setFontSize(Math.max(9, optimumSize));
    };

    // Prepare chords HTML: split by double newlines into stanzas to prevent page breaks inside stanzas when printing
    const parsedChordsHtml = transposedChords
        .split('\n\n')
        .map(stanza => {
            const htmlStanza = stanza
                .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                .replace(/\[(.*?)\]/g, '<span class="chord">[$1]</span>'); // Chord Highlighting
            return `<div class="stanza" style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 1.5em;">${htmlStanza}</div>`;
        })
        .join('');

    if (isPracticeMode) {
        const ytId = youtubeLink ? youtubeLink.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/) : null;
        const videoId = (ytId && ytId[2].length === 11) ? ytId[2] : null;

        return (
            <div className="fixed inset-0 z-50 bg-[#111] text-gray-200 flex flex-col">
                {/* Practice Mode Header Controls */}
                <div className="bg-[#1a1a1a] p-4 border-b border-gray-800 flex flex-wrap gap-4 items-center justify-between shrink-0 shadow-lg">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => { setIsPracticeMode(false); setIsPlaying(false); }} className="text-gray-400 hover:text-white transition-colors p-2 bg-[#222] rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">{songTitle}</h2>
                            <p className="text-sm text-gray-400">Key: {targetKey} • {leaderName} {tempo ? `• ${tempo}` : ''}</p>
                        </div>
                    </div>

                    {/* Quick Transpose Controls */}
                    <div className="flex items-center space-x-1 bg-[#222] px-2 py-1 rounded-lg">
                        <button onClick={() => handleTranspose('down')} className="p-1.5 text-gray-400 hover:text-white rounded font-bold font-mono">-</button>
                        <span className="text-sm w-8 text-center font-bold text-[var(--accent)]">{targetKey}</span>
                        <button onClick={() => handleTranspose('up')} className="p-1.5 text-gray-400 hover:text-white rounded font-bold font-mono">+</button>
                    </div>
                    
                    {/* Auto-Scroll Controls */}
                    <div className="flex items-center space-x-4 bg-[#222] px-4 py-2 rounded-xl">
                        {bpm > 0 && (
                            <div className="flex items-center space-x-2 mr-2">
                                <div className={`metronome-dot ${isPlaying ? 'metronome-active' : ''}`} style={{ animationDuration: `${beatDuration}s` }} />
                            </div>
                        )}
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="bg-[var(--accent)] hover:bg-[#d4b55c] text-black p-2 rounded-full transition-colors shadow-sm"
                        >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current pl-0.5" />}
                        </button>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Speed</span>
                            <input 
                                type="range" 
                                min="1" max="10" 
                                value={scrollSpeed} 
                                onChange={(e) => setScrollSpeed(Number(e.target.value))}
                                className="w-24 accent-[var(--accent)]"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 bg-[#222] px-2 py-1 rounded-lg">
                            <button onClick={() => setFontSize(s => Math.max(12, s - 2))} className="p-1.5 text-gray-400 hover:text-white rounded" title="Decrease Font">
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-sm w-8 text-center font-mono">{fontSize}</span>
                            <button onClick={() => setFontSize(s => Math.min(48, s + 2))} className="p-1.5 text-gray-400 hover:text-white rounded" title="Increase Font">
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div 
                    ref={practiceContainerRef}
                    className="flex-1 overflow-y-auto p-4 sm:p-8 pb-64 relative"
                    style={{
                        maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 85%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 85%, transparent 100%)'
                    }}
                >
                    <pre
                        ref={contentRef}
                        className="font-mono leading-tight whitespace-pre-wrap max-w-4xl mx-auto chord-content practice-theme"
                        style={{
                            fontSize: `${fontSize}px`,
                        }}
                    >
                        <div dangerouslySetInnerHTML={{ __html: parsedChordsHtml }}></div>
                    </pre>
                </div>

                <style>{`
                    .practice-theme .chord {
                        color: var(--accent);
                        font-weight: 700;
                    }
                    @keyframes pulse-metronome {
                        0% { opacity: 1; transform: scale(1.2); }
                        20% { opacity: 0.3; transform: scale(1); }
                        100% { opacity: 0.3; transform: scale(1); }
                    }
                    .metronome-dot {
                        width: 8px; height: 8px; border-radius: 50%; background: var(--accent); opacity: 0.3;
                    }
                    .metronome-active {
                        animation-name: pulse-metronome;
                        animation-iteration-count: infinite;
                        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                    }
                `}</style>

                {videoId && (
                    <div className="fixed bottom-6 right-6 z-50 w-80 h-48 rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-black">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=0`} 
                            title="YouTube video player" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 mt-6 overflow-hidden print:shadow-none print:border-none print:m-0 print:rounded-none print:overflow-visible">
            <div className="p-3 sm:p-4 bg-gray-50 border-b flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-center justify-between print:hidden">

                {/* Key Controls */}
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Key:</label>
                        <select
                            value={targetKey}
                            onChange={(e) => setTargetKey(e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 bg-white min-w-[60px]"
                        >
                            {ALL_KEYS.map(k => (
                                <option key={k} value={k}>{k}</option>
                            ))}
                        </select>
                    </div>
                    {targetKey !== originalKey && (
                        <button
                            onClick={() => setTargetKey(originalKey)}
                            className="text-xs flex items-center text-gray-500 hover:text-blue-600 transition-colors bg-white px-2 py-1 rounded-md border border-gray-200"
                            title="Reset to Original Key"
                        >
                            <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Reset
                        </button>
                    )}
                </div>

                {/* Layout Controls */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-white px-3 py-1.5 border border-gray-200 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
                    <div className="hidden sm:flex items-center space-x-2">
                        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Columns:</label>
                        <select
                            value={layoutCols}
                            onChange={(e) => setLayoutCols(Number(e.target.value))}
                            className="border-none bg-transparent text-sm focus:ring-0 cursor-pointer"
                        >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                        </select>
                    </div>

                    <div className="hidden sm:block w-px h-5 bg-gray-200"></div>

                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Text:</label>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setFontSize(s => Math.max(8, s - 1))} className="p-1 text-gray-500 hover:text-gray-900 rounded hover:bg-gray-100" title="Decrease Font">
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-sm w-6 text-center">{fontSize}</span>
                            <button onClick={() => setFontSize(s => Math.min(24, s + 1))} className="p-1 text-gray-500 hover:text-gray-900 rounded hover:bg-gray-100" title="Increase Font">
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="hidden sm:block w-px h-5 bg-gray-200"></div>

                    <button
                        onClick={handleAutoFit}
                        className="hidden sm:flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors pr-2"
                        title="Auto-fit to 1 page"
                    >
                        <Maximize className="w-4 h-4 mr-1" /> Auto-Fit
                    </button>
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center gap-2 ml-0 sm:ml-auto w-full sm:w-auto justify-center sm:justify-start">
                    <button
                        onClick={() => {
                            setIsPracticeMode(true);
                            setFontSize(18); // Bump font size up for practice mode
                            setLayoutCols(1); // Force single column for scrolling
                        }}
                        className="bg-[#111] hover:bg-black text-[var(--accent)] px-3 py-1.5 rounded-lg flex items-center space-x-2 text-sm transition-colors shadow-sm font-semibold"
                        title="Enter Practice Mode"
                    >
                        <Moon className="w-4 h-4" />
                        <span className="hidden sm:inline">Practice Mode</span>
                    </button>
                    
                    <div className="w-px h-5 bg-gray-300 mx-1"></div>

                    <button
                        onClick={handleExportWord}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex items-center space-x-2 text-sm transition-colors shadow-sm border border-blue-200"
                        title="Export to MS Word"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg flex items-center space-x-2 text-sm transition-colors shadow-sm border border-gray-300"
                        title="Print"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="bg-gray-800 hover:bg-black text-white px-3 py-1.5 rounded-lg flex items-center space-x-2 text-sm transition-colors shadow-sm"
                        title="Download PDF"
                    >
                        <FileDown className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-4 sm:p-8 overflow-x-auto bg-white border-t border-gray-100 print:p-0 print:overflow-visible">
                <div ref={printRef} className="print-container mx-auto min-h-[500px] max-w-4xl print:max-w-none print:min-h-0">

                    {/* Header: visible in print & PDF */}
                    <div className="mb-8 flex justify-between items-start print:mb-6">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-[var(--bg-surface)] m-0 leading-tight mb-2">{songTitle}</h1>
                            <div className="text-[13.5px] text-[#6a6560] flex items-center gap-2">
                                <span>Leader: <strong className="text-[var(--bg-surface)]">{leaderName}</strong></span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[13px] font-bold text-[#8a6d2f] bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] rounded-full px-4 py-1.5">
                                Key of {targetKey}
                            </div>
                        </div>
                    </div>

                    {/* The rendered chords */}
                    <style>{`
                        @media (max-width: 639px) {
                            .chord-content {
                                column-count: 1 !important;
                            }
                        }
                    `}</style>
                    <pre 
                        ref={contentRef}
                        className="leading-tight text-[#1a1814] whitespace-pre-wrap chord-content light-theme max-w-4xl mx-auto"
                        style={{
                            fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
                            columnCount: layoutCols,
                            columnGap: '3rem',
                            fontSize: `${fontSize}px`,
                            columnFill: 'auto',
                            maxHeight: layoutCols > 1 ? '850px' : 'none',
                        }}
                    >
                        <div dangerouslySetInnerHTML={{ __html: parsedChordsHtml }}></div>
                    </pre>
                </div>
            </div>

            <style>{`
                .light-theme .chord {
                    color: #b48c2b; /* Slightly darker gold for light mode */
                    font-weight: 700;
                }
                @media print {
                    @page { 
                        margin: 15mm;
                    }
                    /* Hide all UI Chrome */
                    .sidebar, .mobile-header, .main-topbar, .back-link, .song-hero, .section-header, .version-card-header, .version-pills, .version-notes {
                        display: none !important;
                    }
                    
                    /* Flatten the DOM structure visually for print */
                    body, #root, .layout-root, .main-area, .main-content, .content-inner, .sd-page, .versions-grid, .version-card, .version-card-body {
                        display: block !important;
                        position: static !important;
                        background: white !important;
                        border: none !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        overflow: visible !important;
                        height: auto !important;
                        min-height: 0 !important;
                    }
                    
                    .print-container {
                        position: static !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        width: 100% !important;
                        max-width: none !important;
                        background: white !important;
                        overflow: visible !important;
                    }
                    
                    .chord-content {
                        color: #000 !important;
                        /* Allow multi-page printing: remove max height and let the browser paginate naturally */
                        max-height: none !important;
                        column-fill: balance !important;
                    }
                    .chord-content .chord {
                        color: #000 !important; 
                        font-weight: bold !important;
                    }
                    .chord-content > div {
                        break-inside: auto;
                    }
                }
            `}</style>
        </div>
    );
};

export default ChordViewer;
