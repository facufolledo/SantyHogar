# Documento de Requerimientos — Sprint 2: Completar E-commerce SantyHogar

## Introducción

Este documento define los requerimientos para el Sprint 2 de SantyHogar, un e-commerce de electrodomésticos, mueblería y colchonería. El Sprint 1 dejó funcionalidades parciales o rotas que deben completarse: el endpoint de clientes tiene timeout, el panel de administración de clientes carece de modales, la importación masiva desde `.doc` no funciona, no hay upload de imágenes, el dashboard usa datos mock, y las páginas de usuario (pedidos, cuenta, direcciones, favoritos, seguridad) no persisten datos en el backend. Este sprint cierra todas esas brechas para lograr un MVP funcional end-to-end.

## Glosario

- **Sistema**: La aplicación SantyHogar en su conjunto (backend FastAPI + frontend React).
- **Backend**: Servidor FastAPI que expone la API REST y se conecta a Supabase (PostgreSQL).
- **Frontend**: Aplicación React 18 + TypeScript + Vite + Tailwind CSS.
- **AdminCustomers**: Página de administración de clientes (`/admin/clientes`).
- **CustomerFormModal**: Modal para crear, editar y ver detalle de un cliente.
- **Dashboard**: Página principal del panel de administración (`/admin`).
- **BulkImport**: Página de importación masiva de productos (`/admin/importar`).
- **Parser_Excel**: Módulo backend que parsea archivos `.xlsx` usando openpyxl.
- **Supabase_Storage**: Servicio de almacenamiento de archivos de Supabase (bucket `product-images`).
- **ProductFormModal**: Modal existente para crear/editar productos.
- **MyOrders**: Página de usuario que muestra el historial de pedidos (`/cuenta/pedidos`).
- **MyAccount**: Página de usuario para editar datos del perfil (`/cuenta`).
- **MyAddresses**: Página de usuario para gestionar direcciones (`/cuenta/direcciones`).
- **MyFavorites**: Página de usuario para gestionar productos favoritos (`/cuenta/favoritos`).
- **MySecurity**: Página de usuario para cambiar contraseña (`/cuenta/seguridad`).
- **OrdersContext**: Contexto React que actualmente almacena pedidos solo en localStorage.
- **RLS**: Row Level Security de Supabase/PostgreSQL.

## Requerimientos

### Requerimiento 1: Resolver timeout del endpoint de clientes

**Historia de Usuario:** Como administrador, quiero que la lista de clientes cargue sin timeout, para poder gestionar clientes de forma confiable.

#### Criterios de Aceptación

1. CUANDO el administrador solicita la lista de clientes vía GET `/customers`, EL Endpoint DEBE responder con la lista completa en menos de 5 segundos.
2. SI la consulta a la base de datos excede 20 segundos, ENTONCES EL Backend DEBE retornar un error HTTP 500 con el mensaje "La base de datos no respondió a tiempo al consultar clientes" en lugar de dejar la conexión colgada.
3. CUANDO la tabla `clientes` tiene políticas RLS activas, EL Backend DEBE utilizar la service_role key para las consultas administrativas, evitando bloqueos por RLS.
4. SI el host de Supabase no se puede resolver (error DNS), ENTONCES EL Backend DEBE retornar un error HTTP 500 con un mensaje descriptivo que incluya el hostname fallido.

---

### Requerimiento 2: Completar AdminCustomers con modal de formulario

**Historia de Usuario:** Como administrador, quiero poder crear, editar y ver el detalle de un cliente desde el panel, para gestionar la base de clientes sin usar herramientas externas.

#### Criterios de Aceptación

1. CUANDO el administrador hace clic en "Nuevo Cliente", EL AdminCustomers DEBE abrir el CustomerFormModal en modo creación con todos los campos vacíos.
2. CUANDO el administrador hace clic en el botón "Editar" de un cliente, EL AdminCustomers DEBE abrir el CustomerFormModal en modo edición con los datos actuales del cliente precargados.
3. CUANDO el administrador hace clic en el botón "Ver detalle" de un cliente, EL AdminCustomers DEBE abrir el CustomerFormModal en modo solo lectura mostrando todos los campos del cliente y su historial de pedidos.
4. EL CustomerFormModal DEBE incluir los campos: nombre, email, teléfono, dirección, ciudad, provincia, código postal y notas.
5. CUANDO el administrador envía el formulario de creación con datos válidos, EL CustomerFormModal DEBE llamar a POST `/customers` y agregar el nuevo cliente a la tabla sin recargar la página.
6. CUANDO el administrador envía el formulario de edición con datos válidos, EL CustomerFormModal DEBE llamar a PATCH `/customers/{id}` y actualizar el cliente en la tabla sin recargar la página.
7. SI el email ingresado ya existe en otro cliente, ENTONCES EL CustomerFormModal DEBE mostrar un mensaje de error "Ya existe un cliente con ese email".
8. CUANDO el CustomerFormModal está en modo "Ver detalle", EL CustomerFormModal DEBE mostrar una sección con las órdenes del cliente obtenidas de GET `/customers/{id}/orders`.

