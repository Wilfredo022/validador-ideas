import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Página no encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Esa ruta no existe o la idea ya no está disponible.
      </p>
      <Link href="/" className="btn btn-primary mt-6 inline-flex">
        <Home size={16} />
        Volver al inicio
      </Link>
    </div>
  );
}
