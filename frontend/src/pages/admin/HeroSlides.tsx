import { useState, useEffect } from 'react';
import { Trash2, Plus, Image as ImageIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface HeroSlide {
  id: string;
  titulo: string;
  subtitulo?: string;
  textoCta?: string;
  imagenUrl: string;
  enlace?: string;
  orden: number;
  activo: boolean;
}

interface FormData {
  titulo: string;
  subtitulo: string;
  textoCta: string;
  imagenUrl: string;
  enlace: string;
  orden: number;
}

const HeroSlides = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    titulo: '',
    subtitulo: '',
    textoCta: '',
    imagenUrl: '',
    enlace: '',
    orden: 0,
  });

  // Cargar heroes
  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/hero-slides?active_only=false`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSlides(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching hero slides:', error);
      setMessage('Error al cargar heroes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.titulo || !form.imagenUrl) {
      setMessage('Título e imagen son obligatorios');
      return;
    }

    try {
      setLoading(true);
      const url = editingId
        ? `${API_URL}/api/hero-slides/${editingId}`
        : `${API_URL}/api/hero-slides`;

      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': localStorage.getItem('csrf_token') || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          titulo: form.titulo,
          subtitulo: form.subtitulo || null,
          textoCta: form.textoCta || null,
          imagenUrl: form.imagenUrl,
          enlace: form.enlace || null,
          orden: form.orden,
        }),
      });

      if (response.ok) {
        setMessage(editingId ? 'Hero actualizado' : 'Hero creado');
        resetForm();
        fetchSlides();
        setTimeout(() => setMessage(''), 3000);
      } else {
        try {
          const errorData = await response.json();
          let errorMsg = 'Error al guardar';
          
          if (errorData.detail) {
            if (typeof errorData.detail === 'string') {
              errorMsg = errorData.detail;
            } else if (Array.isArray(errorData.detail)) {
              errorMsg = errorData.detail.map((e: any) => 
                typeof e === 'string' ? e : e.msg || 'Error desconocido'
              ).join(', ');
            }
          }
          
          setMessage(errorMsg);
          console.error('Save error:', errorData);
        } catch (e) {
          setMessage(`Error al guardar (${response.status})`);
        }
      }
    } catch (error) {
      console.error('Error saving:', error);
      setMessage('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este hero?')) return;

    try {
      const response = await fetch(`${API_URL}/api/hero-slides/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': localStorage.getItem('csrf_token') || '',
        },
        credentials: 'include',
      });

      if (response.ok) {
        setMessage('Hero eliminado');
        fetchSlides();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      setMessage('Error al eliminar');
    }
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingId(slide.id);
    setForm({
      titulo: slide.titulo,
      subtitulo: slide.subtitulo || '',
      textoCta: slide.textoCta || '',
      imagenUrl: slide.imagenUrl,
      enlace: slide.enlace || '',
      orden: slide.orden,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      titulo: '',
      subtitulo: '',
      textoCta: '',
      imagenUrl: '',
      enlace: '',
      orden: 0,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm({ ...form, imagenUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Gestión de Hero Slides</h1>
          <p className="text-gray-400 mt-1">Crea y administra los banners promocionales de la página principal</p>
        </div>

        {/* Mensaje */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.includes('Error')
                ? 'bg-red-950/40 text-red-200 border-red-800'
                : 'bg-green-950/40 text-green-200 border-green-800'
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-lg p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                {editingId ? 'Editar Hero' : 'Crear Hero'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Colección Primavera"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={form.subtitulo}
                    onChange={(e) =>
                      setForm({ ...form, subtitulo: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Nuevos estilos para tu hogar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    value={form.textoCta}
                    onChange={(e) => setForm({ ...form, textoCta: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Comprar Ahora"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enlace *
                  </label>
                  <input
                    type="text"
                    value={form.enlace}
                    onChange={(e) => setForm({ ...form, enlace: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: /tienda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={form.orden}
                    onChange={(e) =>
                      setForm({ ...form, orden: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Imagen *
                  </label>
                  {form.imagenUrl && (
                    <div className="mb-3 relative group">
                      <img
                        src={form.imagenUrl}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border border-gray-700"
                      />
                      <button
                        onClick={() => setForm({ ...form, imagenUrl: '' })}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/50 transition text-gray-400 hover:text-gray-300">
                    <ImageIcon size={18} />
                    <span className="text-sm">Subir imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                  </button>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2 px-4 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Heroes */}
          <div className="lg:col-span-2">
            {loading && slides.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-400 mt-4">Cargando heroes...</p>
                </div>
              </div>
            ) : slides.length > 0 ? (
              <div className="space-y-3">
                {slides.map((slide) => (
                  <div
                    key={slide.id}
                    className="bg-gray-900 rounded-lg border border-gray-800 p-4 hover:border-gray-700 transition"
                  >
                    <div className="flex gap-4">
                      <img
                        src={slide.imagenUrl}
                        alt={slide.titulo}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-700 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white">{slide.titulo}</h3>
                        {slide.subtitulo && (
                          <p className="text-gray-400 text-sm truncate">{slide.subtitulo}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Orden: {slide.orden} | {slide.activo ? '✓ Activo' : '✗ Inactivo'}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(slide)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(slide.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
                <p className="text-gray-400">No hay heroes creados</p>
                <p className="text-gray-500 text-sm mt-2">Crea uno usando el formulario de la izquierda</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSlides;
