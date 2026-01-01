declare module "html-to-docx" {
  interface HtmlToDocxOptions {
    table?: {
      row?: {
        cantSplit?: boolean;
      };
    };
    footer?: boolean;
    pageNumber?: boolean;
  }

  export default function htmlToDocx(
    html: string,
    stylesXml?: string | null,
    options?: HtmlToDocxOptions,
  ): Promise<Buffer>;
}
