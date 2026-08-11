# Implementation Plan: E-Commerce Backend API

## Overview

Este plan implementa un backend de e-commerce con FastAPI que gestiona productos, órdenes y pagos. La implementación sigue una arquitectura limpia de tres capas (routes, services, database) y se integra con Supabase (PostgreSQL) y MercadoPago Checkout Pro. El plan está organizado para construir incrementalmente desde la infraestructura base hasta las funcionalidades completas, con validación continua mediante tests.

## Tasks

- [ ] 1. Setup inicial del proyecto y configuración
  - Crear estructura de directorios (app/, tests/, etc.)
  - Crear requirements.txt con dependencias (fastapi, uvicorn, supabase, mercadopago, pydantic, hypothesis, pytest)
  - Crear .env.example con variables requeridas
  - Crear app/__init__.py y archivos __init__.py en subdirectorios
  - Implementar app/config.py con carga y validación de variables de entorno
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.1, 10.2, 10.3, 10.4_

- [ ]* 1.1 Write property test for configuration validation
  - **Property 19: Configuration Validation**
  - **Validates: Requirements 7.4, 10.2**
  - **Property 23: URL Format Validation**
  - **Validates: Requirements 10.3**
  - **Property 24: Token Non-Empty Validation**
  - **Validates: Requirements 10.4**
  - **Property 25: Configuration Round-Trip**
  - **Validates: Requirements 10.5**

- [ ] 2. Implementar modelos de datos y excepciones
  - Crear app/models/schemas.py con todos los modelos Pydantic (OrderItemRequest, OrderRequest, ProductResponse, OrderResponse, PreferenceResponse, Product, Order, OrderItem, PaymentInfo)
  - Crear app/exceptions.py con excepciones personalizadas (ProductNotFoundError, InsufficientStockError, MercadoPagoError, DatabaseError)
  - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2, 3.3, 9.1_

- [ ] 3. Crear esquema de base de datos en Supabase
  - Crear tabla productos con columnas: id_producto (TEXT), nombre, slug, categoria, subcategoria, precio, precio_original, imagenes (JSONB), descripcion, especificaciones (JSONB), stock, destacado, marca, calificacion, cantidad_resenas, fecha_creacion
  - Crear índices en productos: idx_productos_categoria, idx_productos_destacado, idx_productos_slug
  - Crear tabla ordenes con columnas: id_orden (TEXT), id_usuario, nombre_cliente, email_cliente, telefono_cliente, total, metodo_pago, estado, id_preferencia, numero_orden, fecha_creacion
  - Crear índices en ordenes: idx_ordenes_id_preferencia, idx_ordenes_estado, idx_ordenes_id_usuario, idx_ordenes_numero_orden
  - Crear tabla items_orden con columnas: id_item (TEXT), id_orden, id_producto, cantidad, precio_unitario
  - Crear índices en items_orden: idx_items_orden_id_orden, idx_items_orden_id_producto
  - Agregar constraints de foreign key y checks según diseño
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4. Implementar capa de base de datos
  - [ ] 4.1 Crear app/database/connection.py con inicialización del cliente Supabase
    - Implementar función get_supabase_client() que retorna cliente configurado
    - _Requirements: 7.1, 8.4_

  - [ ] 4.2 Implementar app/database/operations.py con todas las operaciones de base de datos
    - Implementar DatabaseOperations class con métodos: get_all_products(), get_products_by_ids(), create_order_with_items(), update_order_preference_id(), update_order_status(), get_order_by_preference_id(), get_order_items(), decrement_product_stock()
    - Usar transacciones para operaciones atómicas
    - Manejar errores de base de datos y lanzar DatabaseError
    - _Requirements: 1.1, 2.1, 2.3, 3.1, 3.2, 3.3, 3.5, 5.3, 5.4, 6.4, 6.5, 8.4_

- [ ]* 4.3 Write unit tests for database operations
  - Test get_all_products con base de datos vacía y con productos
  - Test create_order_with_items con transacción exitosa y fallida
  - Test decrement_product_stock con stock suficiente e insuficiente
  - _Requirements: 1.1, 3.5, 5.4_

- [ ] 5. Implementar capa de servicios
  - [ ] 5.1 Crear app/services/product_service.py
    - Implementar ProductService class con métodos: get_all_products(), validate_products_exist(), check_stock_availability(), decrement_stock()
    - Lanzar ProductNotFoundError cuando producto no existe
    - Lanzar InsufficientStockError cuando stock insuficiente
    - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.5, 5.4, 8.3_

  - [ ]* 5.2 Write property test for product validation
    - **Property 4: Invalid Product Rejection**
    - **Validates: Requirements 2.1, 2.2**
    - **Property 6: Stock Validation**
    - **Validates: Requirements 2.5**

  - [ ] 5.3 Crear app/services/order_service.py
    - Implementar OrderService class con métodos: create_order(), update_order_status(), get_order_by_preference_id()
    - Validar productos y stock antes de crear orden
    - Calcular total usando precios de base de datos
    - Crear orden y order_items en transacción
    - Generar order_number único (ej: SH + timestamp)
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.5, 5.3, 8.3_

  - [ ]* 5.4 Write property tests for order service
    - **Property 5: Price Integrity**
    - **Validates: Requirements 2.3, 2.4**
    - **Property 7: Initial Order Status**
    - **Validates: Requirements 3.1**
    - **Property 8: Order Data Persistence**
    - **Validates: Requirements 3.2**
    - **Property 9: Order Items Creation**
    - **Validates: Requirements 3.3**
    - **Property 11: Transactional Atomicity**
    - **Validates: Requirements 3.5**

  - [ ] 5.5 Crear app/services/payment_service.py
    - Implementar PaymentService class con métodos: create_preference(), get_payment_info()
    - Configurar SDK de MercadoPago con access token
    - Crear preferencia con items, back_urls y notification_url
    - Manejar errores de API y lanzar MercadoPagoError
    - _Requirements: 4.1, 4.2, 4.5, 5.2, 8.3_

  - [ ]* 5.6 Write property tests for payment service
    - **Property 12: Payment Preference Completeness**
    - **Validates: Requirements 4.2**
    - **Property 13: Preference ID Persistence**
    - **Validates: Requirements 4.1, 4.3, 4.4**

