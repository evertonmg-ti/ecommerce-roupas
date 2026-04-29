"use client";

import { useActionState } from "react";
import {
  forgotPasswordAction,
  type ForgotPasswordFormState
} from "./forgot-password.actions";

const initialState: ForgotPasswordFormState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState
  );

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-5">
      <div>
        <label className="mb-2 block text-sm">Recuperar senha</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
          placeholder="seu@email.com"
        />
      </div>
      {state.success ? (
        <p className="rounded-2xl border border-moss/20 bg-moss/10 px-4 py-3 text-sm text-moss">
          Se o email existir na base, enviamos as instrucoes de recuperacao.
        </p>
      ) : null}
      {state.error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        disabled={pending}
        className="rounded-full border border-espresso/15 px-5 py-3 text-sm disabled:opacity-70"
      >
        {pending ? "Enviando..." : "Enviar link de recuperacao"}
      </button>
    </form>
  );
}
