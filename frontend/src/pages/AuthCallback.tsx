import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';

/**
 * Página de callback para Google OAuth
 * Maneja el retorno después de autenticar con Google en Supabase
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // La sesión ya está guardada por el cliente de Supabase
        // Solo navegamos a home después de un pequeño delay para que se estabilice
        await new Promise(r => setTimeout(r, 1000));
        navigate('/');
      } catch (error) {
        console.error('Error en callback:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-4"
        >
          <Loader size={48} className="text-primary-600 mx-auto" />
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Completando inicio de sesión...
        </h1>
        <p className="text-gray-600">
          Te estamos redirigiendo a tu cuenta
        </p>
      </motion.div>
    </div>
  );
}
