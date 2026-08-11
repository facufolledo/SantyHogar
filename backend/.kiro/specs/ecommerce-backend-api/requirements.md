# Requirements Document

## Introduction

Este documento define los requisitos para un backend de e-commerce listo para producción que gestiona productos, órdenes y pagos. El sistema se integra con Supabase (PostgreSQL) para persistencia de datos y MercadoPago Checkout Pro para procesamiento de pagos. El backend proporciona una API REST que será consumida por un frontend existente.

## Glossary

- **API_Server**: El servidor backend FastAPI que expone endpoints REST
- **Product_Service**: Componente que gestiona operaciones relacionadas con productos
- **Order_Service**: Componente que gestiona la creación y actualización de órdenes
- **Payment_Service**: Componente que gestiona la integración con MercadoPago
- **Webhook_Handler**: Componente que procesa notificaciones de MercadoPago
- **Database**: Base de datos PostgreSQL en Supabase
- **Order**: Registro de una compra que contiene información del cliente y estado de pago
- **Order_Item**: Registro individual de un producto dentro de una orden
- **Preference_ID**: Identificador único de la preferencia de pago en MercadoPago
- **Init_Point**: URL de checkout generada por MercadoPago
- **Stock**: Cantidad disponible de un producto

## Requirements

### Requirement 1: Gestión de Productos

**User Story:** Como desarrollador frontend, quiero obtener la lista de productos desde la API, para que pueda mostrarlos en la interfaz de usuario.

#### Acceptance Criteria

1. WHEN a GET request is made to /products, THE API_Server SHALL retrieve all products from the Database
2. WHEN products are retrieved successfully, THE API_Server SHALL return a JSON array with product data and HTTP status 200
3. WHEN the Database connection fails, THE API_Server SHALL return an error message and HTTP status 500
4. THE Product_Service SHALL include product id, name, description, price, and stock in the response

### Requirement 2: Validación de Órdenes

**User Story:** Como desarrollador backend, quiero validar las órdenes contra la base de datos, para que garantice la integridad de los datos y precios correctos.

#### Acceptance Criteria

1. WHEN a POST request is made to /orders, THE Order_Service SHALL validate that all product IDs exist in the Database
2. WHEN a product ID does not exist, THE API_Server SHALL return an error message and HTTP status 400
3. WHEN validating products, THE Order_Service SHALL retrieve current prices from the Database
4. THE Order_Service SHALL calculate the order total using Database prices, not client-provided prices
5. WHEN a product has insufficient stock, THE API_Server SHALL return an error message and HTTP status 400

### Requirement 3: Creación de Órdenes

**User Story:** Como cliente, quiero crear una orden de compra, para que pueda proceder al pago de mis productos seleccionados.

#### Acceptance Criteria

1. WHEN an order is validated successfully, THE Order_Service SHALL save the order to the Database with status "pending"
2. WHEN saving an order, THE Order_Service SHALL store customer name, email, phone, and calculated total
3. WHEN saving an order, THE Order_Service SHALL create order_items records for each product with product_id, quantity, and unit_price
4. WHEN the order is saved successfully, THE API_Server SHALL return the order ID and HTTP status 201
5. THE Order_Service SHALL execute order and order_items creation within a database transaction

### Requirement 4: Integración con MercadoPago

**User Story:** Como cliente, quiero recibir un link de pago de MercadoPago, para que pueda completar mi compra de forma segura.

#### Acceptance Criteria

1. WHEN an order is created successfully, THE Payment_Service SHALL create a payment preference in MercadoPago API
2. WHEN creating the preference, THE Payment_Service SHALL include all order items with title, quantity, and unit_price
3. WHEN the preference is created successfully, THE Payment_Service SHALL save the Preference_ID in the order record
4. WHEN the preference is created successfully, THE API_Server SHALL return the Init_Point to the client
5. WHEN MercadoPago API fails, THE API_Server SHALL return an error message and HTTP status 500

### Requirement 5: Procesamiento de Webhooks

