"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type ResetPasswordFormState = {
  success?: boolean;
  error?: string;
};

export async function resetPasswordAction(
  _prevState: ResetPasswordFormState,
  formData: FormData
): Promise<ResetPasswordFormState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

  if (!token) {
    return { error: "Token de recuperacao invalido." };
  }

  if (password.length < 8) {
    return { error: "A nova senha deve ter ao menos 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "A confirmacao da senha nao confere." };
  }

  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token, password }),
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message;

    return { error: message ?? "Nao foi possivel redefinir a senha." };
  }

  return { success: true };
}
