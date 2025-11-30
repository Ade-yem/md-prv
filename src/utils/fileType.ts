import { FileType } from "../types";

/**
 * Detects the file type based on file extension
 */
export function detectFileType(filename: string): FileType {
  const extension = filename.toLowerCase().split('.').pop() || '';
  
  switch (extension) {
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'word';
    case 'rtf':
      return 'rtf';
    default:
      // Default to markdown for unknown extensions
      return 'markdown';
  }
}

/**
 * Checks if a file type supports editing
 */
export function isEditable(fileType: FileType): boolean {
  return fileType === 'markdown' || fileType === 'rtf';
}

/**
 * Checks if a file type supports preview
 */
export function hasPreview(fileType: FileType): boolean {
  return fileType === 'markdown' || fileType === 'rtf';
}

/**
 * Checks if a file type is binary (requires ArrayBuffer handling)
 */
export function isBinary(fileType: FileType): boolean {
  return fileType === 'pdf' || fileType === 'word';
}

