pub mod models;
pub mod word_search_engine;
pub mod error;
pub mod pdf_engine;
use error::AppError;
use models::{PuzzlePayload, BulkPuzzleRequest};
use tauri::AppHandle;

#[tauri::command]
fn generate_puzzle(width: usize, height: usize, words: Vec<String>, difficulty: Option<models::Difficulty>) -> Result<PuzzlePayload, AppError> {
    Ok(word_search_engine::generate_word_search(width, height, words, difficulty, None, None))
}

#[tauri::command]
async fn generate_bulk_puzzles(
    app_handle: AppHandle,
    requests: Vec<BulkPuzzleRequest>,
) -> Result<Vec<PuzzlePayload>, AppError> {
    let result = tauri::async_runtime::spawn_blocking(move || {
        word_search_engine::generate_bulk_word_searches(app_handle, requests)
    }).await.map_err(|e| AppError::Io(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())))?;
    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            generate_puzzle, 
            generate_bulk_puzzles,
            pdf_engine::generate_pdf_from_canvas
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
