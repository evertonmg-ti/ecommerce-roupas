import Link from "next/link";
import { ForgotPasswordForm } from "@/app/login/forgot-password-form";
import { getCustomerSession } from "@/lib/auth";
import { CustomerLoginForm } from "./login-form";

type CustomerLoginPageProps = {
  searchParams?: Promise<{ redirectTo?: string }>;
};

export default async function CustomerLoginPage({
  searchParams
}: CustomerLoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const session = await getCustomerSession();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Conta</p>
        <h1 className="mt-3 font-display text-4xl">Entrar</h1>
        <p className="mt-4 text-sm text-espresso/65">
          {session
            ? `Sessao ativa para ${session.name ?? "cliente"}.`
            : "Acesse sua conta para acompanhar pedidos, salvar enderecos e comprar mais rapido."}
        </p>
        <div className="mt-8">
          <CustomerLoginForm redirectTo={params?.redirectTo} />
        </div>
        <div className="mt-6 text-sm text-espresso/65">
          Ainda nao tem conta?{" "}
          <Link href="/cadastro" className="text-terracotta underline">
            Criar agora
          </Link>
        </div>
        <ForgotPasswordForm />
      </div>
    </section>
  );
}
