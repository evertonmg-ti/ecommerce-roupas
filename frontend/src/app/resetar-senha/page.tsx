import { ResetPasswordForm } from "./reset-password-form";

type ResetPasswordPageProps = {
  searchParams?: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams
}: ResetPasswordPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const token = params?.token;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Recuperacao</p>
        <h1 className="mt-3 font-display text-4xl">Redefinir senha</h1>
        <p className="mt-4 text-sm text-espresso/65">
          Escolha uma nova senha para voltar a acessar o painel.
        </p>
        <ResetPasswordForm token={token} />
      </div>
    </section>
  );
}
