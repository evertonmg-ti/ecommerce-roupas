"use client";

import { useActionState } from "react";
import {
  customerLoginAction,
  type CustomerLoginState
} from "@/app/entrar/actions";

const initialState: CustomerLoginState = {};

export function CustomerLoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(
    customerLoginAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo ?? "/conta"} />
      <div>
        <label className="mb-2 block text-sm">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
          placeholder="cliente@email.com"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm">Senha</label>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
          placeholder="Sua senha"
        />
      </div>
      {state.error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        disabled={pending}
        className="w-full rounded-full bg-espresso px-5 py-3 text-sand disabled:opacity-70"
      >
        {pending ? "Entrando..." : "Entrar na conta"}
      </button>
    </form>
  );
}
