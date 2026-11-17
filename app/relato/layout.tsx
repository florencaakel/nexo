import type { Metadata } from "next";
export const metadata: Metadata = { title: "Relato fictício", robots: { index: false, follow: false } };
export default function RelatoLayout({ children }: { children: React.ReactNode }) { return children; }
