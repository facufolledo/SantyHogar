/**
 * Panel de administración de categorías dinámicas
 * CRUD completo: crear, editar, eliminar y reordenar categorías
 */
import React, { useState } from "react";
import { useCategories, type Category } from "@/hooks/useCategories";
import { Plus, Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface FormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  order: number;
}

const CategoriesManagement: React.FC = () => {
  const { categories, loading, error, refetch } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    color: "#3B82F6",
    icon: "",
    order: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3B82F6",
      icon: "",
      order: 0,
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? parseInt(value) || 0 : value,
    }));
  };

  // Crear categoría
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "El nombre es obligatorio" });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color || undefined,
          icon: formData.icon || undefined,
          order: formData.order,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error creando categoría");
      }

      setMessage({ type: "success", text: "Categoría creada exitosamente" });
      resetForm();
      await refetch();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setMessage({ type: "error", text: message });
    } finally {
      setSubmitting(false);
    }
  };

  // Editar categoría
  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "#3B82F6",
      icon: category.icon || "",
      order: category.order,
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  // Guardar cambios
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/categories/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || undefined,
          description: formData.description || undefined,
          color: formData.color || undefined,
          icon: formData.icon || undefined,
          order: formData.order,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error actualizando categoría");
      }

      setMessage({ type: "success", text: "Categoría actualizada exitosamente" });
      resetForm();
      await refetch();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setMessage({ type: "error", text: message });
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar categoría
  const handleDelete = async (categoryId: string) => {
    if (!window.confirm("¿Estás seguro que quieres eliminar esta categoría?")) return;

    try {
      const response = await fetch(`${API_URL}/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error eliminando categoría");
      }

      setMessage({ type: "success", text: "Categoría eliminada exitosamente" });
      await refetch();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setMessage({ type: "error", text: message });
    }
  };

  // Cambiar orden (subir/bajar)
  const handleReorder = async (category: Category, direction: "up" | "down") => {
    const newOrder = direction === "up" ? category.order - 1 : category.order + 1;
    if (newOrder < 0) return;

    try {
      const response = await fetch(`${API_URL}/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder }),
      });

      if (!response.ok) throw new Error("Error reordenando");
      await refetch();
    } catch (err) {
      setMessage({ type: "error", text: "Error al reordenar" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Categorías</h1>
            <p className="text-gray-600 mt-1">Crea y administra las categorías de tu tienda</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              Nueva Categoría
            </button>
          )}
        </div>

        {/* Mensaje */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Editar Categoría" : "Nueva Categoría"}
            </h2>
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Electrodomésticos"
                    required
                  />
                </div>

                {/* Orden */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Orden
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción de la categoría..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                {/* Icono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icono
                  </label>
                  <select
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar icono...</option>
                    <option value="zap">Rayo (Electrodomésticos)</option>
                    <option value="home">Casa (Mueblería)</option>
                    <option value="moon">Luna (Colchonería)</option>
                    <option value="shopping-cart">Carrito</option>
                    <option value="gift">Regalo</option>
                    <option value="palette">Paleta</option>
                    <option value="wifi">WiFi</option>
                  </select>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de categorías */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando categorías...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
            Error: {error}
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">No hay categorías yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Productos</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Orden</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Color</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">-</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{category.order}</td>
                    <td className="px-6 py-4">
                      {category.color && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-200"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-xs text-gray-600">{category.color}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          category.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {category.active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleReorder(category, "up")}
                          className="p-2 text-gray-600 hover:text-blue-600 transition"
                          title="Subir orden"
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          onClick={() => handleReorder(category, "down")}
                          className="p-2 text-gray-600 hover:text-blue-600 transition"
                          title="Bajar orden"
                        >
                          <ChevronDown size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-gray-600 hover:text-blue-600 transition"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-gray-600 hover:text-red-600 transition"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesManagement;
