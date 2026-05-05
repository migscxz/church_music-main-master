import { useState, useRef, useEffect } from 'react';
import { transposeText, getStepDifference, ALL_KEYS } from '../utils/transposer';
import { FileDown, RefreshCcw, ZoomIn, ZoomOut, Maximize, Printer, FileText } from 'lucide-react';

interface ChordViewerProps {
    originalKey: string;
    chords: string;
    songTitle: string;
    leaderName: string;
}

const ChordViewer = ({ originalKey, chords, songTitle, leaderName }: ChordViewerProps) => {
    const [targetKey, setTargetKey] = useState(originalKey || 'C');
    const [layoutCols, setLayoutCols] = useState(1);
    const [fontSize, setFontSize] = useState(14);
    const printRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLPreElement>(null);

    // Initialize layout columns based on text length to default smartly
    useEffect(() => {
        if (chords) {
            const lineCount = chords.split('\n').length;
            if (lineCount > 65) {
                setLayoutCols(2);
            }
        }
    }, [chords]);

    // Calculate step difference and transpose text
    const stepDiff = getStepDifference(originalKey || 'C', targetKey);
    const transposedChords = transposeText(chords, stepDiff);

    const handleExportPDF = () => {
        // We use native browser printing for PDF to preserve Vector text and CSS Columns
        const originalTitle = document.title;
        document.title = `${songTitle} - ${targetKey} (${leaderName})`;

        alert("To save as a high-quality PDF:\n\n1. In the Print dialog, change the 'Destination' dropdown to 'Save as PDF'.");

        setTimeout(() => {
            window.print();
            document.title = originalTitle;
        }, 50);
    };

    const handleExportWord = () => {
        // Construct a simple HTML document that MS Word can interpret
        const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${songTitle}</title></head><body>`;
        const footer = "</body></html>";

        // Use inline styles compatible with Word to preserve whitespace and monospacing
        const content = `
            <div style="font-family: Arial, sans-serif;">
                <h1 style="font-size: 24pt; margin-bottom: 4pt;">${songTitle}</h1>
                <p style="color: #666; font-size: 11pt; margin-top: 0;">Leader: <strong>${leaderName}</strong> &nbsp;|&nbsp; Key: <strong>${targetKey}</strong></p>
                <hr style="border: 1px solid #ccc; margin-bottom: 16pt;" />
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 11pt; white-space: pre-wrap; line-height: 1.2;">
${transposedChords.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>").replace(/ /g, "&nbsp;")}
                </div>
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
        // Simple heuristic: reduce font size to fit within an assumed 950px height
        if (!contentRef.current) return;

        let optimumSize = 16;
        contentRef.current.style.fontSize = `${optimumSize}px`;

        while (contentRef.current.scrollHeight > 850 && optimumSize > 9) {
            optimumSize -= 0.5;
            contentRef.current.style.fontSize = `${optimumSize}px`;
        }

        setFontSize(Math.max(9, optimumSize));
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 mt-6 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-4 items-center justify-between">

                {/* Key Controls */}
                <div className="flex items-center space-x-3">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Key:</label>
                    <select
                        value={targetKey}
                        onChange={(e) => setTargetKey(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white min-w-[60px]"
                    >
                        {ALL_KEYS.map(k => (
                            <option key={k} value={k}>{k}</option>
                        ))}
                    </select>
                    {targetKey !== originalKey && (
                        <button
                            onClick={() => setTargetKey(originalKey)}
                            className="text-xs flex items-center text-gray-500 hover:text-blue-600 transition-colors"
                            title="Reset to Original Key"
                        >
                            <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Reset
                        </button>
                    )}
                </div>

                {/* Layout Controls */}
                <div className="flex flex-wrap items-center space-x-4 bg-white px-3 py-1 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2">
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

                    <div className="w-px h-5 bg-gray-200"></div>

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

                    <div className="w-px h-5 bg-gray-200"></div>

                    <button
                        onClick={handleAutoFit}
                        className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        title="Auto-fit to 1 page"
                    >
                        <Maximize className="w-4 h-4 mr-1" /> Auto-Fit
                    </button>
                </div>

                {/* Export Controls */}
                <div className="flex items-center space-x-2 ml-auto">
                    <button
                        onClick={handleExportWord}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex items-center space-x-2 text-sm transition-colors shadow-sm border border-blue-200"
                        title="Export to MS Word"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">Word</span>
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg flex items-center space-x-2 text-sm transition-colors shadow-sm border border-gray-300"
                        title="Print"
                    >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">Print</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="bg-gray-800 hover:bg-black text-white px-3 py-1.5 rounded-lg flex items-center space-x-2 text-sm transition-colors shadow-sm"
                        title="Download PDF"
                    >
                        <FileDown className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                </div>
            </div>

            <div className="p-6 overflow-x-auto bg-[#fafafa]">
                <div ref={printRef} className="print-container bg-white p-6 shadow-[0_0_15px_rgba(0,0,0,0.05)] mx-auto border border-gray-100 min-h-[500px] max-w-4xl relative">

                    {/* Header: visible in print & PDF */}
                    <div className="mb-4 pb-3 border-b-2 border-gray-200 flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-gray-900 m-0 leading-tight">{songTitle}</h1>
                            <div className="text-sm text-gray-500 mt-1 flex gap-3">
                                <span>Leader: <strong className="text-gray-700">{leaderName}</strong></span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-gray-800 border border-gray-300 rounded px-3 py-1 bg-gray-50">
                                Key: {targetKey}
                            </div>
                        </div>
                    </div>

                    {/* The rendered chords */}
                    <pre
                        ref={contentRef}
                        className="font-mono leading-snug text-gray-900 whitespace-pre-wrap chord-content"
                        style={{
                            columnCount: layoutCols,
                            columnGap: '3rem',
                            fontSize: `${fontSize}px`,
                            breakInside: 'avoid'
                        }}
                    >
                        <div dangerouslySetInnerHTML={{
                            __html: transposedChords
                                .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                        }}
                            style={{ widows: 4, orphans: 4 }}></div>
                    </pre>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { 
                        margin: 0; /* Remove browser headers/footers */
                        size: portrait;
                    }
                    body * {
                        visibility: hidden;
                    }
                    /* Hide EVERYTHING outside print container */
                    .print-container, .print-container * {
                        visibility: visible;
                    }
                    .print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        /* Enforce strict strict 1-page layout per user preference */
                        max-height: 100vh;
                        overflow: hidden;
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 10mm !important; /* Add padding here so printer doesn't cut off text */
                        margin: 0 !important;
                    }
                    /* Force chord content colors */
                    .chord-content {
                        color: #000 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ChordViewer;
