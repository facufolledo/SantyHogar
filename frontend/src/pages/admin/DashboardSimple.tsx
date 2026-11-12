import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { formatPrice } from '../../utils/format';

export default function DashboardSimple() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLoadDashboard = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const start = thirtyDaysAgo.toISOString().split('T')[0];
      const end = now.toISOString().split('T')[0];

      console.log(`Fetching dashboard for ${start} to ${end}`);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/dashboard/stats?start_date=${start}&end_date=${end}`
      );
      const dashData = await response.json();
      console.log('Dashboard data:', dashData);
      setData(dashData);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar datos: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLoadDashboard}
        disabled={loading}
        className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2"
      >
        <Calendar size={20} />
        {loading ? 'Cargando...' : 'Cargar Dashboard'}
      </motion.button>

      {data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {data.stats?.map((s: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-gray-800 border border-gray-700/60 rounded-xl p-5"
              >
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-2">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          {data.chart_data && data.chart_data.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 border border-gray-700/60 rounded-xl p-6"
            >
              <h2 className="font-bold text-white mb-5">Ventas</h2>
              <div className="flex items-end gap-2 h-48">
                {data.chart_data.map((d: any, i: number) => {
                  const maxVal = Math.max(...data.chart_data.map((x: any) => x.value || 0), 1);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary-600 rounded-t"
                        style={{ height: `${(d.value / maxVal) * 100}%`, minHeight: '4px' }}
                      />
                      <span className="text-xs text-gray-500">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Orders */}
          {data.orders && data.orders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 border border-gray-700/60 rounded-xl p-6"
            >
              <h2 className="font-bold text-white mb-4">Pedidos</h2>
              <div className="space-y-2">
                {data.orders.map((o: any) => (
                  <div key={o.id} className="flex justify-between text-sm p-3 bg-gray-700/30 rounded">
                    <span className="text-gray-300">{o.id}</span>
                    <span className="text-white font-semibold">{formatPrice(o.total)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {!data.orders || data.orders.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>No hay pedidos en este período</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
