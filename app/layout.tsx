import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import { Toaster } from "sonner";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Validador de Ideas Multi-Agente",
  description: "Debate adversarial de agentes de IA para validar tus ideas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
        <Toaster position="top-center" theme="light" richColors />
      </body>
    </html>
  );
}
