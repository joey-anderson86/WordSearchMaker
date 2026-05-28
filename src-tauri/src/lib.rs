pub mod models;
pub mod word_search_engine;

use models::{PuzzlePayload, WordSearchData};
use printpdf::*;
use std::fs::File;
use std::io::BufWriter;

#[tauri::command]
fn generate_puzzle(width: usize, height: usize, words: Vec<String>) -> PuzzlePayload<WordSearchData> {
    word_search_engine::generate_word_search(width, height, words)
}

#[tauri::command]
fn export_to_pdf(path: String, payload: PuzzlePayload<WordSearchData>) -> Result<(), String> {
    let (doc, page1, layer1) = PdfDocument::new("Word Search", Mm(210.0), Mm(297.0), "Layer 1");
    let current_layer = doc.get_page(page1).get_layer(layer1);
    let font = doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|_| "Font error".to_string())?;
    
    current_layer.use_text(&payload.title, 24.0, Mm(20.0), Mm(270.0), &font);

    let mut y = 250.0;
    let grid = payload.grid;
    for row in grid {
        let mut x = 20.0;
        for cell in row {
            current_layer.use_text(&cell, 12.0, Mm(x), Mm(y), &font);
            x += 10.0;
        }
        y -= 10.0;
    }

    if !payload.specific_data.unplaced_words.is_empty() {
        y -= 10.0;
        current_layer.use_text("Unplaced Words:", 14.0, Mm(20.0), Mm(y), &font);
        y -= 10.0;
        for word in payload.specific_data.unplaced_words {
            current_layer.use_text(&word, 12.0, Mm(20.0), Mm(y), &font);
            y -= 10.0;
        }
    }

    doc.save(&mut BufWriter::new(File::create(&path).map_err(|_| "File error".to_string())?)).map_err(|_| "Save error".to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![generate_puzzle, export_to_pdf])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
