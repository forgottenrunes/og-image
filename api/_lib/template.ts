import { readFileSync } from "fs";
import marked from "marked";
import { sanitizeHtml } from "./sanitizer";
import { ParsedRequest } from "./types";
const twemoji = require("twemoji");
const twOptions = { folder: "svg", ext: ".svg" };
const emojify = (text: string) => twemoji.parse(text, twOptions);
import productionWizardData from "../data/nfts-prod.json";
const wizData = productionWizardData as { [wizardId: string]: any };

const rglr = readFileSync(`${__dirname}/../_fonts/alagard.woff2`).toString(
  "base64"
);

type WizardData = { name: string; image: string; background_color: string };

function getCss(theme: string, fontSize: string, wizard?: WizardData) {
  //   let background = "white";
  //   let foreground = "black";
  //   let radial = "lightgray";

  //   if (theme === "dark") {
  let background = wizard ? `#${wizard?.background_color}` : "black";
  let foreground = "white";
  let radial = "#69696978";
  //   }
  return `
    @font-face {
        font-family: 'MyAlagard';
        font-style:  normal;
        font-weight: normal;
        src: url(data:font/woff2;charset=utf-8;base64,${rglr}) format('woff2');
    }

    body {
        background: ${background};
        background-image: radial-gradient(circle at 25px 25px, ${radial} 2%, transparent 0%), radial-gradient(circle at 75px 75px, ${radial} 2%, transparent 0%);
        background-size: 100px 100px;
        height: 100vh;
        display: flex;
        text-align: center;
        align-items: center;
        justify-content: center;
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
        margin: 0 4em;
        width: 100%;
    }

    .logo-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        align-content: center;
        justify-content: center;
        justify-items: center;
    }

    .logo {
        height: auto;
        width: 100%;
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
        flex: 1;
        font-family: 'MyAlagard', sans-serif;
        font-size: ${sanitizeHtml(fontSize)};
        font-style: normal;
        color: ${foreground};
        line-height: 1.2;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding-left: 0.5em;
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

export function getHtml(parsedReq: ParsedRequest) {
  const { text, theme, md, fontSize, images, widths, heights, wizard } =
    parsedReq;
  console.log("wizard: ", wizard);
  const fontSizeToUse = getFontSizeForTitleText(text, fontSize);

  if (wizard) {
    return getWizardHtml(parsedReq);
  }

  // TODO
  return `<!DOCTYPE html>
<html>
    <meta charset="utf-8">
    <title>Generated Image</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        ${getCss("dark", fontSizeToUse)}
    </style>
    <body>
        <div class="sides-layout">
            <div class="logo-wrapper">
                ${getImage(images[0], widths[0], heights[0])}
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
  const { text, theme, md, fontSize, images, widths, heights, wizard } =
    parsedReq;

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
        ${getCss(theme, fontSizeToUse, wizardData)}
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
