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

fn draw_rounded_rect(
    layer: &PdfLayerReference,
    x_min: f32,
    y_min: f32,
    x_max: f32,
    y_max: f32,
    r: f32,
) {
    let k = 0.55228475f32;
    let points = vec![
        (Point::new(Mm(x_min + r), Mm(y_max)), false),
        (Point::new(Mm(x_max - r), Mm(y_max)), false),
        (Point::new(Mm(x_max - r + r * k), Mm(y_max)), true),
        (Point::new(Mm(x_max), Mm(y_max - r + r * k)), true),
        (Point::new(Mm(x_max), Mm(y_max - r)), false),
        (Point::new(Mm(x_max), Mm(y_min + r)), false),
        (Point::new(Mm(x_max), Mm(y_min + r - r * k)), true),
        (Point::new(Mm(x_max - r + r * k), Mm(y_min)), true),
        (Point::new(Mm(x_max - r), Mm(y_min)), false),
        (Point::new(Mm(x_min + r), Mm(y_min)), false),
        (Point::new(Mm(x_min + r - r * k), Mm(y_min)), true),
        (Point::new(Mm(x_min), Mm(y_min + r - r * k)), true),
        (Point::new(Mm(x_min), Mm(y_min + r)), false),
        (Point::new(Mm(x_min), Mm(y_max - r)), false),
        (Point::new(Mm(x_min), Mm(y_max - r + r * k)), true),
        (Point::new(Mm(x_min + r - r * k), Mm(y_max)), true),
        (Point::new(Mm(x_min + r), Mm(y_max)), false),
    ];

    let line = Line {
        points,
        is_closed: true,
    };
    layer.add_line(line);
}

