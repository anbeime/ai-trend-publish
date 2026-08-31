import { Theme } from "@src/modules/md-converter/themes/types.ts";
import {
  ConverterFunc,
  MarkdownElement,
} from "@src/modules/md-converter/types/index.ts";
import { makeStyleText } from "@src/modules/md-converter/utils/index.ts";

export const listItemConverter: ConverterFunc<MarkdownElement.ListItem> = (
  styles: Theme,
  text: string,
  task: boolean,
  checked: boolean,
) => {
  let checkbox = "";
  if (task) {
    checkbox = `<input type="checkbox" ${
      checked ? "checked" : ""
    } disabled /> `;
  }
  return `<li style="${
    makeStyleText(
      styles[MarkdownElement.ListItem],
    )
  }">${checkbox}${text}</li>`;
};

export const listItemConverterFactory = (styles: Theme) => {
  return (text: string, task: boolean, checked: boolean) =>
    listItemConverter(styles, text, task, checked);
};
