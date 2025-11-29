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

export interface MarkdownFile {
    id: string;
    name: string;
    content: string;
}

export type TabType = "write" | "preview";

export interface FileTabProps {
    activeFileId: string;
    setActiveFileId: Dispatch<React.SetStateAction<string>>
    file: MarkdownFile,
    handleCloseFile: (e: React.MouseEvent<Element, MouseEvent>, idToDelete: string) => void
}

export interface ContentAreaProp {
    activeTab: TabType;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    activeFile: MarkdownFile;
    handleUpdateContent: (newContent: string) => void;
    markedLoaded: boolean;
    getParsedMarkdown: () => {
        __html: string;
    }
}