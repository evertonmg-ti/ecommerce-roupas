"use client";

import { useActionState } from "react";
import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = {};

type LoginFormProps = {
  redirectTo?: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo ?? "/admin"} />
      <div>
        <label className="mb-2 block text-sm">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
          placeholder="admin@fashionstore.com"
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
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