#[tauri::command]
fn export_to_pdf(
    path: String,
    payload: PuzzlePayload<WordSearchData>,
    page_size: String,
) -> Result<(), String> {
    let (width_mm, height_mm) = match page_size.as_str() {
        "Letter" => (215.9f32, 279.4f32),
        _ => (210.0f32, 297.0f32), // Default to A4
    };

    let (doc, page1, layer1) = PdfDocument::new("Word Search", Mm(width_mm), Mm(height_mm), "Layer 1");
    let current_layer = doc.get_page(page1).get_layer(layer1);
    let font = doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|_| "Font error".to_string())?;

    // Page margins and layout configuration
    let margin_x = 20.0f32;
    let margin_top = 40.0f32;
    let margin_bottom = 20.0f32;

    // Title is placed near the top
    current_layer.use_text(&payload.title, 24.0, Mm(margin_x), Mm(height_mm - 27.0f32), &font);

    let grid = payload.grid;
    let rows = grid.len();
    let cols = if rows > 0 { grid[0].len() } else { 0 };

    let available_width = width_mm - 2.0f32 * margin_x;

    // Filter successfully placed words for the Word Bank
    let unplaced_words = &payload.specific_data.unplaced_words;
    let word_bank_words: Vec<String> = payload
        .specific_data
        .word_bank
        .iter()
        .filter(|w| !unplaced_words.contains(w))
        .cloned()
        .collect();

    // Calculate Word Bank height
    let word_cols = 4;
    let word_rows = if !word_bank_words.is_empty() {
        (word_bank_words.len() + word_cols - 1) / word_cols
    } else {
        0
    };
    let word_bank_height = if word_rows > 0 {
        16.0f32 + (word_rows as f32) * 6.0f32
    } else {
        0.0f32
    };

    // Calculate unplaced words height
    let unplaced_cols = 4;
    let unplaced_rows = if !unplaced_words.is_empty() {
        (unplaced_words.len() + unplaced_cols - 1) / unplaced_cols
    } else {
        0
    };
    let unplaced_height = if unplaced_rows > 0 {
        12.0f32 + (unplaced_rows as f32) * 6.0f32
    } else {
        0.0f32
    };

    // Spacing budget
    let gaps_height = if unplaced_rows > 0 { 20.0f32 } else { 10.0f32 };
    let available_height = height_mm - margin_top - margin_bottom - word_bank_height - unplaced_height - gaps_height;

    // Calculate dynamic scaling for cells
    let cell_size_x = if cols > 0 { available_width / cols as f32 } else { 10.0f32 };
    let cell_size_y = if rows > 0 { available_height / rows as f32 } else { 10.0f32 };

    // Maintain square cells and cap at 12.0 mm (standard size)
    let cell_size = cell_size_x.min(cell_size_y).min(12.0f32);

    // Scale font size proportionally: standard size 12pt for 10mm cells
    let grid_font_size = cell_size * 1.2f32;

    // Center the grid horizontally on the page
    let grid_width = (cols as f32) * cell_size;
    let start_x = margin_x + (available_width - grid_width) / 2.0f32;

    // Grid starting y position (top row of characters)
    let grid_top_y = height_mm - margin_top;
    let grid_bottom_y = grid_top_y - (rows as f32) * cell_size;

    // Set border line style
    current_layer.set_outline_thickness(1.0f32);
    current_layer.set_outline_color(Color::Rgb(Rgb::new(0.7f32, 0.7f32, 0.7f32, None)));

    // Draw rounded border around the grid
    draw_rounded_rect(&current_layer, start_x, grid_bottom_y, start_x + grid_width, grid_top_y, 4.0f32);

    // Draw characters centered in their cells
    for (row_idx, row) in grid.iter().enumerate() {
        for (col_idx, cell) in row.iter().enumerate() {
            let cell_left = start_x + (col_idx as f32) * cell_size;
            let cell_top = grid_top_y - (row_idx as f32) * cell_size;
            let cell_bottom = cell_top - cell_size;

            // Offset to center the character horizontally and vertically
            let x = cell_left + cell_size * 0.35f32;
            let y = cell_bottom + cell_size * 0.25f32;

            current_layer.use_text(cell, grid_font_size, Mm(x), Mm(y), &font);
        }
    }

    // Draw the Word Bank if it contains words
    let mut current_y = grid_bottom_y - 10.0f32;
    if word_rows > 0 {
        let wb_y_min = current_y - word_bank_height;
        
        // Draw rounded border around Word Bank
        draw_rounded_rect(&current_layer, margin_x, wb_y_min, width_mm - margin_x, current_y, 4.0f32);

        // Draw "Word Bank" Title
        current_layer.use_text("Word Bank", 13.0, Mm(margin_x + 5.0f32), Mm(current_y - 8.0f32), &font);

        // Draw words in columns
        let col_width = (available_width - 10.0f32) / word_cols as f32;
        for (i, word) in word_bank_words.iter().enumerate() {
            let col_idx = i % word_cols;
            let row_idx = i / word_cols;
            let word_x = margin_x + 5.0f32 + (col_idx as f32) * col_width;
            let word_y = current_y - 14.0f32 - (row_idx as f32) * 6.0f32;
            current_layer.use_text(word, 10.0, Mm(word_x), Mm(word_y), &font);
        }

        current_y = wb_y_min;
    }

    // Draw Unplaced Words if there are any
    if unplaced_rows > 0 {
        current_y -= 10.0f32;
        current_layer.use_text("Unplaced Words:", 14.0, Mm(margin_x), Mm(current_y), &font);

        current_y -= 8.0f32;
        let col_width = available_width / unplaced_cols as f32;
        for (i, word) in unplaced_words.iter().enumerate() {
            let col_idx = i % unplaced_cols;
            if col_idx == 0 && i > 0 {
                current_y -= 6.0f32;
            }
            let word_x = margin_x + (col_idx as f32) * col_width;
            current_layer.use_text(word, 10.0, Mm(word_x), Mm(current_y), &font);
        }
    }

    // Draw page number at the bottom center
    let page_text = "Page 1";
    let page_x = (width_mm / 2.0f32) - 5.0f32;
    let page_y = 10.0f32;
    current_layer.use_text(page_text, 10.0, Mm(page_x), Mm(page_y), &font);

    doc.save(&mut BufWriter::new(
        File::create(&path).map_err(|_| "File error".to_string())?,
    ))
    .map_err(|_| "Save error".to_string())?;

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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{PuzzlePayload, PuzzleType, WordSearchData, WordPlacement};

    #[test]
    fn test_export_to_pdf_scaling() {
        let temp_dir = std::env::temp_dir();
        let pdf_path = temp_dir.join("test_word_search.pdf");
        let pdf_path_str = pdf_path.to_string_lossy().into_owned();

        // Create a large 25x25 grid
        let grid = vec![vec!["A".to_string(); 25]; 25];
        let payload = PuzzlePayload {
            id: "test-id".to_string(),
            puzzle_type: PuzzleType::WordSearch,
            title: "Test Large Puzzle".to_string(),
            grid,
            specific_data: WordSearchData {
                word_bank: vec!["HELLO".to_string()],
                unplaced_words: vec!["WORLD".to_string()],
                solutions: vec![WordPlacement {
                    word: "HELLO".to_string(),
                    start_x: 0,
                    start_y: 0,
                    end_x: 4,
                    end_y: 0,
                }],
            },
        };

        // Export to PDF using A4 and Letter
        let result_a4 = export_to_pdf(pdf_path_str.clone(), payload.clone(), "A4".to_string());
        assert!(result_a4.is_ok(), "A4 PDF export failed: {:?}", result_a4);
        assert!(pdf_path.exists());
        let _ = std::fs::remove_file(&pdf_path);

        let result_letter = export_to_pdf(pdf_path_str.clone(), payload, "Letter".to_string());
        assert!(result_letter.is_ok(), "Letter PDF export failed: {:?}", result_letter);
        assert!(pdf_path.exists());
        let _ = std::fs::remove_file(&pdf_path);
    }
}
