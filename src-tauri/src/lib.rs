pub mod models;
pub mod word_search_engine;

use models::{PuzzlePayload, WordSearchData};

#[tauri::command]
fn generate_puzzle(width: usize, height: usize, words: Vec<String>) -> PuzzlePayload<WordSearchData> {
    word_search_engine::generate_word_search(width, height, words)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![generate_puzzle])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
