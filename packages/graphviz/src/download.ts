function serializeSVG(svgElement: SVGSVGElement, extraStyles: string = ""): string {
    const cloneSVG = svgElement.cloneNode(true) as SVGSVGElement;
    const origNodes = svgElement.querySelectorAll("*");
    cloneSVG.querySelectorAll("*").forEach((element: Element, i) => {
        const compStyles = window.getComputedStyle(origNodes[i] as SVGElement);
        for (let i = 0; i < compStyles.length; ++i) {
            const styleName = compStyles.item(i);
            const styleValue = compStyles.getPropertyValue(styleName);
            const stylePriority = compStyles.getPropertyPriority(styleName);
            (element as SVGElement).style.setProperty(styleName, styleValue, stylePriority);
        }
    });

    if (extraStyles) {
        const defs = cloneSVG.getElementsByTagName("defs");
        if (defs.length) {
            const extraStyle = document.createElement("style");
            extraStyle.setAttribute("type", "text/css");
            extraStyle.innerText = extraStyles;
            defs[0].appendChild(extraStyle);
        }
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(cloneSVG);
}

function toBlob(svgElement: SVGSVGElement, extraStyles: string = ""): Blob {
    return new Blob([serializeSVG(svgElement, extraStyles)], { type: "image/svg+xml" });
}

function rasterize(svgElement: SVGSVGElement, extraStyles: string = ""): Promise<Blob | null> {
    const { width, height } = svgElement.getBoundingClientRect();

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + "px";
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "transparent";
    return new Promise<Blob | null>((resolve, reject) => {
        return new Promise<void>((resolve, reject) => {
            const image = new Image();
            image.onerror = reject;
            image.onload = () => {
                ctx.drawImage(image, 0, 0, width, height, 0, 0, width, height);
                resolve();
            };
            image.src = URL.createObjectURL(toBlob(svgElement, extraStyles));
        }).then(() => {
            ctx.canvas.toBlob(resolve);
        });
    });
}

const pad = (num: number) => num.toString().padStart(2, '0');
const timestamp = (currentdate = new Date()) => `${currentdate.getFullYear()}-${pad(currentdate.getMonth() + 1)}-${pad(currentdate.getDate())}T${pad(currentdate.getHours())}_${pad(currentdate.getMinutes())}_${pad(currentdate.getSeconds())}`;

function downloadBlob(blob: Blob, filename: string) {
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    setTimeout(function () {
        a.click();
        document.body.removeChild(a);
    }, 10);
    return true;
}

export function downloadPNG(svgElement: SVGSVGElement, filename: string = `image_${timestamp()}`, extraStyles: string = "") {
    rasterize(svgElement, extraStyles).then(blob => blob && downloadBlob(blob, `${filename}.png`));
}
