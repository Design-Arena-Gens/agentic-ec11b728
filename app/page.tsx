"use client";

import { FormEvent, useState, useTransition } from "react";

const DEFAULT_URL = "https://nepalenotes.com/2021/12/class-12-notes/";

export default function HomePage() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const inputUrl = formData.get("url");

    if (typeof inputUrl !== "string" || inputUrl.trim().length === 0) {
      setError("Enter a valid source URL.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/export", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: inputUrl }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Export failed. Try again later.");
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "class-12-notes.docx";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        setMessage("Word document exported successfully. Check your downloads folder.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error. Try again.");
      }
    });
  };

  return (
    <main>
      <section>
        <h1>Class 12 Notes Word Export</h1>
        <p>
          Generate a clean Word document of the Class 12 notes directly from the
          source page. Paste a custom URL if the notes move elsewhere.
        </p>
        <div className="output-card">
          <p>
            <strong>Source:</strong> <a href={DEFAULT_URL}>{DEFAULT_URL}</a>
          </p>
          <small>
            The exporter fetches the live webpage, keeps the educational content,
            and reformats it into a .docx file ready for sharing or offline
            study.
          </small>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="url">Notes source URL</label>
          <input
            id="url"
            name="url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            required
          />

          <button type="submit" disabled={isPending}>
            {isPending ? "Building Word document..." : "Export as Word"}
          </button>
        </form>

        {message && <p>{message}</p>}
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      </section>
    </main>
  );
}
