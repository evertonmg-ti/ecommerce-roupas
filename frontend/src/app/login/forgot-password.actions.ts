"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type ForgotPasswordFormState = {
  success?: boolean;
  error?: string;
};

export async function forgotPasswordAction(
  _prevState: ForgotPasswordFormState,
  formData: FormData
): Promise<ForgotPasswordFormState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Informe um email para recuperar a senha." };
  }

  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email }),
    cache: "no-store"
  });

  if (!response.ok) {
    return { error: "Nao foi possivel iniciar a recuperacao de senha." };
  }

  return { success: true };
}
