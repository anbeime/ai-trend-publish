import { Theme } from "@src/modules/md-converter/themes/types.ts";
import {
  ConverterFunc,
  MarkdownElement,
} from "@src/modules/md-converter/types/index.ts";
import { makeStyleText } from "@src/modules/md-converter/utils/styles.ts";

export const paragraphConverter: ConverterFunc<MarkdownElement.Paragraph> = (
  styles: Theme,
  text: string,
) => {
  if (text.indexOf("<figure") != -1 && text.indexOf("<img") != -1) {
    return text;
  }
  return text.trim()
    ? `<p style="${makeStyleText(styles.paragraph)}">${text}</p>`
    : "";
};

export const paragraphConverterFactory = (styles: Theme) => {
  return (text: string) => paragraphConverter(styles, text);
};
