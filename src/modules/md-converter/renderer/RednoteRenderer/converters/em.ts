import { Theme } from "@src/modules/md-converter/themes/types.ts";
import {
  ConverterFunc,
  MarkdownElement,
} from "@src/modules/md-converter/types/index.ts";
import { makeStyleText } from "@src/modules/md-converter/utils/index.ts";

export const emConverter: ConverterFunc<MarkdownElement.EM> = (
  styles: Theme,
  text: string,
) => {
  return `<em style="${
    makeStyleText(
      styles[MarkdownElement.EM],
    )
  }">${text}</em>`;
};

export const emConverterFactory = (styles: Theme) => {
  return (text: string) => emConverter(styles, text);
};
