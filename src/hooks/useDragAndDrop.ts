import { useState, useCallback } from "react";
import { processFile } from "../utils/fileProcessor";
import { DocumentFile } from "../types";

interface UseDragAndDropProps {
    onFileProcessed: (file: DocumentFile) => void;
}

export const useDragAndDrop = ({ onFileProcessed }: UseDragAndDropProps) => {
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) {
            setIsDragging(true);
        }
    }, [isDragging]);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set dragging to false if we're actually leaving the main container
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            // Process the first file
            processFile(droppedFiles[0], onFileProcessed);
        }
    }, [onFileProcessed]);

    return {
        isDragging,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
};

