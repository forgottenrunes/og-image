import {readFileSync} from "fs";
import marked from "marked";
import {sanitizeHtml} from "./sanitizer";
import {ParsedRequest} from "./types";
import productionWizardData = require("../data/nfts-prod.json");
import {createCanvas, loadImage} from "node-canvas";
import sortBy from "lodash/sortBy";
import toPairs from "lodash/toPairs"

const twemoji = require("twemoji");
const twOptions = { folder: "svg", ext: ".svg" };
const emojify = (text: string) => twemoji.parse(text, twOptions);
const wizData = productionWizardData as { [wizardId: string]: any };

const rglr = readFileSync(`${__dirname}/../_fonts/alagard.woff2`).toString(
  "base64"
);

type WizardData = { name: string; image: string; background_color: string };

function getCss({
  theme,
  fontSize,
  wizard,
  bgColor
}: {
  theme: string;
  fontSize: string;
  wizard?: WizardData;
  bgColor?: string;
}) {
  let background = bgColor
    ? (bgColor[0] === "#" ? "" : "#") + bgColor
    : wizard
    ? `#${wizard?.background_color}`
    : "black";
  let foreground = "white";
  let radial = "#69696978";

  return `
    @font-face {
        font-family: 'MyAlagard';
        font-style:  normal;
        font-weight: normal;
        src: url(data:font/woff2;charset=utf-8;base64,${rglr}) format('woff2');
    }

    body {
        background: ${background};
        // background-image: radial-gradient(circle at 25px 25px, ${radial} 2%, transparent 0%), radial-gradient(circle at 75px 75px, ${radial} 2%, transparent 0%);
        // background-size: 100px 100px;
        height: 100vh;
        width:  100vw;
        // display: flex;
        text-align: center;
        // align-items: center;
        // justify-content: center;
        margin: 0;
    }

    code {
        color: #D400FF;
        font-family: 'Vera';
        white-space: pre-wrap;
        letter-spacing: -5px;
    }

    code:before, code:after {
        content: '\`';
    }

    .sides-layout {
        display: flex;
        flex-direction: row;
        // margin: 0 4em;
        width: 100%;
        height: 100%;
    }

    .logo-wrapper {
        flex: 50%;
        display: flex;
        align-items: center;
        align-content: center;
        justify-content: center;
        justify-items: center;
    }

    .logo {
        height: 100%;
        width: auto;
        max-height: 100%;
        max-width: 100%;
        image-rendering: pixelated;
    }

    .plus {
        color: #BBB;
        font-family: Times New Roman, Verdana;
        font-size: 100px;
    }

    .spacer {
        margin: 150px;
    }

    .emoji {
        height: 1em;
        width: 1em;
        margin: 0 .05em 0 .1em;
        vertical-align: -0.1em;
    }
    
    .heading {
        flex: 50%;
        font-family: 'MyAlagard', sans-serif;
        font-size: ${sanitizeHtml(fontSize)};
        font-style: normal;
        color: ${foreground};
        line-height: 1.2;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-left: 0.25em;
    }`;
}

function linearmap(
  value: number,
  istart: number,
  istop: number,
  ostart: number,
  ostop: number
) {
  return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
}

const getFontSizeForTitleText = (text, fontSize) => {
  if (fontSize) return fontSize;
  let minSize = 69;
  let maxSize = 260;
  let size =
    maxSize -
    Math.floor(linearmap(Math.min(text.length, 99), 10, 100, minSize, maxSize));
  size = Math.max(size, minSize);
  return size + "px";
};

function ColorToHex(color:number) {
  var hexadecimal = color.toString(16);
  return hexadecimal.length == 1 ? "0" + hexadecimal : hexadecimal;
}

function ConvertRGBtoHex(red:number, green:number, blue:number) {
  return "#" + ColorToHex(red) + ColorToHex(green) + ColorToHex(blue);
}

function extractBgColor(imagePixels: any, width: number, height: number) {
  //
  const pixels = imagePixels;
  const colorCounts: { [hex: string]: number } = {};

  // just read the top row, could pull from more borders if you want
  for (let i = 0, offset, r, g, b, a; i < width; i++) {
    offset = i * 4;
    r = pixels[offset + 0];
    g = pixels[offset + 1];
    b = pixels[offset + 2];
    a = pixels[offset + 3];
    const hexColor = ConvertRGBtoHex(r, g, b);
    colorCounts[hexColor] = colorCounts[hexColor] || 0;
    colorCounts[hexColor] = colorCounts[hexColor] + 1;
  }

  const mostFrequentPair = sortBy(
      toPairs(colorCounts),
      ([key, v]) => v
  ).reverse();
  const mostFrequentColor = mostFrequentPair[0][0];
  return mostFrequentColor;
}

async function getBgColor(url:string):Promise<string> {
  const imageData = await loadImage(url);
  const canvas = createCanvas(imageData.width, imageData.height);
  const context = canvas.getContext("2d");

  context.drawImage(imageData, 0, 0, imageData.width, imageData.height);
  const imagePixels = context.getImageData(0, 0, imageData.width, imageData.height);
  return extractBgColor(
      imagePixels.data,
      imageData.width,
      imageData.height
  );

}


export async function getHtml(parsedReq: ParsedRequest) {
  const {
    text,
    theme,
    md,
    fontSize,
    images,
    widths,
    heights,
    wizard,
    wizardImage,
    bgColor
  } = parsedReq;

  const fontSizeToUse = getFontSizeForTitleText(text, fontSize);

  if (wizard) {
    return getWizardHtml(parsedReq);
  }

  const image = wizardImage
    ? `https://nftz.forgottenrunes.com/wizards/alt/400-nobg/wizard-${wizardImage}.png`
    : images[0];

  // TODO
  return `<!DOCTYPE html>
<html>
    <meta charset="utf-8">
    <title>Generated Image</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        ${getCss({ theme: "dark", fontSize: fontSizeToUse, bgColor })}
    </style>
    <body>
        <div class="sides-layout">
            <div class="logo-wrapper" style="background-color: ${images[0] ?  await getBgColor(images[0]) : "inherit"}">
                ${getImage(image, "auto", "auto")}
            </div>
            <div class="heading">${emojify(
              md ? marked(text) : sanitizeHtml(text)
            )}
            </div>
        </div>
    </body>
</html>`;
}

export function getWizardHtml(parsedReq: ParsedRequest) {
  const {
    text,
    theme,
    md,
    fontSize,
    images,
    widths,
    heights,
    wizard,
    bgColor
  } = parsedReq;

  const wizardData: any = wizData[wizard.toString()];
  let image = `https://nftz.forgottenrunes.com/wizards/alt/400-nobg/wizard-${wizard}.png`;
  let wizardText = `${wizardData.name} (#${wizard})`;

  const fontSizeToUse = getFontSizeForTitleText(wizardText, fontSize);

  return `<!DOCTYPE html>
<html>
    <meta charset="utf-8">
    <title>Generated Image</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        ${getCss({ theme: theme, fontSize: fontSizeToUse, wizard: wizardData })}
    </style>
    <body>
        <div class="sides-layout">
            <div class="logo-wrapper">
                ${getImage(image, "auto", "auto")}
            </div>
            <div class="heading">${emojify(
              md ? marked(wizardText) : sanitizeHtml(wizardText)
            )}
            </div>
        </div>
    </body>
</html>`;
}

function getImage(src: string, width = "auto", height = "225") {
  return `<img
        class="logo"
        alt="Generated Image"
        src="${sanitizeHtml(src)}"
        width="${sanitizeHtml(width)}"
        height="${sanitizeHtml(height)}"
    />`;
}
