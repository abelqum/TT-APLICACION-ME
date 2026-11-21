import "./globals.css";

export const metadata = {
  title: "Sistema de Gestión para Microempresas",
  description: "Gestión de ingresos, egresos, inventario, viáticos y tareas.",
};

export default function LayoutPrincipal({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-100">{children}</body>
    </html>
  );
}
