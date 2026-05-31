use crate::models::{PuzzlePayload, PuzzleSpecificData, WordPlacement, WordSearchData, BulkPuzzleRequest};
use rand::{seq::SliceRandom, thread_rng, Rng};
use uuid::Uuid;
use rayon::prelude::*;
use tauri::{AppHandle, Emitter};

pub fn generate_word_search(
    width: usize,
    height: usize,
    words: Vec<String>,
) -> PuzzlePayload {
    let mut grid: Vec<Vec<char>> = vec![vec![' '; width]; height];

    let mut sorted_words = words.clone();
    // Sort input words by length (longest first)
    sorted_words.sort_by(|a, b| b.len().cmp(&a.len()));

    let mut solutions: Vec<WordPlacement> = Vec::new();
    let mut unplaced_words: Vec<String> = Vec::new();

    // (dx, dy)
    let directions = [
        (1, 0),   // Horizontal forward
        (-1, 0),  // Horizontal backward
        (0, 1),   // Vertical forward
        (0, -1),  // Vertical backward
        (1, 1),   // Diagonal down-right
        (-1, -1), // Diagonal up-left
        (1, -1),  // Diagonal up-right
        (-1, 1),  // Diagonal down-left
    ];

    let mut rng = thread_rng();

    for word in sorted_words {
        let upper_word = word.to_uppercase();
        let word_chars: Vec<char> = upper_word.chars().collect();
        let word_len = word_chars.len() as i32;
        let mut placed = false;

        let mut all_coordinates = Vec::new();
        for y in 0..height {
            for x in 0..width {
                all_coordinates.push((x as i32, y as i32));
            }
        }
        all_coordinates.shuffle(&mut rng);

        for (start_x, start_y) in all_coordinates {
            let mut dirs = directions.to_vec();
            dirs.shuffle(&mut rng);

            for (dx, dy) in dirs {
                let end_x = start_x + (word_len - 1) * dx;
                let end_y = start_y + (word_len - 1) * dy;

                if end_x >= 0 && end_x < width as i32 && end_y >= 0 && end_y < height as i32 {
                    let mut can_place = true;
                    for i in 0..word_len {
                        let cx = (start_x + i * dx) as usize;
                        let cy = (start_y + i * dy) as usize;

                        if grid[cy][cx] != ' ' && grid[cy][cx] != word_chars[i as usize] {
                            can_place = false;
                            break;
                        }
                    }

                    if can_place {
                        for i in 0..word_len {
                            let cx = (start_x + i * dx) as usize;
                            let cy = (start_y + i * dy) as usize;
                            grid[cy][cx] = word_chars[i as usize];
                        }

                        solutions.push(WordPlacement {
                            word: upper_word.clone(),
                            start_x,
                            start_y,
                            end_x,
                            end_y,
                        });
                        placed = true;
                        break;
                    }
                }
            }
            if placed {
                break;
            }
        }

        if !placed {
            unplaced_words.push(word);
        }
    }

    // Fill remaining empty grid spaces with random uppercase alphabet letters
    for y in 0..height {
        for x in 0..width {
            if grid[y][x] == ' ' {
                grid[y][x] = rng.gen_range(b'A'..=b'Z') as char;
            }
        }
    }

    let final_grid = grid
        .into_iter()
        .map(|row| row.into_iter().map(|c| serde_json::json!(c.to_string())).collect())
        .collect();

    PuzzlePayload {
        id: Uuid::new_v4().to_string(),
        title: "Word Search".to_string(),
        grid: final_grid,
        specific_data: PuzzleSpecificData::WordSearch(WordSearchData {
            word_bank: words,
            unplaced_words,
            solutions,
        }),
        grid_font: None,
        title_font: None,
        theme_accents: None,
        cell_borders: None,
        ide_theme: None,
        letter_tracking: None,
        word_bank_columns: None,
        selector_style: None,
        solution_style: None,
    }
}

pub fn generate_bulk_word_searches(
    app_handle: AppHandle,
    requests: Vec<BulkPuzzleRequest>,
) -> Vec<PuzzlePayload> {
    let total = requests.len();
    let completed = std::sync::atomic::AtomicUsize::new(0);

    requests
        .into_par_iter()
        .map(|req| {
            let mut payload = generate_word_search(req.width, req.height, req.words);
            payload.title = req.title;

            let current = completed.fetch_add(1, std::sync::atomic::Ordering::Relaxed) + 1;
            let progress = (current as f64 / total as f64) * 100.0;

            // Emit progress to frontend
            let _ = app_handle.emit("puzzle_generation_progress", progress);

            payload
        })
        .collect()
}
