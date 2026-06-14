use printpdf::*;
use std::fs::File;
use std::io::BufWriter;
use crate::models::{CanvasPayload, ElementType};
use crate::error::AppError;
use tauri::AppHandle;

#[tauri::command]
pub async fn generate_pdf_from_canvas(
    app_handle: AppHandle,
    payload: CanvasPayload,
    output_path: String,
) -> Result<String, AppError> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut pdf = PdfDocument::new("Canvas PDF");
        
        let doc_width_pt = Pt(payload.width_pt as f32);
        let doc_height_pt = Pt(payload.height_pt as f32);
        
        let mut ops = Vec::new();
        
        for element in payload.elements {
            if !element.is_visible {
                continue;
            }
            
            ops.push(Op::SaveGraphicsState);
            
            // Printpdf places (0,0) at the BOTTOM-LEFT.
            // HTML canvas places (0,0) at the TOP-LEFT.
            let y_pdf = payload.height_pt - element.y - element.height;
            let rot_degrees = element.rotation as f32;
            
            ops.push(Op::SetTransformationMatrix {
                matrix: CurTransMat::TranslateRotate(
                    Pt(element.x as f32),
                    Pt(y_pdf as f32),
                    rot_degrees
                )
            });
            
            match element.r#type {
                ElementType::Text => {
                    // Logic for text
                },
                ElementType::Image => {
                    // Logic for image
                },
                ElementType::PuzzleGrid => {
                    // Logic for drawing the word search grid
                },
                ElementType::Shape => {
                    let width_pt = Pt(element.width as f32);
                    let height_pt = Pt(element.height as f32);
                    
                    ops.push(Op::DrawRectangle { 
                        rectangle: Rect::from_wh(width_pt, height_pt) 
                    });
                }
            }
            
            ops.push(Op::RestoreGraphicsState);
        }
        
        let page = PdfPage::new(Mm::from(doc_width_pt), Mm::from(doc_height_pt), ops);
        pdf.pages.push(page);
        
        let file = File::create(&output_path).map_err(AppError::Io)?;
        let mut buf_writer = BufWriter::new(file);
        
        pdf.save_writer(&mut buf_writer, &PdfSaveOptions::default(), &mut Vec::new());
        
        Ok(output_path)
    }).await.map_err(|e| AppError::Io(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())))?
}
