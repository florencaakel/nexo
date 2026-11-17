import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Nexo | Triagem jurídica assistida por IA", template: "%s | Nexo" },
  description: "Histórias compreendidas. Informações organizadas. Demonstração de triagem jurídica com casos fictícios e revisão humana.",
  icons: {
    icon: "/site/favicon.svg",
    shortcut: "/site/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body><a className="skip-link" href="#conteudo">Ir para o conteúdo</a>{children}</body>
    </html>
  );
}
