import { useCallback, useRef } from "react";
import { DocumentFile } from "../types";
import { isBinary } from "../utils/fileType";
import { processFile } from "../utils/fileProcessor";

interface UseFileManagementProps {
    files: DocumentFile[];
    activeFileId: string;
    setFiles: React.Dispatch<React.SetStateAction<DocumentFile[]>>;
    setActiveFileId: React.Dispatch<React.SetStateAction<string>>;
}

export const useFileManagement = ({
    files,
    activeFileId,
    setFiles,
    setActiveFileId,
}: UseFileManagementProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpdateContent = useCallback(
        (newContent: string) => {
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === activeFileId ? { ...f, content: newContent } : f
                )
            );
        },
        [activeFileId, setFiles]
    );

    const handleUpdateName = useCallback(
        (newName: string) => {
            setFiles((prev) =>
                prev.map((f) => (f.id === activeFileId ? { ...f, name: newName } : f))
            );
        },
        [activeFileId, setFiles]
    );

    const handleNewFile = useCallback(() => {
        const newId = Date.now().toString();
        const newFile: DocumentFile = {
            id: newId,
            name: "Untitled.md",
            content: "",
            fileType: "markdown",
        };
        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newId);
    }, [setFiles, setActiveFileId]);

    const handleCloseFile = useCallback(
        (e: React.MouseEvent, idToDelete: string) => {
            e.stopPropagation();

            if (files.length === 1) {
                const newId = Date.now().toString();
                setFiles([
                    {
                        id: newId,
                        name: "Untitled.md",
                        content: "",
                        fileType: "markdown",
                    },
                ]);
                setActiveFileId(newId);
                return;
            }

            const newFiles = files.filter((f) => f.id !== idToDelete);
            setFiles(newFiles);

            if (activeFileId === idToDelete) {
                setActiveFileId(newFiles[newFiles.length - 1].id);
            }
        },
        [files, activeFileId, setFiles, setActiveFileId]
    );

    const handleFileUpload = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                processFile(file, (newFile) => {
                    setFiles((prev) => [...prev, newFile]);
                    setActiveFileId(newFile.id);
                });
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        },
        [setFiles, setActiveFileId]
    );

    const handleDownload = useCallback(() => {
        const activeFile = files.find((f) => f.id === activeFileId);
        if (!activeFile) return;

        const element = document.createElement("a");
        let blob: Blob;
        let mimeType: string;
        const filename = activeFile.name;

        if (isBinary(activeFile.fileType)) {
            if (activeFile.rawData) {
                let data: Uint8Array;
                if (activeFile.rawData instanceof ArrayBuffer) {
                    data = new Uint8Array(activeFile.rawData);
                } else {
                    const uint8Array = activeFile.rawData;
                    const newBuffer = new ArrayBuffer(uint8Array.byteLength);
                    data = new Uint8Array(newBuffer);
                    data.set(uint8Array);
                }
                if (activeFile.fileType === "pdf") {
                    mimeType = "application/pdf";
                } else {
                    mimeType =
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                }
                blob = new Blob([data as Uint8Array<ArrayBuffer>], { type: mimeType });
            } else {
                if (activeFile.content.startsWith("data:")) {
                    const base64 = activeFile.content.split(",")[1];
                    const binaryString = atob(base64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    mimeType =
                        activeFile.fileType === "pdf"
                            ? "application/pdf"
                            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    blob = new Blob([bytes], { type: mimeType });
                } else {
                    blob = new Blob([activeFile.content], { type: "text/plain" });
                }
            }
        } else {
            if (activeFile.fileType === "markdown") {
                mimeType = "text/markdown";
            } else {
                mimeType = "text/plain";
            }
            blob = new Blob([activeFile.content], { type: mimeType });
        }

        element.href = URL.createObjectURL(blob);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(element.href);
    }, [files, activeFileId]);

    const handleTriggerFileUpload = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return {
        fileInputRef,
        handleUpdateContent,
        handleUpdateName,
        handleNewFile,
        handleCloseFile,
        handleFileUpload,
        handleDownload,
        handleTriggerFileUpload,
    };
};