---

### Requerimiento 3: Importación masiva desde Excel (.xlsx)

**Historia de Usuario:** Como administrador, quiero importar productos masivamente desde un archivo Excel (.xlsx), para cargar el catálogo de forma eficiente reemplazando el parser de .doc que no funciona.

#### Criterios de Aceptación

1. CUANDO el administrador sube un archivo `.xlsx`, EL Parser_Excel DEBE leer el contenido usando openpyxl y extraer las filas de productos.
2. EL Parser_Excel DEBE mapear las columnas del Excel a los campos de producto: nombre, categoría, subcategoría, precio, stock, marca y descripción.
3. CUANDO el archivo contiene columnas con nombres reconocibles (nombre, precio, stock, categoría, marca), EL Parser_Excel DEBE detectar automáticamente el mapeo de columnas.
4. SI una fila del Excel tiene campos obligatorios vacíos (nombre), ENTONCES EL Parser_Excel DEBE marcar esa fila como inválida con un mensaje de error descriptivo.
5. CUANDO el administrador sube un archivo, EL BulkImport DEBE mostrar una vista previa (preview) de los productos parseados antes de confirmar la importación.
6. CUANDO el administrador confirma la importación, EL Backend DEBE insertar los productos válidos en la tabla `productos` y retornar un resumen con cantidad importada, válidos e inválidos.
7. EL BulkImport DEBE aceptar archivos `.xlsx` mediante drag & drop o selección de archivo, y rechazar formatos no soportados con un mensaje claro.
8. SI el archivo `.xlsx` está vacío o no contiene filas de datos, ENTONCES EL Backend DEBE retornar un error indicando "El archivo no contiene productos para importar".
9. PARA TODO archivo `.xlsx` válido, parsear y luego generar un `.xlsx` a partir de los datos parseados y volver a parsear DEBE producir un conjunto de productos equivalente (propiedad round-trip).

---

### Requerimiento 4: Upload de imágenes a Supabase Storage

**Historia de Usuario:** Como administrador, quiero subir imágenes de productos directamente desde el panel, para no depender de URLs externas y tener las imágenes alojadas en la infraestructura propia.

#### Criterios de Aceptación

1. EL Backend DEBE crear y configurar un bucket `product-images` en Supabase_Storage con acceso público de lectura.
2. CUANDO el administrador sube una imagen vía POST `/products/upload-image`, EL Backend DEBE almacenar el archivo en Supabase_Storage y retornar la URL pública de la imagen.
3. EL Backend DEBE validar que el archivo subido sea una imagen (JPEG, PNG, WebP) y no exceda 5 MB de tamaño.
4. SI el archivo no es una imagen válida o excede el tamaño máximo, ENTONCES EL Backend DEBE retornar un error HTTP 400 con un mensaje descriptivo.
5. CUANDO el administrador está en el ProductFormModal, EL ProductFormModal DEBE permitir subir imágenes mediante drag & drop además de ingresar URLs manualmente.
6. CUANDO una imagen se sube exitosamente, EL ProductFormModal DEBE agregar la URL pública retornada al array `imagenes[]` del producto.
7. CUANDO el administrador está en la importación masiva, EL BulkImport DEBE permitir asociar una imagen a cada producto de la vista previa mediante drag & drop individual.

---

### Requerimiento 5: Dashboard con métricas reales

**Historia de Usuario:** Como administrador, quiero ver métricas reales de ventas y actividad en el dashboard, para tomar decisiones basadas en datos actuales en lugar de datos mock.

#### Criterios de Aceptación

1. EL Backend DEBE exponer un endpoint GET `/dashboard/stats` que retorne: ventas del día, ventas de la semana, ventas del mes, cantidad de pedidos, ticket promedio, productos activos, productos con stock bajo (stock < 5) y cantidad de clientes nuevos del mes.
2. CUANDO el administrador accede al Dashboard, EL Dashboard DEBE obtener las métricas de GET `/dashboard/stats` y mostrarlas en las tarjetas de estadísticas reemplazando los valores hardcodeados.
3. EL Backend DEBE exponer un endpoint GET `/dashboard/sales-chart` que retorne las ventas diarias de la última semana para el gráfico de barras.
4. CUANDO el administrador accede al Dashboard, EL Dashboard DEBE obtener los pedidos recientes de GET `/orders` (limitados a los últimos 5) y mostrarlos en la tabla de "Pedidos recientes" reemplazando `mockOrders`.
5. EL Backend DEBE exponer un endpoint GET `/dashboard/top-products` que retorne los 5 productos más vendidos con nombre, cantidad vendida y monto total.
6. EL Backend DEBE exponer un endpoint GET `/dashboard/top-customers` que retorne los 5 clientes con mayor gasto total.

