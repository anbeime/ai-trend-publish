import { Theme } from "@src/modules/md-converter/themes/types.ts";
import {
  ConverterFunc,
  MarkdownElement,
} from "@src/modules/md-converter/types/index.ts";
import { makeStyleText } from "@src/modules/md-converter/utils/styles.ts";

export const codeSpanConverter: ConverterFunc<MarkdownElement.CodeSpan> = (
  styles: Theme,
  text: string,
) => {
  return `<code style="${makeStyleText(styles.codeSpan)}">${text}</code>`;
};

export const codeSpanConverterFactory = (styles: Theme) => {
  return (text: string) => codeSpanConverter(styles, text);
};
