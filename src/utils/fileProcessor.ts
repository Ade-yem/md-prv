import { DocumentFile } from "../types";
import { detectFileType, isBinary } from "./fileType";

export const processFile = (
    file: File,
    onComplete: (newFile: DocumentFile) => void
): void => {
    const fileType = detectFileType(file.name);
    const newId = Date.now().toString();

    if (isBinary(fileType)) {
        // Handle binary files (PDF, Word)
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            const arrayBuffer = e.target?.result;
            if (arrayBuffer instanceof ArrayBuffer) {
                // Convert to base64 for storage in chunks to avoid stack overflow
                const uint8Array = new Uint8Array(arrayBuffer);
                let binaryString = "";
                const chunkSize = 8192; // Process in 8KB chunks
                for (let i = 0; i < uint8Array.length; i += chunkSize) {
                    const chunk = uint8Array.subarray(i, i + chunkSize);
                    binaryString += String.fromCharCode.apply(null, Array.from(chunk));
                }
                const base64 = btoa(binaryString);
                const newFile: DocumentFile = {
                    id: newId,
                    name: file.name,
                    content: `data:application/octet-stream;base64,${base64}`,
                    fileType,
                    rawData: arrayBuffer,
                };
                onComplete(newFile);
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        // Handle text files (Markdown, RTF)
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            const text = e.target?.result;
            if (typeof text === "string") {
                const newFile: DocumentFile = {
                    id: newId,
                    name: file.name,
                    content: text,
                    fileType,
                };
                onComplete(newFile);
            }
        };
        reader.readAsText(file);
    }
};

