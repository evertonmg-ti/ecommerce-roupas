"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

type ReturnRequestFormProps = {
  orderId: string;
  items: Array<{
    id: string;
    name: string;
    variantLabel?: string;
  }>;
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

export function CustomerReturnRequestForm({
  orderId,
  items
}: ReturnRequestFormProps) {
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
      setUploadError("Envie no maximo 4 anexos por solicitacao.");
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
        "Os anexos devem ser imagens ou PDF com no maximo 2 MB por arquivo."
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
      setUploadError("Nao foi possivel preparar os anexos para envio.");
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
    const type = String(formData.get("type") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();
    const details = String(formData.get("details") ?? "").trim() || undefined;
    const selectedItemIds = formData
      .getAll("selectedItemIds")
      .map((value) => String(value).trim())
      .filter(Boolean);

    if (!type || !reason || selectedItemIds.length === 0) {
      setSubmitError("Selecione ao menos um item e preencha o motivo da solicitacao.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const response = await fetch("/api/customer/return-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        orderId,
        type,
        reason,
        details,
        items: selectedItemIds.map((orderItemId) => ({
          orderItemId,
          quantity: 1
        })),
        attachments: selectedFiles
      })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;
      const message = Array.isArray(payload?.message)
        ? payload.message[0]
        : payload?.message;
      setSubmitError(message ?? "Nao foi possivel enviar a solicitacao.");
      setIsSubmitting(false);
      return;
    }

    form.reset();
    setSelectedFiles([]);
    setUploadError(null);
    setSubmitError(null);
    setIsSubmitting(false);
    router.push("/conta?success=return_request_created");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-[1.25rem] border border-espresso/10 bg-white/50 p-4">
      <p className="text-sm font-medium">Solicitar devolucao ou troca</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span>Tipo</span>
          <select
            name="type"
            defaultValue="EXCHANGE"
            className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3"
          >
            <option value="EXCHANGE">Troca</option>
            <option value="REFUND">Devolucao</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span>Motivo</span>
          <input
            name="reason"
            required
            minLength={5}
            className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3"
            placeholder="Ex.: tamanho incorreto"
          />
        </label>
      </div>
      <label className="mt-4 block space-y-2 text-sm">
        <span>Detalhes</span>
        <textarea
          name="details"
          rows={3}
          className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3"
          placeholder="Conte o que aconteceu e como prefere resolver."
        />
      </label>
      <label className="mt-4 block space-y-2 text-sm">
        <span>Anexos e fotos</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={handleFilesChange}
          className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 text-sm"
        />
        <p className="text-xs text-espresso/55">
          Ate 4 arquivos, com no maximo 2 MB cada. Imagens e PDF.
        </p>
      </label>
      {uploadError ? (
        <div className="mt-3 rounded-[1rem] border border-terracotta/20 bg-terracotta/10 p-3 text-sm text-terracotta">
          {uploadError}
        </div>
      ) : null}
      {submitError ? (
        <div className="mt-3 rounded-[1rem] border border-terracotta/20 bg-terracotta/10 p-3 text-sm text-terracotta">
          {submitError}
        </div>
      ) : null}
      {selectedFiles.length > 0 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {selectedFiles.map((file) => (
            <div
              key={`${file.fileName}-${file.sizeBytes}`}
              className="rounded-[1rem] border border-espresso/10 bg-sand/35 p-3 text-sm"
            >
              {file.mimeType.startsWith("image/") ? (
                <img
                  src={file.dataUrl}
                  alt={file.fileName}
                  className="mb-3 h-32 w-full rounded-xl object-cover"
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
      <div className="mt-4 space-y-2 text-sm">
        <p className="text-espresso/70">Itens da solicitacao</p>
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-2">
            <input type="checkbox" name="selectedItemIds" value={item.id} />
            {item.name}
            {item.variantLabel ? ` - ${item.variantLabel}` : ""}
          </label>
        ))}
      </div>
      <button
        disabled={isSubmitting}
        className="mt-4 rounded-full bg-espresso px-5 py-3 text-sm text-sand disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Enviando..." : "Enviar solicitacao"}
      </button>
    </form>
  );
}