- [ ] 6. Checkpoint - Validar servicios
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implementar capa de rutas
  - [ ] 7.1 Crear app/routes/products.py
    - Implementar GET /products endpoint
    - Inyectar ProductService como dependencia
    - Retornar lista de ProductResponse con status 200
    - Manejar DatabaseError y retornar status 500
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 8.5, 9.5_

  - [ ]* 7.2 Write property tests for products endpoint
    - **Property 1: Complete Product Retrieval**
    - **Validates: Requirements 1.1**
    - **Property 2: Product Response Format**
    - **Validates: Requirements 1.2**
    - **Property 3: Product Response Completeness**
    - **Validates: Requirements 1.4**

  - [ ] 7.3 Crear app/routes/orders.py
    - Implementar POST /orders endpoint
    - Inyectar OrderService y PaymentService como dependencias
    - Validar OrderRequest con Pydantic
    - Convertir product_id de string a int para validación interna
    - Crear orden usando OrderService
    - Crear preferencia de pago usando PaymentService
    - Actualizar orden con preference_id
    - Retornar OrderResponse con status 201
    - Manejar excepciones y retornar status apropiado (400 para validación, 500 para errores de servidor)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.3, 4.4, 4.5, 8.1, 8.2, 8.5, 9.1, 9.4, 9.5_

  - [ ]* 7.4 Write property test for order creation
    - **Property 10: Order Creation Response**
    - **Validates: Requirements 3.4**

  - [ ] 7.5 Crear app/routes/webhook.py
    - Implementar POST /webhook endpoint
    - Inyectar OrderService, PaymentService y ProductService como dependencias
    - Extraer payment_id del body de la notificación
    - Consultar estado del pago usando PaymentService
    - Si estado es "approved", actualizar orden a "paid" y decrementar stock
    - Retornar {"status": "ok"} con status 200 siempre
    - Loggear errores pero no fallar (para evitar reintentos de MercadoPago)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 8.1, 8.2, 8.5, 9.2, 9.3_

  - [ ]* 7.6 Write property tests for webhook handler
    - **Property 14: Webhook Payment ID Extraction**
    - **Validates: Requirements 5.1**
    - **Property 15: Payment Status Verification**
    - **Validates: Requirements 5.2**
    - **Property 16: Order Status Update on Payment**
    - **Validates: Requirements 5.3**
    - **Property 17: Stock Decrement on Payment**
    - **Validates: Requirements 5.4**
    - **Property 18: Webhook Acknowledgment**
    - **Validates: Requirements 5.6**

- [ ] 8. Implementar aplicación principal y manejo de errores
  - Crear app/main.py con inicialización de FastAPI
  - Configurar CORS con frontend_url desde configuración
  - Registrar routers de products, orders y webhook
  - Implementar exception handlers para todas las excepciones personalizadas
  - Configurar logging con formato apropiado
  - Implementar startup event para validar configuración
  - _Requirements: 7.5, 8.1, 8.2, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 8.1 Write property tests for error handling
  - **Property 20: Error Response Format**
  - **Validates: Requirements 9.1**
  - **Property 21: Error Status Code Mapping**
  - **Validates: Requirements 9.4, 9.5**

- [ ] 9. Checkpoint - Validar integración completa
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. Write integration tests
  - Test flujo completo de creación de orden (POST /orders)
  - Test flujo completo de webhook (POST /webhook)
  - Test GET /products con base de datos poblada
  - Mock MercadoPago API para tests
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 11. Crear script de población de base de datos
  - Crear script populate_db.py que lea productos del frontend
  - Parsear productos desde el repositorio del frontend (https://github.com/cassiel2002/SantyHogar/)
  - Insertar productos en Supabase con todos los campos requeridos
  - Manejar IDs como strings ('1', '2', etc.) según espera el frontend
  - Validar que todos los campos requeridos estén presentes
  - _Requirements: 1.4, 6.1_

- [ ] 12. Crear documentación
  - Crear README.md con instrucciones de instalación y configuración
  - Documentar variables de entorno requeridas
  - Documentar endpoints de la API con ejemplos
  - Documentar proceso de setup de base de datos
  - Documentar cómo ejecutar tests
  - _Requirements: 7.1, 7.2, 7.3, 10.1_

- [ ] 13. Final checkpoint - Validación completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de correctness
- Los unit tests validan ejemplos específicos y casos edge
- El frontend ya existe y espera IDs tipo string, por lo que el backend debe manejar conversiones apropiadamente
- La integración con MercadoPago usa Checkout Pro (flujo de redirección)
- Supabase usa PostgreSQL con soporte para JSONB en arrays y objects
