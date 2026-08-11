import React from 'react';
import { motion } from 'framer-motion';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gray-900 px-8 py-10 sm:px-12">
          <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl text-center">
            Términos y Condiciones
          </h1>
          <p className="mt-4 text-center text-primary-400 font-medium">
            SantyHogar
          </p>
        </div>
        
        <div className="px-8 py-10 sm:px-12 text-gray-700 space-y-8 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">1. Productos</h2>
            <p className="mb-3">
              Las fotografías, imágenes y descripciones de los productos tienen fines ilustrativos y pueden presentar diferencias con el producto entregado debido a actualizaciones realizadas por el fabricante.
            </p>
            <p>
              SantyHogar realiza esfuerzos razonables para mantener la información actualizada, aunque no garantiza la ausencia de errores tipográficos o involuntarios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">2. Precios</h2>
            <p className="mb-3">
              Todos los precios publicados se encuentran expresados en Pesos Argentinos (ARS).
            </p>
            <p className="mb-3">
              Los precios podrán modificarse sin previo aviso. No obstante, una vez confirmada una compra y acreditado el pago, el precio será respetado para dicha operación.
            </p>
            <p>
              Los precios incluyen los impuestos correspondientes, salvo que se indique expresamente lo contrario.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">3. Disponibilidad de productos</h2>
            <p className="mb-3">
              Todas las compras están sujetas a disponibilidad de stock.
            </p>
            <p className="mb-3">
              En caso de no existir disponibilidad luego de realizada la compra, SantyHogar informará al cliente y podrá ofrecer:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Esperar el ingreso del producto.</li>
              <li>Reemplazarlo por uno equivalente.</li>
              <li>Realizar el reintegro total del importe abonado.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">4. Medios de pago</h2>
            <p className="mb-3">
              El sitio acepta los medios de pago informados durante el proceso de compra, incluyendo Mercado Pago.
            </p>
            <p className="mb-3">
              SantyHogar no almacena datos completos de tarjetas de crédito o débito. El procesamiento de los pagos es realizado por plataformas externas especializadas.
            </p>
            <p>
              La compra será considerada confirmada una vez acreditado el pago.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">5. Envíos</h2>
            <p className="mb-3">
              Los envíos se realizan dentro de las zonas habilitadas por SantyHogar.
            </p>
            <p className="mb-3">
              Los plazos informados son estimativos y podrán variar por causas ajenas a la empresa, como demoras logísticas, condiciones climáticas, feriados u otros eventos de fuerza mayor.
            </p>
            <p>
              El cliente deberá verificar el estado del producto al momento de la recepción.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">6. Cambios, devoluciones y garantías</h2>
            <p className="mb-3">
              Los cambios y devoluciones se realizarán conforme a la legislación vigente de la República Argentina.
            </p>
            <p className="mb-3">
              Los productos deberán conservarse en buen estado y con todos sus accesorios, salvo cuando la devolución corresponda por una falla o defecto de fabricación.
            </p>
            <p>
              Los productos cuentan con la garantía legal correspondiente y, cuando aplique, con la garantía otorgada por el fabricante.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">7. Responsabilidad</h2>
            <p className="mb-3">
              SantyHogar no será responsable por interrupciones temporales del sitio, errores ocasionados por terceros, problemas de conectividad o causas de fuerza mayor.
            </p>
            <p>
              Nada de lo establecido en estos términos limita los derechos que la legislación argentina reconoce a los consumidores.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">8. Propiedad intelectual</h2>
            <p>
              Todo el contenido del sitio, incluyendo imágenes, logotipos, diseño, textos y elementos gráficos, pertenece a SantyHogar o a sus respectivos titulares y no podrá ser utilizado sin autorización.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">9. Modificaciones</h2>
            <p>
              SantyHogar podrá actualizar estos Términos y Condiciones en cualquier momento. Las modificaciones comenzarán a regir desde su publicación en el sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">10. Legislación aplicable</h2>
            <p>
              Estos Términos y Condiciones se rigen por las leyes de la República Argentina.
            </p>
          </section>

          <div className="mt-16 mb-8 pt-8 border-t-2 border-gray-100">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight sm:text-4xl text-center mb-4">
              POLÍTICA DE PRIVACIDAD
            </h1>
            <p className="text-center text-sm text-gray-500 font-medium">
              Última actualización: 26 de junio de 2026
            </p>
            <p className="text-center mt-4 mb-8">
              En SantyHogar valoramos y protegemos la privacidad de nuestros clientes.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">1. Información que recopilamos</h2>
            <p className="mb-3">Podremos solicitar la siguiente información:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Nombre y apellido.</li>
              <li>Documento (cuando sea necesario).</li>
              <li>Correo electrónico.</li>
              <li>Número de teléfono.</li>
              <li>Dirección de envío.</li>
              <li>Dirección de facturación.</li>
              <li>Información necesaria para procesar la compra.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">2. Finalidad del tratamiento</h2>
            <p className="mb-3">La información recopilada será utilizada para:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Procesar pedidos.</li>
              <li>Coordinar envíos.</li>
              <li>Emitir comprobantes.</li>
              <li>Brindar soporte al cliente.</li>
              <li>Informar sobre el estado de una compra.</li>
              <li>Cumplir obligaciones legales.</li>
            </ul>
            <p>
              No utilizaremos los datos personales para fines distintos sin el consentimiento del usuario, salvo que la ley lo permita.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">3. Pagos</h2>
            <p className="mb-3">
              Los pagos son procesados mediante plataformas de pago seguras, como Mercado Pago.
            </p>
            <p>
              SantyHogar no almacena números completos de tarjetas de crédito, códigos de seguridad ni otra información financiera sensible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">4. Cookies</h2>
            <p className="mb-3">
              Este sitio puede utilizar cookies para mejorar la navegación, recordar preferencias del usuario y obtener estadísticas de uso.
            </p>
            <p>
              El usuario puede configurar su navegador para bloquear o eliminar las cookies si así lo desea.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">5. Compartición de datos</h2>
            <p className="mb-3">Los datos podrán compartirse únicamente con:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Empresas de logística para realizar entregas.</li>
              <li>Plataformas de pago.</li>
              <li>Proveedores tecnológicos necesarios para el funcionamiento del sitio.</li>
              <li>Autoridades competentes cuando la legislación lo exija.</li>
            </ul>
            <p>SantyHogar no comercializa datos personales.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">6. Seguridad</h2>
            <p className="mb-3">
              Implementamos medidas técnicas y organizativas razonables para proteger la información contra accesos no autorizados, alteraciones o pérdidas.
            </p>
            <p>
              Sin embargo, ningún sistema puede garantizar seguridad absoluta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">7. Derechos del usuario</h2>
            <p className="mb-3">El usuario podrá solicitar:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Acceder a sus datos personales.</li>
              <li>Rectificarlos.</li>
              <li>Actualizarlos.</li>
              <li>Solicitar su eliminación cuando corresponda.</li>
            </ul>
            <p>
              Las solicitudes podrán realizarse mediante los canales de contacto publicados en el sitio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">8. Modificaciones</h2>
            <p className="mb-3">
              SantyHogar podrá actualizar esta Política de Privacidad cuando resulte necesario para reflejar cambios normativos, tecnológicos o comerciales.
            </p>
            <p>
              Las modificaciones entrarán en vigencia desde su publicación.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsAndConditions;
