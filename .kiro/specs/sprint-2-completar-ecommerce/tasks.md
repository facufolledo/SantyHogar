# Tareas — Sprint 2: Completar E-commerce SantyHogar

## Tarea 1: Fix timeout clientes + verificar RLS

- [x] 1. Fix timeout clientes + verificar RLS
  - [x] 1.1 Revisar `backend/app/database/connection.py` y verificar que el cliente Supabase usa la `service_role` key (no la `anon` key) para evitar bloqueos por RLS
  - [x] 1.2 Crear script SQL para verificar/deshabilitar políticas RLS en la tabla `clientes` que bloqueen la service_role key (agregar política `USING (true)` si es necesario)
  - [x] 1.3 Agregar logging detallado en `get_all_customers` para medir tiempo de respuesta y diagnosticar si el timeout es por DNS, RLS o latencia de red
  - [x] 1.4 Verificar que el error DNS en `_raise_db_error` incluye el hostname fallido en el mensaje de error (ya implementado, validar que funciona)
  - [x] 1.5 Escribir test unitario que mockea un timeout de Supabase y verifica que se retorna HTTP 500 con el mensaje "La base de datos no respondió a tiempo al consultar clientes"

## Tarea 2: Endpoint upload imágenes + bucket Supabase Storage

- [x] 2. Endpoint upload imágenes + bucket Supabase Storage
  - [x] 2.1 Crear `backend/app/services/image_service.py` con clase `ImageService` que valide tipo (JPEG, PNG, WebP), tamaño (≤5 MB), genere nombre único con UUID y suba a Supabase Storage bucket `product-images`
  - [x] 2.2 Agregar endpoint `POST /products/upload-image` en `backend/app/routes/products.py` que reciba `UploadFile`, llame a `ImageService.upload_image()` y retorne `{ url, filename }`
  - [x] 2.3 Agregar schema `ImageUploadResponse` en `backend/app/models/schemas.py` con campos `url: str` y `filename: str`
  - [x] 2.4 Crear instrucciones SQL o script para crear el bucket `product-images` en Supabase Storage con acceso público de lectura
  - [x] 2.5 Agregar función `uploadProductImage(file: File)` en `frontend/src/api/productsApi.ts` que haga POST multipart al endpoint de upload
  - [x] 2.6 Escribir test de propiedad (Property 5): para cualquier archivo, si no es JPEG/PNG/WebP o excede 5 MB → HTTP 400; si es válido → HTTP 200 con URL

## Tarea 3: Actualizar ProductFormModal con drag & drop de imágenes

- [x] 3. Actualizar ProductFormModal con drag & drop de imágenes
  - [x] 3.1 Reemplazar la zona "Carga de archivos próximamente" en la pestaña Imágenes de `ProductFormModal.tsx` con un componente de drag & drop funcional que acepte archivos de imagen
  - [x] 3.2 Implementar handler `onDrop` que llame a `uploadProductImage()` para cada archivo, muestre progreso de carga y agregue la URL retornada al array `form.images`
  - [x] 3.3 Agregar validación visual en el frontend: mostrar error si el archivo no es imagen o excede 5 MB antes de enviarlo al backend
  - [x] 3.4 Permitir reordenar imágenes con drag & drop (la primera es la principal) y eliminar imágenes individuales del array

## Tarea 4: Reescribir BulkImport con parser Excel (.xlsx) + preview

- [x] 4. Reescribir BulkImport con parser Excel (.xlsx) + preview
  - [x] 4.1 Crear función `parse_xlsx_file(file_content: bytes)` en `backend/app/services/bulk_import_service.py` que use `openpyxl` para leer `.xlsx`, detecte headers automáticamente y mapee columnas a campos de producto
  - [x] 4.2 Agregar endpoint `POST /products/bulk-import/preview` que parsee el archivo y retorne las validaciones sin insertar en la BD (solo preview)
  - [x] 4.3 Modificar endpoint `POST /products/bulk-import` para aceptar `.xlsx` en lugar de `.doc/.docx` y recibir la lista de filas confirmadas para importar
  - [x] 4.4 Reescribir `frontend/src/pages/admin/BulkImport.tsx`: cambiar aceptación de `.doc` a `.xlsx`, agregar paso de preview con tabla editable, y botón "Confirmar importación" que envíe solo las filas seleccionadas
  - [x] 4.5 Actualizar `bulkImportProducts()` en `frontend/src/api/productsApi.ts` para soportar el flujo de dos pasos (preview + confirm)
  - [x] 4.6 Agregar soporte para asociar una imagen a cada producto del preview mediante drag & drop individual (llama a `uploadProductImage` por cada imagen)
  - [x] 4.7 Escribir tests de propiedad (Properties 1, 2, 3): round-trip de parseo Excel, detección automática de columnas, validación de campos obligatorios vacíos

