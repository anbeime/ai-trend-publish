import { Theme } from "@src/modules/md-converter/themes/types.ts";
import {
  ConverterFunc,
  MarkdownElement,
} from "@src/modules/md-converter/types/index.ts";
import { makeStyleText } from "@src/modules/md-converter/utils/index.ts";

export const codespanConverter: ConverterFunc<MarkdownElement.CodeSpan> = (
  styles: Theme,
  text: string,
) => {
  return `<code style="${
    makeStyleText(
      styles[MarkdownElement.CodeSpan],
    )
  }">${text}</code>`;
};

export const codespanConverterFactory = (styles: Theme) => {
  return (text: string) => codespanConverter(styles, text);
};
