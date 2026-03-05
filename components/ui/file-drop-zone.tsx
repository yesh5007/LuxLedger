"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileType, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
    onFileSelected: (file: File) => void;
    accept?: string;
    maxSizeMB?: number;
    className?: string;
}

export function FileDropZone({
    onFileSelected,
    accept = "image/*,application/pdf",
    maxSizeMB = 5,
    className
}: FileDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const processFile = (file: File) => {
        setError(null);

        // Size validation
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
            return;
        }

        setSelectedFile(file);
        onFileSelected(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className={cn("w-full", className)}>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center",
                    isDragging
                        ? "border-amber-500 bg-amber-50/50"
                        : selectedFile
                            ? "border-green-500 bg-green-50/30"
                            : "border-slate-300 hover:border-slate-400 hover:bg-slate-50",
                    error && "border-red-400 bg-red-50/50"
                )}
            >
                <input
                    type="file"
                    ref={inputRef}
                    onChange={handleChange}
                    className="hidden"
                    accept={accept}
                />

                {selectedFile ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="font-medium text-slate-900 truncate max-w-[200px]">
                            {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                            onClick={clearFile}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center mb-4 transition-colors",
                            isDragging ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                        )}>
                            <UploadCloud className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">
                            {isDragging ? "Drop file to upload" : "Select or drag file"}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4 max-w-xs leading-relaxed">
                            Upload a high-resolution photo or PDF scan of the asset certificate, receipt, or ID card.
                        </p>
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                            <div className="flex items-center"><FileType className="w-3 h-3 mr-1" /> PDF, JPG, PNG</div>
                            <div>Max {maxSizeMB}MB</div>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-sm text-red-500 mt-2 text-center animate-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
}