## Tarea 5: CustomerFormModal + conectar botones AdminCustomers

- [x] 5. CustomerFormModal (crear/editar/ver) + conectar botones AdminCustomers
  - [x] 5.1 Crear componente `frontend/src/pages/admin/CustomerFormModal.tsx` con props `{ customer, mode: 'create'|'edit'|'view', onSave, onClose }` y campos: nombre, email, teléfono, dirección, ciudad, provincia, código postal, notas
  - [x] 5.2 Implementar modo "view" (solo lectura) que muestre todos los campos del cliente y una sección con historial de pedidos obtenido de `fetchCustomerOrders(customerId)`
  - [x] 5.3 Implementar modo "create" que llame a `createCustomer()` de `customersApi.ts` al enviar el formulario y agregue el cliente a la tabla sin recargar
  - [x] 5.4 Implementar modo "edit" que precargue datos del cliente, llame a `updateCustomer()` al enviar y actualice la fila en la tabla sin recargar
  - [x] 5.5 Conectar botones en `AdminCustomers.tsx`: "Nuevo Cliente" → modal create, "Editar" → modal edit, "Ver detalle" → modal view
  - [x] 5.6 Agregar validación de email duplicado: mostrar error "Ya existe un cliente con ese email" cuando el backend retorne 400
  - [x] 5.7 Escribir test de propiedad (Property 4): para cualquier email existente, crear otro cliente con ese email debe fallar

## Tarea 6: Endpoints Dashboard (stats, sales-chart, top-products, top-customers)

- [x] 6. Endpoints Dashboard (stats, sales-chart, top-products, top-customers)
  - [x] 6.1 Crear `backend/app/services/dashboard_service.py` con clase `DashboardService` que tenga métodos: `get_stats()`, `get_sales_chart()`, `get_top_products()`, `get_top_customers()`
  - [x] 6.2 Implementar `get_stats()`: consultar tablas `ordenes`, `productos`, `clientes` para calcular ventas del día/semana/mes, cantidad de pedidos, ticket promedio, productos activos, stock bajo (<5), clientes nuevos del mes
  - [x] 6.3 Implementar `get_sales_chart()`: agrupar órdenes pagadas por fecha de los últimos 7 días y retornar `[{ date, total }]`
  - [x] 6.4 Implementar `get_top_products()`: JOIN `items_orden` + `productos`, agrupar por producto, ordenar por cantidad vendida DESC, LIMIT 5
  - [x] 6.5 Implementar `get_top_customers()`: ordenar `clientes` por `total_gastado` DESC, LIMIT 5
  - [x] 6.6 Crear `backend/app/routes/dashboard.py` con endpoints GET `/dashboard/stats`, `/dashboard/sales-chart`, `/dashboard/top-products`, `/dashboard/top-customers`
  - [x] 6.7 Registrar el router de dashboard en `backend/app/main.py`
  - [x] 6.8 Agregar schemas Pydantic en `backend/app/models/schemas.py`: `DashboardStats`, `SalesChartPoint`, `TopProduct`, `TopCustomer`
  - [x] 6.9 Escribir tests de propiedad (Properties 6, 7): correctitud de estadísticas y ranking de top productos/clientes

## Tarea 7: Dashboard frontend con datos reales

- [x] 7. Dashboard frontend con datos reales
  - [x] 7.1 Crear `frontend/src/api/dashboardApi.ts` con funciones: `fetchDashboardStats()`, `fetchSalesChart()`, `fetchTopProducts()`, `fetchTopCustomers()`
  - [x] 7.2 Reescribir `frontend/src/pages/admin/Dashboard.tsx`: reemplazar el array `stats` hardcodeado con datos de `fetchDashboardStats()`, usando `useEffect` + `useState` con estado de loading
  - [x] 7.3 Reemplazar `chartData` hardcodeado con datos de `fetchSalesChart()` para el gráfico de barras de ventas semanales
  - [x] 7.4 Reemplazar la sección "Resumen" hardcodeada con datos reales de stats (productos activos, stock bajo, clientes nuevos)
  - [x] 7.5 Reemplazar `mockOrders` en la tabla "Pedidos recientes" con datos de `fetchOrders()` (limitados a 5) de `ordersApi.ts`
  - [x] 7.6 Eliminar import de `mockOrders` de `data/orders.ts` en Dashboard.tsx
  - [x] 7.7 Agregar secciones opcionales de "Top Productos" y "Top Clientes" usando `fetchTopProducts()` y `fetchTopCustomers()`

## Tarea 8: MyOrders conectado al backend (GET /orders?email=)

