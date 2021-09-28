import {readFileSync} from "fs";
import marked from "marked";
import {sanitizeHtml} from "./sanitizer";
import {ParsedRequest} from "./types";
// import {createCanvas, loadImage} from "node-canvas";
import productionWizardData = require("../data/nfts-prod.json");

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
  let foreground = getContrast(bgColor);
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
        padding: 28px;
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
        width: 100%;
        image-rendering: pixelated;
        object-fit: contain;
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

/*!
 * Get the contrasting color for any hex color
 * (c) 2021 Chris Ferdinandi, MIT License, https://gomakethings.com
 * Derived from work by Brian Suda, https://24ways.org/2010/calculating-color-contrast/
 * @param  {String} A hexcolor value
 * @return {String} The contrasting color (black or white)
 */
export function getContrast(hexcolor: string) {
  if (!hexcolor) return "white";

  // If a leading # is provided, remove it
  if (hexcolor.slice(0, 1) === "#") {
    hexcolor = hexcolor.slice(1);
  }

  // If a three-character hexcode, make six-character
  if (hexcolor.length === 3) {
    hexcolor = hexcolor
        .split("")
        .map(function (hex) {
          return hex + hex;
        })
        .join("");
  }

  // Convert to RGB value
  let r = parseInt(hexcolor.substr(0, 2), 16);
  let g = parseInt(hexcolor.substr(2, 2), 16);
  let b = parseInt(hexcolor.substr(4, 2), 16);

  // Get YIQ ratio
  let yiq = (r * 299 + g * 587 + b * 114) / 1000;

  // Check contrast
  return yiq >= 128 ? "black" : "white";
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
            <div class="logo-wrapper" >
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
