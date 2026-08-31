import { Theme } from "@src/modules/md-converter/themes/types.ts";
import {
  ConverterFunc,
  LinkConverterOptions,
  MarkdownElement,
} from "@src/modules/md-converter/types/index.ts";
import { makeStyleText } from "@src/modules/md-converter/utils/index.ts";

export const linkConverter: ConverterFunc<MarkdownElement.Link> = (
  styles: Theme,
  options: LinkConverterOptions,
  href: string,
  title: string,
  text: string,
) => {
  const titleAttr = title ? ` title="${title}"` : "";
  return `<a href="${href}"${titleAttr} style="${
    makeStyleText(
      styles[MarkdownElement.Link],
    )
  }">${text}</a>`;
};

export const linkConverterFactory = (
  styles: Theme,
  options: LinkConverterOptions,
) => {
  return (href: string, title: string, text: string) =>
    linkConverter(styles, options, href, title, text);
};
