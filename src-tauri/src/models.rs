use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[ts(export, export_to = "../src/types/PuzzleType.ts")]
pub enum PuzzleType {
    WordSearch,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[ts(export, export_to = "../src/types/PuzzlePayload.ts")]
#[ts(concrete(T = WordSearchData))]
pub struct PuzzlePayload<T> {
    pub id: String,
    pub puzzle_type: PuzzleType,
    pub title: String,
    pub grid: Vec<Vec<String>>,
    pub specific_data: T,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[ts(export, export_to = "../src/types/WordSearchData.ts")]
pub struct WordSearchData {
    pub word_bank: Vec<String>,
    pub unplaced_words: Vec<String>,
    pub solutions: Vec<WordPlacement>,
}

#[derive(Serialize, Deserialize, TS, Debug, Clone)]
#[ts(export, export_to = "../src/types/WordPlacement.ts")]
pub struct WordPlacement {
    pub word: String,
    pub start_x: i32,
    pub start_y: i32,
    pub end_x: i32,
    pub end_y: i32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn export_bindings() {
        // Run ts-rs export manually by calling export on each type
        PuzzleType::export().expect("failed to export PuzzleType");
        PuzzlePayload::<WordSearchData>::export().expect("failed to export PuzzlePayload");
        WordSearchData::export().expect("failed to export WordSearchData");
        WordPlacement::export().expect("failed to export WordPlacement");
    }
}
