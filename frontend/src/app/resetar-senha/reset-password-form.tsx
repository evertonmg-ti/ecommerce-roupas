"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  resetPasswordAction,
  type ResetPasswordFormState
} from "./actions";

const initialState: ResetPasswordFormState = {};

export function ResetPasswordForm({ token }: { token?: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState
  );

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="token" value={token ?? ""} />
      <div>
        <label className="mb-2 block text-sm">Nova senha</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm">Confirmar senha</label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
        />
      </div>
      {state.success ? (
        <div className="rounded-2xl border border-moss/20 bg-moss/10 px-4 py-3 text-sm text-moss">
          Senha redefinida com sucesso. <Link href="/login" className="underline">Voltar para login</Link>
        </div>
      ) : null}
      {state.error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        disabled={pending || !token}
        className="w-full rounded-full bg-espresso px-5 py-3 text-sand disabled:opacity-70"
      >
        {pending ? "Atualizando..." : "Redefinir senha"}
      </button>
    </form>
  );
}