**User Story:** Como sistema backend, quiero recibir notificaciones de MercadoPago, para que pueda actualizar el estado de las órdenes automáticamente.

#### Acceptance Criteria

1. WHEN a POST request is made to /webhook, THE Webhook_Handler SHALL extract the payment ID from the notification
2. WHEN a payment ID is received, THE Webhook_Handler SHALL query MercadoPago API to verify the payment status
3. WHEN the payment status is "approved", THE Order_Service SHALL update the order status to "paid"
4. WHEN updating order status to "paid", THE Product_Service SHALL decrement the stock for each product in the order
5. WHEN stock update fails, THE API_Server SHALL log the error but SHALL NOT revert the order status
6. THE Webhook_Handler SHALL return HTTP status 200 to acknowledge receipt of the notification

### Requirement 6: Esquema de Base de Datos

**User Story:** Como desarrollador backend, quiero un esquema de base de datos normalizado, para que garantice la integridad y consistencia de los datos.

#### Acceptance Criteria

1. THE Database SHALL contain a products table with columns: id, name, description, price, stock, created_at
2. THE Database SHALL contain an orders table with columns: id, customer_name, customer_email, customer_phone, total, status, preference_id, created_at
3. THE Database SHALL contain an order_items table with columns: id, order_id, product_id, quantity, unit_price
4. THE order_items table SHALL have a foreign key constraint referencing orders(id)
5. THE order_items table SHALL have a foreign key constraint referencing products(id)

### Requirement 7: Configuración y Seguridad

**User Story:** Como administrador del sistema, quiero que las credenciales sensibles se gestionen mediante variables de entorno, para que el sistema sea seguro y configurable.

#### Acceptance Criteria

1. THE API_Server SHALL load Supabase connection credentials from environment variables
2. THE API_Server SHALL load MercadoPago access token from environment variables
3. THE API_Server SHALL load MercadoPago webhook secret from environment variables
4. WHEN required environment variables are missing, THE API_Server SHALL fail to start and log an error message
5. THE API_Server SHALL enable CORS to allow requests from the frontend domain

### Requirement 8: Arquitectura del Código

**User Story:** Como desarrollador backend, quiero una arquitectura limpia y modular, para que el código sea mantenible y escalable.

#### Acceptance Criteria

1. THE API_Server SHALL separate route handlers, business logic services, and database access layers
2. THE API_Server SHALL define routes in a dedicated routes module
3. THE API_Server SHALL implement business logic in service modules (Product_Service, Order_Service, Payment_Service)
4. THE API_Server SHALL implement database operations in a dedicated database module
5. THE API_Server SHALL use dependency injection for service dependencies

### Requirement 9: Manejo de Errores

**User Story:** Como desarrollador frontend, quiero recibir mensajes de error claros, para que pueda informar al usuario sobre problemas específicos.

#### Acceptance Criteria

1. WHEN a validation error occurs, THE API_Server SHALL return a JSON response with an error message and appropriate HTTP status code
2. WHEN a database error occurs, THE API_Server SHALL log the detailed error and return a generic error message to the client
3. WHEN an external API error occurs, THE API_Server SHALL log the error and return an appropriate error message
4. THE API_Server SHALL use HTTP status 400 for client errors
5. THE API_Server SHALL use HTTP status 500 for server errors

### Requirement 10: Parser de Configuración

**User Story:** Como desarrollador backend, quiero cargar y validar la configuración de la aplicación, para que el sistema funcione correctamente en diferentes entornos.

#### Acceptance Criteria

1. WHEN the application starts, THE Config_Parser SHALL parse environment variables into a Configuration object
2. WHEN required environment variables are missing, THE Config_Parser SHALL raise a descriptive error
3. THE Config_Validator SHALL validate that database URLs are properly formatted
4. THE Config_Validator SHALL validate that API tokens are non-empty strings
5. FOR ALL valid Configuration objects, serializing then deserializing SHALL produce an equivalent object (round-trip property)
