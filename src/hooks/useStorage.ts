import { useState, useEffect } from "react";
import { DocumentFile, TabType } from "../types";
import { saveState, loadState } from "../utils/storage";

interface UseStorageReturn {
    files: DocumentFile[];
    activeFileId: string;
    activeTab: TabType;
    isInitialized: boolean;
    setFiles: React.Dispatch<React.SetStateAction<DocumentFile[]>>;
    setActiveFileId: React.Dispatch<React.SetStateAction<string>>;
    setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}

const DEFAULT_FILE: DocumentFile = {
    id: "1",
    name: "Welcome.md",
    content:
        "# Welcome to Document Reader\n\nStart typing on the **left** to see the preview on the **right**.\n\n## Supported Formats\n- **Markdown**: Editor + Preview\n- **PDF**: Reader only\n- **Word (.doc/.docx)**: Reader only\n- **RTF**: Editor + Preview\n\n## Multi-Tab Features\n- Click the `+` icon to add a new file\n- Click `x` on a tab to close it\n- Import opens a new tab automatically\n\n```javascript\nconsole.log('Hello World');\n```",
    fileType: "markdown",
};

export const useStorage = (): UseStorageReturn => {
    const [files, setFiles] = useState<DocumentFile[]>([]);
    const [activeFileId, setActiveFileId] = useState<string>("");
    const [activeTab, setActiveTab] = useState<TabType>("write");
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    // Load state from IndexedDB on mount
    useEffect(() => {
        const loadInitialState = async () => {
            try {
                const savedState = await loadState();
                if (savedState) {
                    setFiles(savedState.files);
                    setActiveFileId(
                        savedState.activeFileId || savedState.files[0]?.id || ""
                    );
                    setActiveTab(savedState.activeTab || "write");
                } else {
                    setFiles([DEFAULT_FILE]);
                    setActiveFileId("1");
                }
            } catch (error) {
                console.error("Error loading state from IndexedDB:", error);
                setFiles([DEFAULT_FILE]);
                setActiveFileId("1");
            }
            setIsInitialized(true);
        };

        loadInitialState();
    }, []);

    // Save state to IndexedDB whenever files, activeFileId, or activeTab changes
    useEffect(() => {
        if (!isInitialized) return;

        const saveCurrentState = async () => {
            try {
                await saveState(files, activeFileId, activeTab);
            } catch (error) {
                console.error("Error saving state to IndexedDB:", error);
            }
        };

        saveCurrentState();
    }, [files, activeFileId, activeTab, isInitialized]);

    return {
        files,
        activeFileId,
        activeTab,
        isInitialized,
        setFiles,
        setActiveFileId,
        setActiveTab,
    };
};

