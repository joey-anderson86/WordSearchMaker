import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";

/**
 * Schema for a single word search page definition in the import JSON.
 */
export interface PageDefinition {
  title: string;
  gridWidth: number;
  gridHeight: number;
  words: string[];
}

/**
 * Top-level schema for the book import JSON file.
 */
export interface BookImport {
  bookTitle?: string;
  pages: PageDefinition[];
}

/**
 * Validation error with a human-readable message.
 */
export class ImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportValidationError";
  }
}

/**
 * Sanitize a word to uppercase A-Z only.
 */
function sanitizeWord(word: string): string {
  return word.toUpperCase().replace(/[^A-Z]/g, "");
}

/**
 * Validate and normalize the parsed JSON into a BookImport.
 * Throws ImportValidationError with a descriptive message on failure.
 */
function validateBookImport(data: unknown): BookImport {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new ImportValidationError(
      "Invalid JSON structure: expected a top-level object with a \"pages\" array."
    );
  }

  const obj = data as Record<string, unknown>;

  // Validate optional bookTitle
  let bookTitle: string | undefined;
  if ("bookTitle" in obj && obj.bookTitle !== undefined) {
    if (typeof obj.bookTitle !== "string" || obj.bookTitle.trim().length === 0) {
      throw new ImportValidationError(
        "\"bookTitle\" must be a non-empty string if provided."
      );
    }
    bookTitle = obj.bookTitle.trim();
  }

  // Validate pages array
  if (!("pages" in obj) || !Array.isArray(obj.pages)) {
    throw new ImportValidationError(
      "Missing or invalid \"pages\" field: expected a non-empty array of page definitions."
    );
  }

  const rawPages = obj.pages as unknown[];
  if (rawPages.length === 0) {
    throw new ImportValidationError(
      "\"pages\" array must contain at least one page definition."
    );
  }

  const pages: PageDefinition[] = rawPages.map((page, idx) => {
    if (typeof page !== "object" || page === null || Array.isArray(page)) {
      throw new ImportValidationError(
        `Page ${idx + 1}: expected an object with title, gridWidth, gridHeight, and words.`
      );
    }

    const p = page as Record<string, unknown>;

    // title
    if (typeof p.title !== "string" || p.title.trim().length === 0) {
      throw new ImportValidationError(
        `Page ${idx + 1}: "title" is required and must be a non-empty string.`
      );
    }

    // gridWidth
    if (typeof p.gridWidth !== "number" || !Number.isInteger(p.gridWidth)) {
      throw new ImportValidationError(
        `Page ${idx + 1}: "gridWidth" is required and must be an integer.`
      );
    }
    if (p.gridWidth < 5 || p.gridWidth > 30) {
      throw new ImportValidationError(
        `Page ${idx + 1}: "gridWidth" must be between 5 and 30 (got ${p.gridWidth}).`
      );
    }

    // gridHeight
    if (typeof p.gridHeight !== "number" || !Number.isInteger(p.gridHeight)) {
      throw new ImportValidationError(
        `Page ${idx + 1}: "gridHeight" is required and must be an integer.`
      );
    }
    if (p.gridHeight < 5 || p.gridHeight > 30) {
      throw new ImportValidationError(
        `Page ${idx + 1}: "gridHeight" must be between 5 and 30 (got ${p.gridHeight}).`
      );
    }

    // words
    if (!Array.isArray(p.words) || p.words.length === 0) {
      throw new ImportValidationError(
        `Page ${idx + 1}: "words" is required and must be a non-empty array of strings.`
      );
    }

    const sanitizedWords: string[] = [];
    for (let wi = 0; wi < (p.words as unknown[]).length; wi++) {
      const raw = (p.words as unknown[])[wi];
      if (typeof raw !== "string") {
        throw new ImportValidationError(
          `Page ${idx + 1}, word ${wi + 1}: each word must be a string.`
        );
      }
      const clean = sanitizeWord(raw);
      if (clean.length < 2) {
        throw new ImportValidationError(
          `Page ${idx + 1}, word "${raw}": after sanitization, word must be at least 2 letters.`
        );
      }
      sanitizedWords.push(clean);
    }

    return {
      title: p.title.trim(),
      gridWidth: p.gridWidth,
      gridHeight: p.gridHeight,
      words: sanitizedWords,
    };
  });

  return { bookTitle, pages };
}

/**
 * Opens a native file dialog to select a JSON file, reads and validates it,
 * and returns a typed BookImport object.
 *
 * Returns `null` if the user cancels the dialog.
 * Throws ImportValidationError for validation failures.
 * Throws Error for file I/O failures.
 */
export async function importBookFromJson(): Promise<BookImport | null> {
  // Open native file picker filtered to JSON files
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "JSON Files",
        extensions: ["json"],
      },
    ],
    title: "Import Word Search Book from JSON",
  });

  // User cancelled
  if (!selected) {
    return null;
  }

  // `selected` is a string path (single file mode)
  const filePath = typeof selected === "string" ? selected : selected;

  let rawText: string;
  try {
    rawText = await readTextFile(filePath);
  } catch (err) {
    throw new Error(
      `Failed to read file: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new ImportValidationError(
      "Invalid JSON: the file does not contain valid JSON syntax."
    );
  }

  return validateBookImport(parsed);
}
