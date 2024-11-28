#[allow(warnings)]
mod bindings;

use svg2pdf::usvg::fontdb::Database;
use svg2pdf::{ConversionOptions, PageOptions};

use bindings::exports::hpcc::svg2pdflib::svg2pdflib::Guest;

struct Component;

fn load_fonts(
    fonts: &[Vec<u8>],
    default_serif_family: Option<&str>,
    default_sans_serif_family: Option<&str>,
    default_cursive_family: Option<&str>,
    default_fantasy_family: Option<&str>,
    default_monospace_family: Option<&str>,
) -> Database {
    let mut db = Database::new();
    for font in fonts {
        db.load_font_data(font.to_vec());
    }
    if let Some(f) = default_serif_family {
        db.set_serif_family(f.to_string())
    }
    if let Some(f) = default_sans_serif_family {
        db.set_sans_serif_family(f.to_string())
    }
    if let Some(f) = default_cursive_family {
        db.set_cursive_family(f.to_string())
    }
    if let Some(f) = default_fantasy_family {
        db.set_fantasy_family(f.to_string())
    }
    if let Some(f) = default_monospace_family {
        db.set_monospace_family(f.to_string())
    }
    db
}

impl Guest for Component {
    fn svg2pdf(svg: String, fonts: Vec<Vec<u8>>) -> Vec<u8> {
        let fontdb = load_fonts(
            &fonts,
            Some("Roboto"),
            Some("Roboto"),
            Some("Roboto"),
            Some("Roboto"),
            Some("Roboto"),
        );
        let faces = &mut fontdb.faces();
        let default_font_family = if fontdb.is_empty() {
            "Roboto".to_string()
        } else {
            faces.next().unwrap().families[0].0.to_string()
        };
        let svg_options = svg2pdf::usvg::Options {
            resources_dir: None,
            dpi: 96.0,
            font_family: default_font_family.clone(),
            font_size: 12.0,
            fontdb: std::sync::Arc::new(fontdb.clone()),
            font_resolver: svg2pdf::usvg::FontResolver::default(),
            languages: vec!["en".to_string()],
            shape_rendering: svg2pdf::usvg::ShapeRendering::GeometricPrecision,
            text_rendering: svg2pdf::usvg::TextRendering::OptimizeLegibility,
            image_rendering: svg2pdf::usvg::ImageRendering::OptimizeQuality,
            default_size: svg2pdf::usvg::Size::from_wh(100.0, 100.0).unwrap(),
            image_href_resolver: svg2pdf::usvg::ImageHrefResolver::default(),
        };

        // let mut options = svg2pdf::usvg::Options::default();
        // options.fontdb = std::sync::Arc::new(fontdb.clone());
        // options.font_family = default_font_family;
        // options.fontdb_mut().load_system_fonts();
        let tree = svg2pdf::usvg::Tree::from_str(&svg, &svg_options).unwrap();

        let conversion_options = ConversionOptions::default();
        return svg2pdf::to_pdf(&tree, conversion_options, PageOptions::default()).unwrap();
    }

    fn svg2pdf2(svg: String) -> Vec<u8> {
        let mut options = svg2pdf::usvg::Options::default();
        // options.fontdb_mut().load_system_fonts();
        options.font_family = "sans-serif".to_string();
        let tree = svg2pdf::usvg::Tree::from_str(&svg, &options).unwrap();
        let mut conversion_options = ConversionOptions::default();
        conversion_options.embed_text = false;
        return svg2pdf::to_pdf(&tree, conversion_options, PageOptions::default()).unwrap();
    }
}

bindings::export!(Component with_types_in bindings);
