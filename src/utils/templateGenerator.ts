import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

/**
 * Generates the LLM prompt template content with user-fillable fields in angle brackets.
 */
function generateTemplateContent(): string {
  return `\
=== WORD SEARCH BOOK GENERATOR — LLM PROMPT ===

Use the prompt below to generate a complete Word Search book JSON file.
Fill in the fields surrounded by <angle brackets> with your preferences, then
paste the entire block into your favorite LLM (ChatGPT, Claude, Gemini, etc.).
Copy the JSON output and import it into Word Search Maker using "Import Book from JSON".

--------------------------------------------------------------------------------
PROMPT:
--------------------------------------------------------------------------------

Generate a JSON file for a Word Search puzzle book with the following specifications:

Book Title: <your book title, e.g. "Ultimate Animal Word Search">
Number of Pages: <number of puzzle pages, e.g. 10>
Target Audience: <target audience, e.g. "kids ages 8-12", "adults", "seniors">
Difficulty Level: <easy, medium, or hard — affects word length and grid size>
Theme(s): <list themes for the pages, e.g. "Ocean Animals, Jungle Animals, Farm Animals, Birds, Reptiles" — or say "varied" for the LLM to choose>

Additional Instructions:
- <any extra instructions, e.g. "include only common English words", "no words longer than 10 letters", "make it educational with science terms">

Rules for the generated JSON:
1. Return ONLY valid JSON — no markdown fences, no commentary before or after.
2. Use the exact schema shown below.
3. "gridWidth" and "gridHeight" must each be between 5 and 30.
4. Scale grid size to difficulty: easy ~10-12, medium ~14-16, hard ~18-22.
5. Each page should have 8-20 words depending on grid size and difficulty.
6. All words must be single words (no spaces or hyphens), uppercase A-Z only.
7. Each word must be at least 2 characters long.
8. Words should fit within the grid dimensions (word length ≤ max(gridWidth, gridHeight)).
9. Each page should have a descriptive, unique title related to its theme.
10. The "bookTitle" field is required.

JSON Schema:

{
  "bookTitle": "string — the title of the entire book",
  "pages": [
    {
      "title": "string — title for this puzzle page",
      "gridWidth": "integer (5-30) — number of columns",
      "gridHeight": "integer (5-30) — number of rows",
      "words": ["WORD1", "WORD2", "WORD3", "... uppercase A-Z only"]
    }
  ]
}

Example output for a 3-page easy kids book:

{
  "bookTitle": "My First Animal Word Search",
  "pages": [
    {
      "title": "Pet Friends",
      "gridWidth": 10,
      "gridHeight": 10,
      "words": ["DOG", "CAT", "FISH", "BIRD", "HAMSTER", "RABBIT", "TURTLE", "PARROT"]
    },
    {
      "title": "Ocean Life",
      "gridWidth": 12,
      "gridHeight": 12,
      "words": ["WHALE", "SHARK", "DOLPHIN", "OCTOPUS", "STARFISH", "CORAL", "JELLYFISH", "SEAL"]
    },
    {
      "title": "Safari Adventure",
      "gridWidth": 12,
      "gridHeight": 12,
      "words": ["LION", "ELEPHANT", "GIRAFFE", "ZEBRA", "HIPPO", "RHINO", "CHEETAH", "GORILLA"]
    }
  ]
}

Now generate the full JSON for my specifications above.
`;
}

/**
 * Opens a native "Save As" dialog and writes the LLM prompt template to the selected location.
 * Returns true if saved successfully, false if the user cancelled.
 */
export async function downloadTemplate(): Promise<boolean> {
  const savePath = await save({
    title: "Save LLM Prompt Template",
    defaultPath: "word_search_prompt_template.txt",
    filters: [
      {
        name: "Text Files",
        extensions: ["txt"],
      },
    ],
  });

  if (!savePath) {
    return false; // User cancelled
  }

  const content = generateTemplateContent();
  await writeTextFile(savePath, content);
  return true;
}
