import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X } from 'lucide-react';

interface SaveAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (label: string) => void;
  address: {
    street: string;
    city: string;
    province: string;
    zip: string;
  };
}

const SaveAddressModal: React.FC<SaveAddressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  address,
}) => {
  const [label, setLabel] = useState('Casa');

  const handleSave = () => {
    if (label.trim()) {
      onSave(label.trim());
      // No llamar onClose() aqu├¡, onSave ya maneja el cierre
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 mb-4">
                <MapPin className="text-primary-600" size={24} />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ┬┐Guardar esta direcci├│n?
              </h3>

              {/* Address preview */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-700">
                <p className="font-medium">{address.street}</p>
                <p>{address.city}, {address.province} {address.zip}</p>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4">
                Guard├í esta direcci├│n para usarla en futuros pedidos y hacer el checkout m├ís r├ípido.
              </p>

              {/* Label input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la direcci├│n
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ej: Casa, Trabajo, Oficina"
                  className="input-field"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSave();
                    }
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  No guardar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!label.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar direcci├│n
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SaveAddressModal;
