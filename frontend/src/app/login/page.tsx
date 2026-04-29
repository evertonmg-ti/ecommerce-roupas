import { getAdminSession } from "@/lib/auth";
import { ForgotPasswordForm } from "./forgot-password-form";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams?: Promise<{ redirectTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const session = await getAdminSession();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Acesso</p>
        <h1 className="mt-3 font-display text-4xl">Entrar</h1>
        <p className="mt-4 text-sm text-espresso/65">
          {session?.role === "ADMIN"
            ? `Sessao ativa para ${session.name ?? "administrador"}.`
            : "Use uma conta administrativa para acessar o painel."}
        </p>
        <LoginForm redirectTo={params?.redirectTo} />
        <ForgotPasswordForm />
      </div>
    </section>
  );
}