- [x] 8. MyOrders conectado al backend (GET /orders?email=)
  - [x] 8.1 Agregar parámetro query opcional `email` al endpoint `GET /orders` en `backend/app/routes/orders.py` para filtrar órdenes por `email_cliente`
  - [x] 8.2 Agregar método `get_orders_by_email(email: str)` en `backend/app/database/operations.py` que haga `SELECT * FROM ordenes WHERE email_cliente = email ORDER BY fecha_creacion DESC`
  - [x] 8.3 Actualizar `OrderService.get_all_orders()` para aceptar parámetro `email` opcional y llamar al nuevo método si está presente
  - [x] 8.4 Agregar función `fetchOrdersByEmail(email: string)` en `frontend/src/api/ordersApi.ts`
  - [x] 8.5 Reescribir `frontend/src/pages/user/MyOrders.tsx`: reemplazar `useOrders().getUserOrders()` con llamada a `fetchOrdersByEmail(user.email)` usando `useEffect` + `useState`, con estados de loading y error
  - [x] 8.6 Agregar botón "Reintentar" cuando la consulta al backend falla
  - [x] 8.7 Adaptar el renderizado de pedidos para usar la estructura `OrderDetail` del backend (con `items` que tienen `productName`, `productImage`, etc.) en lugar de la estructura del `OrdersContext`
  - [x] 8.8 Escribir test de propiedad (Property 8): para cualquier email y conjunto de órdenes, el filtrado retorna solo las órdenes con ese email, ordenadas por fecha DESC

## Tarea 9: MyAccount con persistencia (PATCH /customers/{id})

- [x] 9. MyAccount con persistencia (PATCH /customers/{id})
  - [x] 9.1 Modificar `frontend/src/pages/user/MyAccount.tsx`: en `handleSave()`, llamar a `updateCustomer(user.customerId, { name, email, phone })` de `customersApi.ts` en lugar de solo hacer `toast()`
  - [x] 9.2 Agregar `useEffect` en MyAccount para cargar datos actuales del perfil desde `fetchCustomerDetail(user.customerId)` al montar el componente
  - [x] 9.3 Actualizar el `AuthContext` para incluir `customerId` (UUID del registro en tabla `clientes`) y un método `updateUser(data)` para actualizar los datos del usuario en el contexto
  - [x] 9.4 Implementar manejo de errores: si PATCH falla, mostrar toast de error con mensaje del backend y mantener formulario en modo edición
  - [x] 9.5 Agregar estado de loading durante el guardado (deshabilitar botón "Guardar" y mostrar spinner)

## Tarea 10: Páginas usuario: MyAddresses, MyFavorites, MySecurity con backend

- [x] 10. Páginas usuario: MyAddresses, MyFavorites, MySecurity con backend
  - [x] 10.1 Crear migración SQL `006_create_direcciones_favoritos.sql` con tablas `direcciones` (id_direccion, id_cliente, etiqueta, calle, ciudad, provincia, codigo_postal, es_principal) y `favoritos` (id_cliente, id_producto, fecha_creacion)
  - [x] 10.2 Agregar métodos CRUD de direcciones en `backend/app/database/operations.py`: `get_customer_addresses()`, `create_address()`, `update_address()`, `delete_address()`
  - [x] 10.3 Agregar métodos de favoritos en `backend/app/database/operations.py`: `get_customer_favorites()`, `add_favorite()`, `remove_favorite()`
  - [x] 10.4 Agregar endpoints de direcciones en `backend/app/routes/customers.py`: GET/POST `/customers/{id}/addresses`, PATCH/DELETE `/customers/{id}/addresses/{addressId}`
  - [x] 10.5 Agregar endpoints de favoritos en `backend/app/routes/customers.py`: GET/POST `/customers/{id}/favorites`, DELETE `/customers/{id}/favorites/{productId}`
  - [x] 10.6 Agregar schemas Pydantic: `AddressResponse`, `CreateAddressRequest`, `UpdateAddressRequest`, `FavoriteResponse`, `FavoriteRequest`
  - [x] 10.7 Agregar funciones API en frontend: `fetchAddresses()`, `createAddress()`, `updateAddress()`, `deleteAddress()`, `fetchFavorites()`, `addFavorite()`, `removeFavorite()` en `customersApi.ts`
  - [x] 10.8 Reescribir `MyAddresses.tsx`: reemplazar `mockUser.addresses` con datos del backend, conectar CRUD de direcciones a los endpoints
  - [x] 10.9 Reescribir `MyFavorites.tsx`: reemplazar `mockUser.favorites` con datos del backend, conectar toggle de favoritos a los endpoints
  - [x] 10.10 Reescribir `MySecurity.tsx`: reemplazar `mockSessions` con datos reales (si hay endpoint de sesiones) o implementar solo cambio de contraseña conectado al backend; reemplazar `handleChangePassword` con llamada real al endpoint de autenticación
  - [x] 10.11 Escribir test de propiedad (Property 9): round-trip de direcciones — crear dirección y luego obtenerla retorna los mismos datos
