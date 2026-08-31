import { Theme } from "@src/modules/md-converter/themes/types.ts";
import {
  ConverterFunc,
  MarkdownElement,
} from "@src/modules/md-converter/types/index.ts";
import { makeStyleText } from "@src/modules/md-converter/utils/styles.ts";

export const listItemConverter: ConverterFunc<MarkdownElement.ListItem> = (
  styles: Theme,
  text: string,
) => {
  return `<li style="${makeStyleText(styles.listItem)}">${text}</li>`;
};

export const listItemConverterFactory = (styles: Theme) => {
  return (text: string, task: boolean, checked: boolean) =>
    listItemConverter(styles, text, task, checked);
};
