import localforage from "localforage";
import { DocumentFile, TabType } from "../types";

const STORAGE_KEY = "documentReaderState";
const SESSION_KEY = "documentReaderSession";

interface SavedState {
    files: Omit<DocumentFile, "rawData">[];
    activeFileId: string;
    activeTab: TabType;
    sessionId: string;
}

// Initialize localforage with IndexedDB
const storage = localforage.createInstance({
    name: "DocumentReader",
    storeName: "appState",
    driver: localforage.INDEXEDDB,
});

// Generate or retrieve session ID
const getSessionId = (): string => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
        return stored;
    }
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
    return sessionId;
};

// Clear storage when tab closes
const setupSessionCleanup = () => {
    const sessionId = getSessionId();

    const cleanup = async () => {
        try {
            const state = await storage.getItem<SavedState>(STORAGE_KEY);
            if (state && state.sessionId === sessionId) {
                await storage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
            console.error("Error during session cleanup:", error);
        }
    };

    // Clear on beforeunload (tab close)
    window.addEventListener("beforeunload", cleanup);

    // Clear on visibility change (tab hidden/closed)
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            // Delay cleanup to allow for page reloads
            setTimeout(() => {
                if (document.visibilityState === "hidden") {
                    cleanup();
                }
            }, 1000);
        }
    });

    // Clear on pagehide (more reliable for mobile)
    window.addEventListener("pagehide", cleanup);
};

// Initialize session cleanup
setupSessionCleanup();

export const saveState = async (
    files: DocumentFile[],
    activeFileId: string,
    activeTab: TabType
): Promise<void> => {
    try {
        const sessionId = getSessionId();
        const stateToSave: SavedState = {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            files: files.map(({ rawData, ...file }) => file),
            activeFileId,
            activeTab,
            sessionId,
        };

        await storage.setItem(STORAGE_KEY, stateToSave);
    } catch (error) {
        if (error instanceof Error && error.name === "QuotaExceededError") {
            console.warn("IndexedDB quota exceeded. Attempting to clear old data...");
            try {
                // Try to clear and retry
                await storage.clear();
                const sessionId = getSessionId();
                const stateToSave: SavedState = {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    files: files.map(({ rawData, ...file }) => file),
                    activeFileId,
                    activeTab,
                    sessionId,
                };
                await storage.setItem(STORAGE_KEY, stateToSave);
            } catch (retryError) {
                console.error("Error saving state after cleanup:", retryError);
                throw retryError;
            }
        } else {
            console.error("Error saving state to IndexedDB:", error);
            throw error;
        }
    }
};

export const loadState = async (): Promise<SavedState | null> => {
    try {
        const sessionId = getSessionId();
        const state = await storage.getItem<SavedState>(STORAGE_KEY);

        // Only return state if it belongs to current session
        if (state && state.sessionId === sessionId) {
            return state;
        }

        // Clear state from previous session
        if (state && state.sessionId !== sessionId) {
            await storage.removeItem(STORAGE_KEY);
        }

        return null;
    } catch (error) {
        console.error("Error loading state from IndexedDB:", error);
        return null;
    }
};

export const clearState = async (): Promise<void> => {
    try {
        await storage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error("Error clearing state:", error);
    }
};

