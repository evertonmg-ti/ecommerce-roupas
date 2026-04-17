export function Footer() {
  return (
    <footer className="border-t border-espresso/10 bg-white/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <p className="font-display text-xl">Maison Aurea</p>
          <p className="mt-3 max-w-sm text-espresso/70">
            E-commerce de moda com curadoria premium, experiencia rapida e painel
            administrativo pronto para crescer.
          </p>
        </div>
        <div>
          <p className="font-medium">Navegacao</p>
          <div className="mt-3 space-y-2 text-espresso/70">
            <p>Catalogo</p>
            <p>Pedidos</p>
            <p>Administracao</p>
          </div>
        </div>
        <div>
          <p className="font-medium">Operacao</p>
          <div className="mt-3 space-y-2 text-espresso/70">
            <p>Checkout otimizado</p>
            <p>Estoque centralizado</p>
            <p>Base pronta para pagamentos e frete</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

