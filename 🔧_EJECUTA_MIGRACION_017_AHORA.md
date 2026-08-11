# 🔧 MIGRACIÓN 017: Remover CHECK CONSTRAINT

## 📋 QUÉ HACE

Elimina el constraint que bloqueaba nuevas categorías. Eso es todo.

## 🚀 CÓMO EJECUTAR

### 1️⃣ Abre Supabase SQL Editor
https://app.supabase.com/project/gsvtcrscojbfhgixxquw/sql/new

### 2️⃣ Ejecuta esto:
```sql
ALTER TABLE IF EXISTS public.productos 
DROP CONSTRAINT IF EXISTS productos_categoria_check;
```

### 3️⃣ Click "Run"

## ✅ LISTO

Ahora SantyHogar funciona con categorías dinámicas.
