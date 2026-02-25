'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, FileText, Download, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';

interface Document {
    fileName: string;
    fileUrl: string;
    fileType: string;
}

interface DocumentCarouselModalProps {
    documents: Document[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function DocumentCarouselModal({
    documents,
    initialIndex,
    isOpen,
    onClose,
}: DocumentCarouselModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [isImage, setIsImage] = useState(false);

    useEffect(() => {
        setCurrentIndex(initialIndex);
        setZoom(1);
    }, [initialIndex, isOpen]);

    const currentDoc = documents[currentIndex];

    useEffect(() => {
        if (currentDoc) {
            const type = currentDoc.fileType.toLowerCase();
            setIsImage(type.includes('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(currentDoc.fileUrl.toLowerCase()));
        }
    }, [currentDoc]);

    const nextDoc = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % documents.length);
        setZoom(1);
    }, [documents.length]);

    const prevDoc = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + documents.length) % documents.length);
        setZoom(1);
    }, [documents.length]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === 'ArrowRight') nextDoc();
        if (e.key === 'ArrowLeft') prevDoc();
        if (e.key === 'Escape') onClose();
    }, [isOpen, nextDoc, prevDoc, onClose]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (isImage) {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoom(z => Math.min(3, Math.max(0.5, z + delta)));
            }
        }
    }, [isImage]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!isOpen || !currentDoc) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-dark-900/90 backdrop-blur-md animate-fade-in p-4 sm:p-8">
            {/* Header / Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white z-10 bg-gradient-to-b from-dark-950/50 to-transparent">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200"
                        title="Close (Esc)"
                    >
                        <X size={24} />
                    </button>
                    <div>
                        <h3 className="text-body font-semibold truncate max-w-[200px] sm:max-w-md">
                            {currentDoc.fileName}
                        </h3>
                        <p className="text-label-sm text-dark-400">
                            {currentIndex + 1} of {documents.length}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {isImage && (
                        <div className="hidden sm:flex items-center bg-white/10 rounded-lg px-2 mr-4">
                            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-2 hover:text-secondary-400 transition-colors"><ZoomOut size={20} /></button>
                            <span className="text-label-sm w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-2 hover:text-secondary-400 transition-colors"><ZoomIn size={20} /></button>
                        </div>
                    )}
                    <a
                        href={currentDoc.fileUrl}
                        download={currentDoc.fileName}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                        title="Download"
                    >
                        <Download size={20} />
                        <span className="hidden sm:inline text-label-sm">Download</span>
                    </a>
                    <a
                        href={currentDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                        title="Open in new tab"
                    >
                        <ExternalLink size={20} />
                    </a>
                </div>
            </div>

            {/* Navigation Buttons */}
            {documents.length > 1 && (
                <>
                    <button
                        onClick={prevDoc}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 backdrop-blur-sm border border-white/10 group"
                    >
                        <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={nextDoc}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 backdrop-blur-sm border border-white/10 group"
                    >
                        <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </>
            )}

            {/* Content Area */}
            <div
                className="relative w-full h-full flex items-center justify-center overflow-auto scrollbar-hide py-16"
                onWheel={handleWheel}
            >
                <div
                    className="transition-transform duration-300 ease-out flex items-center justify-center min-h-full min-w-full"
                    style={{ transform: `scale(${zoom})` }}
                >
                    {isImage ? (
                        <img
                            src={currentDoc.fileUrl}
                            alt={currentDoc.fileName}
                            className={`max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-scale-in transition-all duration-300 select-none ${zoom > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                            draggable={false}
                            onClick={() => setZoom(z => z > 1 ? 1 : 1.5)}
                        />
                    ) : currentDoc.fileType.includes('pdf') ? (
                        <div className="w-full h-full max-w-5xl bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col relative">
                            {/* Overlay to catch clicks and prevent iframe focus theft if needed */}
                            <iframe
                                src={`${currentDoc.fileUrl}#toolbar=0`}
                                className="w-full h-full border-none"
                                title={currentDoc.fileName}
                            />
                        </div>
                    ) : (
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 flex flex-col items-center justify-center text-white border border-white/10 max-w-sm text-center">
                            <div className="w-20 h-20 bg-secondary-500/20 rounded-full flex items-center justify-center mb-6 text-secondary-400">
                                <FileText size={48} />
                            </div>
                            <h4 className="text-h3 font-semibold mb-2">Unsupported Preview</h4>
                            <p className="text-dark-300 mb-8">
                                This file type ({currentDoc.fileType}) cannot be previewed directly.
                            </p>
                            <a
                                href={currentDoc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary w-full justify-center flex items-center space-x-2"
                            >
                                <ExternalLink size={18} />
                                <span>Open File</span>
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Thumbnail Indicator / Navigation */}
            {documents.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 bg-dark-950/60 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/10 max-w-[90vw] overflow-x-auto scrollbar-hide">
                    {documents.map((doc, idx) => {
                        const isDocImage = doc.fileType.toLowerCase().includes('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(doc.fileUrl.toLowerCase());
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    setCurrentIndex(idx);
                                    setZoom(1);
                                }}
                                className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 border-2 ${currentIndex === idx ? 'border-secondary-500 scale-110 shadow-glow-sm' : 'border-transparent opacity-50 hover:opacity-100'
                                    }`}
                            >
                                {isDocImage ? (
                                    <img src={doc.fileUrl} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full bg-dark-800 flex items-center justify-center text-white">
                                        <FileText size={20} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
