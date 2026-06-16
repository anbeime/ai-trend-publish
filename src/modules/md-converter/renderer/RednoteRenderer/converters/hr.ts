import { Theme } from "@src/modules/md-converter/themes/types.ts";
import {
  ConverterFunc,
  MarkdownElement,
} from "@src/modules/md-converter/types/index.ts";

export const hrConverter: ConverterFunc<MarkdownElement.HR> = (
  styles: Theme,
) => {
  return `<hr />`;
};

export const hrConverterFactory = (styles: Theme) => {
  return () => hrConverter(styles);
};