---

### Requerimiento 6: MyOrders conectado al backend

**Historia de Usuario:** Como cliente, quiero ver mi historial real de compras en "Mis pedidos", para hacer seguimiento de todas mis compras pasadas y no solo las de la sesión actual.

#### Criterios de Aceptación

1. EL Backend DEBE exponer un endpoint GET `/orders?email={email}` que retorne las órdenes filtradas por email del cliente, ordenadas por fecha descendente.
2. CUANDO el cliente accede a MyOrders, EL MyOrders DEBE obtener los pedidos del backend usando el email del usuario autenticado en lugar de leer del OrdersContext local.
3. CUANDO el backend retorna pedidos, EL MyOrders DEBE mostrar cada pedido con: número de orden, estado, fecha, productos con imagen y nombre, total y seguimiento de estado.
4. SI el cliente no tiene pedidos registrados en el backend, ENTONCES EL MyOrders DEBE mostrar el mensaje "Todavía no tenés pedidos" con el ícono de paquete.
5. SI la consulta al backend falla, ENTONCES EL MyOrders DEBE mostrar un mensaje de error y ofrecer un botón para reintentar.

---

### Requerimiento 7: MyAccount con persistencia en backend

**Historia de Usuario:** Como cliente, quiero que los cambios en mi perfil se guarden en el servidor, para que mis datos persistan entre sesiones y dispositivos.

#### Criterios de Aceptación

1. CUANDO el cliente hace clic en "Guardar" en MyAccount, EL MyAccount DEBE llamar a PATCH `/customers/{id}` con los datos modificados (nombre, email, teléfono).
2. CUANDO el backend confirma la actualización, EL MyAccount DEBE mostrar un toast "Datos actualizados correctamente" y actualizar el contexto de autenticación con los nuevos datos.
3. SI la actualización falla, ENTONCES EL MyAccount DEBE mostrar un toast de error con el mensaje del backend y mantener el formulario en modo edición.
4. CUANDO el cliente accede a MyAccount, EL MyAccount DEBE cargar los datos actuales del perfil desde GET `/customers/{id}` si el cliente tiene un registro en la tabla `clientes`.

---

### Requerimiento 8: Páginas de usuario con persistencia en backend

**Historia de Usuario:** Como cliente, quiero que mis direcciones, favoritos y configuración de seguridad se guarden en el servidor, para que persistan entre sesiones.

#### Criterios de Aceptación

##### Direcciones (MyAddresses)
1. EL Backend DEBE exponer endpoints CRUD para direcciones: GET `/customers/{id}/addresses`, POST `/customers/{id}/addresses`, PATCH `/customers/{id}/addresses/{addressId}`, DELETE `/customers/{id}/addresses/{addressId}`.
2. CUANDO el cliente accede a MyAddresses, EL MyAddresses DEBE cargar las direcciones desde el backend en lugar de usar datos mock.
3. CUANDO el cliente agrega, edita o elimina una dirección, EL MyAddresses DEBE persistir el cambio en el backend y actualizar la UI sin recargar la página.

##### Favoritos (MyFavorites)
4. EL Backend DEBE exponer endpoints para favoritos: GET `/customers/{id}/favorites`, POST `/customers/{id}/favorites`, DELETE `/customers/{id}/favorites/{productId}`.
5. CUANDO el cliente accede a MyFavorites, EL MyFavorites DEBE cargar los IDs de productos favoritos desde el backend en lugar de usar datos mock.
6. CUANDO el cliente agrega o quita un producto de favoritos, EL MyFavorites DEBE persistir el cambio en el backend.

##### Seguridad (MySecurity)
7. CUANDO el cliente envía el formulario de cambio de contraseña con datos válidos, EL MySecurity DEBE llamar al endpoint correspondiente de autenticación para actualizar la contraseña.
8. CUANDO el cliente accede a MySecurity, EL MySecurity DEBE cargar las sesiones activas reales desde el backend en lugar de usar datos mock.
9. SI el cambio de contraseña falla (contraseña actual incorrecta), ENTONCES EL MySecurity DEBE mostrar un mensaje de error descriptivo.
