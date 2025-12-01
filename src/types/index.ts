import { LucideIcon } from "lucide-react"
import React, { Dispatch } from "react";
// Interface for the 'marked' library loaded via CDN
export interface MarkedLibrary {
    parse: (text: string) => string;
    setOptions: (options: { gfm: boolean; breaks: boolean }) => void;
}

declare global {
    interface Window {
        marked?: MarkedLibrary;
    }
}

export interface ToolbarButtonProps {
    icon: LucideIcon;
    onClick: () => void;
    label: string;
}

export type FileType = "markdown" | "pdf" | "word";

export interface DocumentFile {
    id: string;
    name: string;
    content: string;
    fileType: FileType;
    rawData?: ArrayBuffer | Uint8Array; // For binary files like PDF, Word
}

export type TabType = "write" | "preview";

export interface FileTabProps {
    activeFileId: string;
    setActiveFileId: Dispatch<React.SetStateAction<string>>
    file: DocumentFile,
    handleCloseFile: (e: React.MouseEvent<Element, MouseEvent>, idToDelete: string) => void
}

export interface ContentAreaProp {
    activeTab: TabType;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    activeFile: DocumentFile;
    handleUpdateContent: (newContent: string) => void;
    markedLoaded: boolean;
    getParsedMarkdown: () => {
        __html: string;
    }
}

// Legacy type alias for backward compatibility during migration
export type MarkdownFile = DocumentFile;