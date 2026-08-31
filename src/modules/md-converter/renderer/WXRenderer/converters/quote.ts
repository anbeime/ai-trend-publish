import { Theme } from "@src/modules/md-converter/themes/types.ts";
import {
  ConverterFunc,
  MarkdownElement,
} from "@src/modules/md-converter/types/index.ts";
import { makeStyleText } from "@src/modules/md-converter/utils/styles.ts";

export const quoteConverter: ConverterFunc<MarkdownElement.Quote> = (
  styles: Theme,
  text: string,
) => {
  text = text.replace(
    /<p.*?>/g,
    `<p style="${makeStyleText(styles.blockquoteParagraph)}">`,
  );
  return `<blockquote style="${
    makeStyleText(
      styles.quote,
    )
  }">${text}</blockquote>`;
};

export const quoteConverterFactory = (styles: Theme) => {
  return (text: string) => quoteConverter(styles, text);
};
