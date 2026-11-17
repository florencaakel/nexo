import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Nexo | Entrevista guiada e revisão humana", template: "%s | Nexo" },
  description: "Relatos organizados por regras, com referências ao texto original. Demonstração com casos fictícios, entrevista guiada e revisão humana.",
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
