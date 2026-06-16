import { Theme } from "@src/modules/md-converter/themes/types.ts";
import {
  ConverterFunc,
  MarkdownElement,
} from "@src/modules/md-converter/types/index.ts";
import { makeStyleText } from "@src/modules/md-converter/utils/styles.ts";

export const EMConverter: ConverterFunc<MarkdownElement.EM> = (
  styles: Theme,
  text: string,
) => {
  return `<span style="${makeStyleText(styles.em)}">${text}</span>`;
};

export const EMConverterFactory = (styles: Theme) => {
  return (text: string) => EMConverter(styles, text);
};
