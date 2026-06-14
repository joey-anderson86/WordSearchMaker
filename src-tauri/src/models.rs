use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, TS, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/types/generated/Difficulty.ts")]
pub enum Difficulty {
    Kids,
    Easy,
    Medium,
    Hard,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[ts(export, export_to = "../../src/types/generated/WordPlacement.ts")]
pub struct WordPlacement {
    pub word: String,
    pub start_x: i32,
    pub start_y: i32,
    pub end_x: i32,
    pub end_y: i32,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/types/generated/BulkPuzzleRequest.ts")]
pub struct BulkPuzzleRequest {
    pub title: String,
    pub width: usize,
    pub height: usize,
    pub words: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub difficulty: Option<Difficulty>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub mask: Option<Vec<Vec<bool>>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub is_large_print: Option<bool>,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[ts(export, export_to = "../../src/types/generated/WordSearchData.ts")]
pub struct WordSearchData {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub difficulty: Option<Difficulty>,
    pub word_bank: Vec<String>,
    pub unplaced_words: Vec<String>,
    pub solutions: Vec<WordPlacement>,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[ts(export, export_to = "../../src/types/generated/SudokuData.ts")]
pub struct SudokuData {
    pub difficulty: String,
    pub solution: Vec<Vec<i32>>,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[ts(export, export_to = "../../src/types/generated/CrosswordClue.ts")]
pub struct CrosswordClue {
    pub id: String,
    pub number: i32,
    pub direction: String,
    pub row: i32,
    pub col: i32,
    pub clue: String,
    pub answer: String,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[ts(export, export_to = "../../src/types/generated/CrosswordClueInput.ts")]
pub struct CrosswordClueInput {
    pub word: String,
    pub clue: String,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[ts(export, export_to = "../../src/types/generated/CrosswordData.ts")]
pub struct CrosswordData {
    pub difficulty: String,
    pub solution: Vec<Vec<String>>,
    pub clues: Vec<CrosswordClue>,
    pub word_bank: Vec<CrosswordClueInput>,
    pub unplaced_words: Vec<CrosswordClueInput>,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[serde(tag = "type", content = "data")]
#[ts(export, export_to = "../../src/types/generated/PuzzleSpecificData.ts")]
pub enum PuzzleSpecificData {
    WordSearch(WordSearchData),
    Sudoku(SudokuData),
    Crossword(CrosswordData),
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/types/generated/PuzzlePayload.ts")]
pub struct PuzzlePayload {
    pub id: String,
    pub title: String,
    #[ts(type = "(string | number | null)[][]")]
    pub grid: Vec<Vec<serde_json::Value>>,
    pub specific_data: PuzzleSpecificData,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub grid_font: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub title_font: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub theme_accents: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub cell_borders: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub ide_theme: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub letter_tracking: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub word_bank_columns: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub selector_style: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub solution_style: Option<String>,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone, PartialEq)]
#[ts(export, export_to = "../../src/types/generated/ElementType.ts")]
pub enum ElementType {
    #[serde(rename = "TEXT")]
    Text,
    #[serde(rename = "IMAGE")]
    Image,
    #[serde(rename = "PUZZLE_GRID")]
    PuzzleGrid,
    #[serde(rename = "SHAPE")]
    Shape,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/types/generated/CanvasElement.ts")]
pub struct CanvasElement {
    pub id: String,
    pub r#type: ElementType,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub rotation: f64,
    pub is_locked: bool,
    pub is_visible: bool,
    #[ts(type = "any")]
    pub content_data: serde_json::Value,
    #[ts(type = "Record<string, any>")]
    pub style: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/types/generated/CanvasPayload.ts")]
pub struct CanvasPayload {
    pub width_pt: f64,
    pub height_pt: f64,
    pub elements: Vec<CanvasElement>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn export_bindings() {
        Difficulty::export().expect("failed to export Difficulty");
        BulkPuzzleRequest::export().expect("failed to export BulkPuzzleRequest");
        WordPlacement::export().expect("failed to export WordPlacement");
        WordSearchData::export().expect("failed to export WordSearchData");
        SudokuData::export().expect("failed to export SudokuData");
        CrosswordClue::export().expect("failed to export CrosswordClue");
        CrosswordClueInput::export().expect("failed to export CrosswordClueInput");
        CrosswordData::export().expect("failed to export CrosswordData");
        PuzzleSpecificData::export().expect("failed to export PuzzleSpecificData");
        PuzzlePayload::export().expect("failed to export PuzzlePayload");
        ElementType::export().expect("failed to export ElementType");
        CanvasElement::export().expect("failed to export CanvasElement");
        CanvasPayload::export().expect("failed to export CanvasPayload");
    }
}
