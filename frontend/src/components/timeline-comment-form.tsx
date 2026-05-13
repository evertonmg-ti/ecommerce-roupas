"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

type TimelineCommentFormProps = {
  endpoint: string;
  payload: Record<string, string>;
  label: string;
  placeholder: string;
  submitLabel: string;
  successRedirect: string;
  errorRedirect: string;
};

const maxFiles = 4;
const maxSizeBytes = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export function TimelineCommentForm({
  endpoint,
  payload,
  label,
  placeholder,
  submitLabel,
  successRedirect,
  errorRedirect
}: TimelineCommentFormProps) {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      dataUrl: string;
    }>
  >([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      setSelectedFiles([]);
      setUploadError(null);
      return;
    }

    if (files.length > maxFiles) {
      setSelectedFiles([]);
      setUploadError("Envie no maximo 4 anexos por comentario.");
      event.target.value = "";
      return;
    }

    const invalidFile = files.find(
      (file) =>
        file.size > maxSizeBytes ||
        (!file.type.startsWith("image/") && file.type !== "application/pdf")
    );

    if (invalidFile) {
      setSelectedFiles([]);
      setUploadError(
        "Os anexos do comentario devem ser imagens ou PDF com no maximo 2 MB."
      );
      event.target.value = "";
      return;
    }

    try {
      const preparedFiles = await Promise.all(
        files.map(async (file) => ({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          dataUrl: await readFileAsDataUrl(file)
        }))
      );

      setSelectedFiles(preparedFiles);
      setUploadError(null);
    } catch {
      setSelectedFiles([]);
      setUploadError("Nao foi possivel preparar os anexos do comentario.");
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (uploadError || isSubmitting) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const message = String(formData.get("message") ?? "").trim();

    if (message.length < 3) {
      setSubmitError("Escreva um comentario com pelo menos 3 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...payload,
        message,
        attachments: selectedFiles
      })
    });

    if (!response.ok) {
      const apiPayload = (await response.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;
      const messageFromApi = Array.isArray(apiPayload?.message)
        ? apiPayload.message[0]
        : apiPayload?.message;
      setSubmitError(messageFromApi ?? "Nao foi possivel enviar o comentario.");
      setIsSubmitting(false);
      return;
    }

    form.reset();
    setSelectedFiles([]);
    setUploadError(null);
    setSubmitError(null);
    setIsSubmitting(false);
    router.push(successRedirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="space-y-2 text-sm">
        <span>{label}</span>
        <textarea
          name="message"
          rows={3}
          minLength={3}
          required
          placeholder={placeholder}
          className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
        />
      </label>
      <label className="block space-y-2 text-sm">
        <span>Anexos opcionais</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={handleFilesChange}
          className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 text-sm"
        />
      </label>
      {uploadError ? (
        <div className="rounded-[1rem] border border-terracotta/20 bg-terracotta/10 p-3 text-sm text-terracotta">
          {uploadError}
        </div>
      ) : null}
      {submitError ? (
        <div className="rounded-[1rem] border border-terracotta/20 bg-terracotta/10 p-3 text-sm text-terracotta">
          {submitError}
        </div>
      ) : null}
      {selectedFiles.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {selectedFiles.map((file) => (
            <div
              key={`${file.fileName}-${file.sizeBytes}`}
              className="rounded-[1rem] border border-espresso/10 bg-white/70 p-3 text-sm"
            >
              {file.mimeType.startsWith("image/") ? (
                <img
                  src={file.dataUrl}
                  alt={file.fileName}
                  className="mb-3 h-24 w-full rounded-xl object-cover"
                />
              ) : null}
              <p className="font-medium text-espresso">{file.fileName}</p>
              <p className="mt-1 text-xs text-espresso/55">
                {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ))}
        </div>
      ) : null}
      <button
        disabled={isSubmitting}
        className="rounded-full border border-espresso/15 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Enviando..." : submitLabel}
      </button>
      <input type="hidden" name="redirectError" value={errorRedirect} />
    </form>
  );
}
