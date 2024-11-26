import { svg2pdflib } from "../build/svg2pdflib.js";
// @ts-ignore
import roboto from "../fonts/Roboto-Regular.ttf?uint8array";
// @ts-ignore
import noto from "../fonts/NotoSerif-Regular.ttf?uint8array";

export function svg2pdf(svg: string) {
    return svg2pdflib.svg2pdf(svg, [roboto, noto]);
}

export function svg2pdf2(svg: string) {
    return svg2pdflib.svg2pdf2(svg);
}
