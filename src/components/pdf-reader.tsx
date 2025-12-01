import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { DocumentFile } from "../types";
import "../AnnotationLayer.css";
import "../TextLayer.css";

// Set up PDF.js worker - use unpkg CDN with the version from the installed package
// This ensures version compatibility with the installed pdfjs-dist package
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  file: DocumentFile;
}

export const PDFReader: React.FC<PDFReaderProps> = ({ file }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    // Convert file content/rawData to ArrayBuffer for PDF.js
    // Always create a new ArrayBuffer copy to avoid detached buffer issues
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        let data: ArrayBuffer;
        if (file.rawData) {
          let sourceArray: Uint8Array;
          if (file.rawData instanceof ArrayBuffer) {
            // Create a copy to avoid detached buffer issues
            sourceArray = new Uint8Array(file.rawData);
          } else {
            // Already a Uint8Array
            sourceArray = file.rawData;
          }
          // Always create a new ArrayBuffer copy
          data = new ArrayBuffer(sourceArray.byteLength);
          new Uint8Array(data).set(sourceArray);
        } else {
          // If content is base64 or data URL, parse it
          let binaryString: string;
          if (file.content.startsWith("data:")) {
            binaryString = atob(file.content.split(",")[1]);
          } else {
            // Try to parse as base64
            try {
              binaryString = atob(file.content);
            } catch {
              throw new Error("Invalid PDF data format");
            }
          }
          // Create a new ArrayBuffer and copy the data
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          // Create a new ArrayBuffer copy instead of using bytes.buffer
          data = new ArrayBuffer(bytes.byteLength);
          new Uint8Array(data).set(bytes);
        }

        setPdfData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDF");
        setLoading(false);
      }
    };

    loadPdf();
  }, [file]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setPageNumber(1);
  };

  const onDocumentLoadError = (error: Error) => {
    setError(error.message || "Failed to load PDF document");
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => (numPages ? Math.min(numPages, prev + 1) : prev));
  };

  if (loading && !pdfData) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
        Loading PDF...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <div className="text-center p-6">
          <p className="font-semibold mb-2">Error loading PDF</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!pdfData) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        No PDF data available
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col bg-slate-50">
      {/* PDF Controls */}
      {numPages && (
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="px-3 py-1 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {pageNumber} of {numPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="px-3 py-1 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      <div className="flex-1 overflow-y-auto p-4 flex justify-center">
        <Document
          file={pdfData}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center h-full text-slate-400 gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
              Loading PDF...
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg"
          />
        </Document>
      </div>
    </div>
  );
};
