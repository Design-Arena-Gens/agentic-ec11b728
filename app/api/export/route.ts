import { NextResponse } from "next/server";
import { load } from "cheerio";
import htmlToDocx from "html-to-docx";

const DEFAULT_FILENAME = "class-12-notes.docx";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (typeof url !== "string" || url.trim().length === 0) {
      return NextResponse.json({ error: "Missing URL." }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol)) {
        throw new Error("Only HTTP(S) URLs are supported.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid URL provided.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const response = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page (${response.status}).` },
        { status: 502 },
      );
    }

    const html = await response.text();
    const $ = load(html);

    const title = $("h1").first().text().trim() || "Class 12 Notes";

    const contentRoot = $(".elementor-widget-theme-post-content .elementor-widget-container").first();

    const sanitized = contentRoot.length ? contentRoot.clone() : $("main").first().clone();

    if (!sanitized || sanitized.length === 0) {
      return NextResponse.json(
        { error: "Could not locate content on the page." },
        { status: 422 },
      );
    }

    sanitized.find("script, style, noscript, iframe").remove();

    sanitized.find("img").each((_, element) => {
      const $element = $(element);
      const dataSrc = $element.attr("data-lazy-src") || $element.attr("data-src");
      if (dataSrc && !$element.attr("src")) {
        $element.attr("src", dataSrc);
      }

      const src = $element.attr("src");
      if (src && src.startsWith("//")) {
        $element.attr("src", `${parsed.protocol}${src}`);
      } else if (src && src.startsWith("/")) {
        $element.attr("src", `${parsed.origin}${src}`);
      }
    });

    sanitized.find("a").each((_, element) => {
      const $element = $(element);
      const href = $element.attr("href");
      if (!href) {
        return;
      }
      if (href.startsWith("//")) {
        $element.attr("href", `${parsed.protocol}${href}`);
      } else if (href.startsWith("/")) {
        $element.attr("href", `${parsed.origin}${href}`);
      }
    });

    const preparedHtml = `<!doctype html><html><body><h1>${title}</h1>${sanitized.html() ?? ""}</body></html>`;

    const docBuffer = await htmlToDocx(preparedHtml, null, {
      table: { row: { cantSplit: true } },
      footer: false,
      pageNumber: false,
    });

    return new NextResponse(docBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${DEFAULT_FILENAME}"`,
      },
    });
  } catch (error) {
    console.error("Export error", error);
    return NextResponse.json(
      { error: "Unexpected error. Please try again." },
      { status: 500 },
    );
  }
}
