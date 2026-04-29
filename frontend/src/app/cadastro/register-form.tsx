"use client";

import { useActionState } from "react";
import {
  customerRegisterAction,
  type CustomerRegisterState
} from "@/app/cadastro/actions";

const initialState: CustomerRegisterState = {};

export function CustomerRegisterForm() {
  const [state, formAction, pending] = useActionState(
    customerRegisterAction,
    initialState
  );

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label className="mb-2 block text-sm">Nome</label>
        <input
          name="name"
          required
          className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
          placeholder="Seu nome"
        />
      </div>
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
          minLength={6}
          required
          className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
          placeholder="Minimo de 6 caracteres"
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
        {pending ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
