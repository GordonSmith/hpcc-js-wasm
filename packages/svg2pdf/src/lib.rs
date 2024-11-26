#[allow(warnings)]
mod bindings;

use svg2pdf::{ConversionOptions, PageOptions};

use bindings::exports::hpcc::svg2pdflib::svg2pdflib::Guest;

struct Component;

impl Guest for Component {
    fn svg2pdf(svg: String, fonts: Vec<Vec<u8>>) -> Vec<u8> {
        let mut options = svg2pdf::usvg::Options::default();
        for font in fonts {
            options.fontdb_mut().load_font_data(font);
        }
        options.font_family = "sans-serif".to_string();
        // options.fontdb_mut().load_system_fonts();
        let tree = svg2pdf::usvg::Tree::from_str(&svg, &options).unwrap();
        let mut conversion_options = ConversionOptions::default();
        conversion_options.embed_text = false;
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
