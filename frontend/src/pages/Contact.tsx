import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

const WA_NUMBER = '5491140000000'; // reemplazar con número real
const WA_MESSAGE = encodeURIComponent('Hola! Quiero hacer una consulta sobre un producto.');

export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Contacto</h1>
        <p className="text-gray-500">Estamos para ayudarte. Escribinos por WhatsApp o por cualquiera de estos medios.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { icon: Phone, title: 'Teléfono', lines: ['(011) 4000-0000'], sub: 'Lun–Vie 9:00–18:00' },
          { icon: Mail, title: 'Email', lines: ['ventas@santyhogar.com.ar'], sub: 'Respondemos en 24hs' },
          { icon: MapPin, title: 'Ubicación', lines: ['Viamonte 1261, B° Pueyrredón'], sub: 'Córdoba, Argentina' },
          { icon: Clock, title: 'Horarios', lines: ['Lun–Vie: 9:00 – 18:00'], sub: 'Sáb: 9:00 – 13:00' },
        ].map(({ icon: Icon, title, lines, sub }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card p-5 flex items-start gap-4"
          >
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{title}</p>
              {lines.map(l => <p key={l} className="text-sm text-gray-700">{l}</p>)}
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* WhatsApp CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-[#25D366] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="text-white text-center sm:text-left">
          <p className="font-bold text-lg leading-tight">¿Preferís hablar por WhatsApp?</p>
          <p className="text-green-100 text-sm mt-0.5">Respondemos al instante en horario comercial</p>
        </div>
        <a
          href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 bg-white text-[#25D366] font-bold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors whitespace-nowrap flex-shrink-0"
        >
          {/* WhatsApp SVG icon */}
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
          Escribinos por WhatsApp
        </a>
      </motion.div>
    </div>
  );
}
