import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Aviso de privacidad | Sistema de Gestión",
};

const apartados = [
  {
    titulo: "1. Responsable de los datos personales",
    contenido:
      "[PENDIENTE: nombre o razón social y domicilio del responsable del tratamiento].",
  },
  {
    titulo: "2. Datos personales recabados",
    contenido:
      "Para registrar y administrar cuentas de acceso se recabarán el nombre del usuario, correo electrónico y credenciales de autenticación. Las contraseñas se almacenarán mediante mecanismos de hash y no en texto plano. También podrán mantenerse registros técnicos relacionados con el acceso y la seguridad.",
  },
  {
    titulo: "3. Finalidades del tratamiento",
    contenido:
      "Los datos serán utilizados para registrar empresas, administrar cuentas, identificar usuarios, autenticar sesiones, asignar permisos y proteger el acceso a la información correspondiente a cada organización. No se utilizarán para fines publicitarios en este proyecto.",
  },
  {
    titulo: "4. Transferencias y proveedores",
    contenido:
      "[PENDIENTE: identificar proveedores de alojamiento, encargados del tratamiento y, en su caso, las transferencias de datos que efectivamente se realicen].",
  },
  {
    titulo: "5. Seguridad de la información",
    contenido:
      "El sistema contempla autenticación, autorización basada en roles, separación de información entre empresas y mecanismos técnicos de protección de las credenciales y sesiones. Estas medidas se verificarán durante las pruebas del sistema.",
  },
  {
    titulo: "6. Derechos ARCO",
    contenido:
      "Las personas titulares podrán solicitar el acceso, rectificación, cancelación u oposición al tratamiento de sus datos conforme a la legislación aplicable. [PENDIENTE: medio de contacto, requisitos y procedimiento para presentar solicitudes].",
  },
  {
    titulo: "7. Limitación del uso y divulgación",
    contenido:
      "[PENDIENTE: medios disponibles para limitar el uso o divulgación de los datos personales].",
  },
  {
    titulo: "8. Conservación y eliminación",
    contenido:
      "[PENDIENTE: definir periodos de conservación de datos y procedimiento de eliminación o bloqueo, considerando las obligaciones aplicables].",
  },
  {
    titulo: "9. Cambios al aviso",
    contenido:
      "Las modificaciones al aviso se comunicarán mediante [PENDIENTE: procedimiento y medio para informar cambios].",
  },
];

export default function PaginaAvisoPrivacidad() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <header className="bg-brand-950 px-8 py-9 text-white">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck size={34} />
            <h1 className="text-2xl font-bold">Aviso de privacidad</h1>
          </div>

          <p className="text-sm text-blue-100">
            Sistema de Gestión para Microempresas
          </p>
        </header>

        <div className="space-y-7 p-6 md:p-9">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Documento en preparación.</strong>
            <p className="mt-2">
              Este aviso contiene información pendiente de completar y revisar
              antes de utilizar datos personales reales.
            </p>
          </div>

          <p className="leading-7 text-slate-600">
            El presente documento describe el tratamiento previsto de los datos
            personales utilizados por la aplicación web para la gestión de
            microempresas.
          </p>

          {apartados.map((apartado) => (
            <section
              key={apartado.titulo}
              className="border-b border-slate-100 pb-5 last:border-0"
            >
              <h2 className="mb-3 text-lg font-bold text-brand-950">
                {apartado.titulo}
              </h2>

              <p className="leading-7 text-slate-600">{apartado.contenido}</p>
            </section>
          ))}

          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
            <strong>Referencia normativa:</strong>
            <p className="mt-1">
              Ley Federal de Protección de Datos Personales en Posesión de los
              Particulares, México.
            </p>
          </div>

          <Link
            href="/registro"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-5 py-3 font-semibold text-white hover:bg-blue-900"
          >
            <ArrowLeft size={18} />
            Volver al registro
          </Link>
        </div>
      </article>
    </main>
  );
}
