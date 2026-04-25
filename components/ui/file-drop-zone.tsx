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
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File exceeds ${maxSizeMB}MB limit.`);
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
                    "relative border border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer",
                    isDragging
                        ? "border-foreground/30 bg-foreground/[0.03]"
                        : selectedFile
                            ? "border-emerald-500/40 bg-emerald-500/[0.04]"
                            : "border-border hover:border-foreground/20 hover:bg-foreground/[0.02]",
                    error && "border-red-500/40 bg-red-500/[0.04]"
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
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-foreground truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB — ready for processing
                            </p>
                        </div>
                        <button
                            onClick={clearFile}
                            className="p-1 rounded hover:bg-foreground/[0.06] text-muted-foreground transition-colors duration-150 shrink-0"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <UploadCloud className={cn(
                            "h-5 w-5 shrink-0 transition-colors duration-150",
                            isDragging ? "text-foreground" : "text-muted-foreground"
                        )} />
                        <div>
                            <p className="text-[13px] font-medium text-foreground">
                                {isDragging ? "Drop to upload" : "Drop a file or click to browse"}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                PDF, JPG, PNG — up to {maxSizeMB}MB
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-[12px] text-red-600 dark:text-red-400 mt-2">
                    {error}
                </p>
            )}
        </div>
    );
}
