import { Theme } from "@src/modules/md-converter/themes/types.ts";
import {
  ConverterFunc,
  MarkdownElement,
} from "@src/modules/md-converter/types/index.ts";
import { makeStyleText } from "@src/modules/md-converter/utils/styles.ts";

export const strongConverter: ConverterFunc<MarkdownElement.Strong> = (
  styles: Theme,
  text: string,
) => {
  return `<strong style="${makeStyleText(styles.strong)}">${text}</strong>`;
};

export const strongConverterFactory = (styles: Theme) => {
  return (text: string) => strongConverter(styles, text);
};
