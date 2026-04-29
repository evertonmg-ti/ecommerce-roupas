import Link from "next/link";
import { CustomerRegisterForm } from "./register-form";

export default function CustomerRegisterPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Conta</p>
        <h1 className="mt-3 font-display text-4xl">Criar cadastro</h1>
        <p className="mt-4 text-sm text-espresso/65">
          Salve seus enderecos, acompanhe pedidos e compre com mais rapidez.
        </p>
        <CustomerRegisterForm />
        <div className="mt-6 text-sm text-espresso/65">
          Ja tem conta?{" "}
          <Link href="/entrar" className="text-terracotta underline">
            Entrar agora
          </Link>
        </div>
      </div>
    </section>
  );
}
