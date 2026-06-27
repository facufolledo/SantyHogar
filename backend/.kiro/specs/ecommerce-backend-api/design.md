# Design Document: E-Commerce Backend API

## Overview

Este documento describe el diseño técnico de un backend de e-commerce construido con FastAPI que gestiona productos, órdenes y pagos. El sistema implementa una arquitectura limpia de tres capas (routes, services, database) que garantiza separación de responsabilidades y facilita el mantenimiento.

El backend se integra con:
- **Supabase (PostgreSQL)**: Para persistencia de datos con esquema relacional normalizado
- **MercadoPago Checkout Pro**: Para procesamiento de pagos mediante flujo de redirección

El sistema maneja el ciclo completo de una orden: validación de productos y stock, creación de orden, generación de preferencia de pago en MercadoPago, y actualización automática del estado mediante webhooks.

## Architecture

### High-Level Architecture

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────────────────────────────────┐
│         FastAPI Application             │
│  ┌───────────────────────────────────┐  │
│  │         Routes Layer              │  │
│  │  /products  /orders  /webhook     │  │
│  └───────────┬───────────────────────┘  │
│              │                           │
│  ┌───────────▼───────────────────────┐  │
│  │       Services Layer              │  │
│  │  ProductService                   │  │
│  │  OrderService                     │  │
│  │  PaymentService                   │  │
│  └───────────┬───────────────────────┘  │
│              │                           │
│  ┌───────────▼───────────────────────┐  │
│  │      Database Layer               │  │
│  │  Database operations & queries    │  │
│  └───────────┬───────────────────────┘  │
└──────────────┼───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│  Supabase   │  │  MercadoPago │
│ PostgreSQL  │  │     API      │
└─────────────┘  └──────────────┘
```

### Layer Responsibilities

**Routes Layer** (`app/routes/`)
- Define endpoints y validación de entrada con Pydantic
- Manejo de request/response HTTP
- Inyección de dependencias de servicios
- Conversión de excepciones a respuestas HTTP apropiadas

**Services Layer** (`app/services/`)
- Lógica de negocio y orquestación
- Validación de reglas de negocio
- Coordinación entre múltiples operaciones
- Transformación de datos entre capas

**Database Layer** (`app/database/`)
- Operaciones CRUD con PostgreSQL
- Gestión de transacciones
- Queries y joins
- Manejo de conexiones

### Directory Structure

```
ecommerce-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization, CORS, startup
│   ├── config.py               # Configuration loading and validation
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── products.py         # GET /products
│   │   ├── orders.py           # POST /orders
│   │   └── webhook.py          # POST /webhook
│   ├── services/
│   │   ├── __init__.py
│   │   ├── product_service.py  # Product business logic
│   │   ├── order_service.py    # Order creation and validation
│   │   └── payment_service.py  # MercadoPago integration
│   ├── database/
│   │   ├── __init__.py
│   │   ├── connection.py       # Supabase client setup
│   │   └── operations.py       # Database queries
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic models
│   └── exceptions.py           # Custom exceptions
├── tests/
│   ├── unit/
│   └── properties/
├── .env.example
├── requirements.txt
└── README.md
```

## Components and Interfaces

### Routes Components

#### ProductsRouter (`app/routes/products.py`)

```python
@router.get("/products", response_model=List[ProductResponse])
async def get_products(
    product_service: ProductService = Depends(get_product_service)
) -> List[ProductResponse]:
    """
    Retrieve all products from database.
    
    Returns:
        List of products with id, name, description, price, stock
    
    Raises:
        HTTPException(500): Database connection error
    """
```

#### OrdersRouter (`app/routes/orders.py`)

```python
@router.post("/orders", response_model=OrderResponse, status_code=201)
async def create_order(
    order_request: OrderRequest,
    order_service: OrderService = Depends(get_order_service),
    payment_service: PaymentService = Depends(get_payment_service)
) -> OrderResponse:
    """
    Create new order and generate MercadoPago payment link.
    
    Args:
        order_request: Customer info and list of items (product_id, quantity)
    
    Returns:
        order_id and init_point (MercadoPago checkout URL)
    
    Raises:
        HTTPException(400): Invalid product ID or insufficient stock
        HTTPException(500): Database or MercadoPago API error
    """
```

#### WebhookRouter (`app/routes/webhook.py`)

```python
@router.post("/webhook", status_code=200)
async def handle_webhook(
    request: Request,
    order_service: OrderService = Depends(get_order_service),
    payment_service: PaymentService = Depends(get_payment_service),
    product_service: ProductService = Depends(get_product_service)
) -> dict:
    """
    Process MercadoPago payment notifications.
    
    Args:
        request: Webhook notification with payment data
    
    Returns:
        {"status": "ok"}
    
    Side Effects:
        - Updates order status to "paid" if payment approved
        - Decrements product stock for paid orders
    """
```

### Services Components

#### ProductService (`app/services/product_service.py`)

```python
class ProductService:
    def __init__(self, db_operations: DatabaseOperations):
        self.db = db_operations
    
    async def get_all_products(self) -> List[Product]:
        """Retrieve all products from database."""
    
    async def validate_products_exist(self, product_ids: List[int]) -> None:
        """
        Validate that all product IDs exist in database.
        Raises: ProductNotFoundError if any ID is invalid
        """
    
    async def check_stock_availability(
        self, items: List[Tuple[int, int]]
    ) -> None:
        """
        Check if sufficient stock exists for all items.
        Args: items as [(product_id, quantity), ...]
        Raises: InsufficientStockError if any product lacks stock
        """
    
    async def decrement_stock(self, order_id: int) -> None:
        """
        Decrement stock for all products in an order.
        Args: order_id to lookup order_items
        """
```

#### OrderService (`app/services/order_service.py`)

```python
class OrderService:
    def __init__(
        self,
        db_operations: DatabaseOperations,
        product_service: ProductService
    ):
        self.db = db_operations
        self.product_service = product_service
    
    async def create_order(
        self,
        customer_data: CustomerData,
        items: List[OrderItemRequest]
    ) -> Order:
        """
        Validate and create order with items.
        
        Process:
        1. Validate product IDs exist
        2. Check stock availability
        3. Fetch current prices from database
        4. Calculate total using database prices
        5. Create order and order_items in transaction
        
        Returns: Created order with id and calculated total
        Raises: ValidationError, InsufficientStockError
        """
    
    async def update_order_status(
        self, preference_id: str, status: str
    ) -> None:
        """Update order status by preference_id."""
    
    async def get_order_by_preference_id(
        self, preference_id: str
    ) -> Optional[Order]:
        """Retrieve order by MercadoPago preference_id."""
```

#### PaymentService (`app/services/payment_service.py`)

```python
class PaymentService:
    def __init__(self, mercadopago_access_token: str):
        self.sdk = mercadopago.SDK(mercadopago_access_token)
    
    async def create_preference(
        self, order: Order, items: List[OrderItem]
    ) -> PreferenceResponse:
        """
        Create MercadoPago payment preference.
        
        Args:
            order: Order with customer data
            items: Order items with product info
        
        Returns:
            PreferenceResponse with preference_id and init_point
        
        Raises:
            MercadoPagoError: API request failed
        """
    
    async def get_payment_info(self, payment_id: str) -> PaymentInfo:
        """
        Query MercadoPago API for payment status.
        
        Returns:
            PaymentInfo with status and preference_id
        """
```

### Database Components

#### DatabaseOperations (`app/database/operations.py`)

```python
class DatabaseOperations:
    def __init__(self, supabase_client: Client):
        self.client = supabase_client
    
    # Products
    async def get_all_products(self) -> List[dict]:
        """SELECT * FROM products"""
    
    async def get_products_by_ids(self, ids: List[int]) -> List[dict]:
        """SELECT * FROM products WHERE id IN (...)"""
    
    # Orders
    async def create_order_with_items(
        self,
        order_data: dict,
        items_data: List[dict]
    ) -> int:
        """
        Create order and order_items in transaction.
        Returns: order_id
        """
    
    async def update_order_preference_id(
        self, order_id: int, preference_id: str
    ) -> None:
        """UPDATE orders SET preference_id = ... WHERE id = ..."""
    
    async def update_order_status(
        self, preference_id: str, status: str
    ) -> None:
        """UPDATE orders SET status = ... WHERE preference_id = ..."""
    
    async def get_order_by_preference_id(
        self, preference_id: str
    ) -> Optional[dict]:
        """SELECT * FROM orders WHERE preference_id = ..."""
    
    async def get_order_items(self, order_id: int) -> List[dict]:
        """SELECT * FROM order_items WHERE order_id = ..."""
    
    # Stock
    async def decrement_product_stock(
        self, product_id: int, quantity: int
    ) -> None:
        """UPDATE products SET stock = stock - ... WHERE id = ..."""
```

## Data Models

### Pydantic Schemas (`app/models/schemas.py`)

#### Request Models

```python
class OrderItemRequest(BaseModel):
    product_id: str = Field(min_length=1)  # Frontend usa string IDs
    quantity: int = Field(gt=0)

class OrderRequest(BaseModel):
    userId: str = Field(min_length=1)
    customerName: str = Field(min_length=1, max_length=255)
    customerEmail: EmailStr
    customerPhone: str = Field(min_length=1, max_length=50)
    items: List[OrderItemRequest] = Field(min_length=1)
    paymentMethod: Literal['mp', 'fiserv'] = 'mp'
```

#### Response Models

```python
class ProductResponse(BaseModel):
    id: str
    name: str
    slug: str
    category: Literal['electrodomesticos', 'muebleria', 'colchoneria']
    subcategory: str
    price: float
    originalPrice: Optional[float] = None
    images: List[str]
    description: str
    specs: Dict[str, str]
    stock: int
    featured: bool
    brand: str
    rating: float
    reviews: int

class OrderResponse(BaseModel):
    id: str
    orderNumber: str
    init_point: str  # MercadoPago checkout URL
    status: str = "pending"
    createdAt: str

class PreferenceResponse(BaseModel):
    preference_id: str
    init_point: str
```

#### Internal Models

```python
class Product(BaseModel):
    id: str
    name: str
    slug: str
    category: Literal['electrodomesticos', 'muebleria', 'colchoneria']
    subcategory: str
    price: float
    originalPrice: Optional[float] = None
    images: List[str]
    description: str
    specs: Dict[str, str]
    stock: int
    featured: bool
    brand: str
    rating: float
    reviews: int
    created_at: datetime

class Order(BaseModel):
    id: str
    userId: str
    customerName: str
    customerEmail: str
    customerPhone: str
    total: float
    paymentMethod: Literal['mp', 'fiserv']
    status: str  # "pending" | "paid"
    preference_id: Optional[str]
    orderNumber: str
    createdAt: datetime

class OrderItem(BaseModel):
    id: str
    order_id: str
    product_id: str
    quantity: int
    unit_price: float

class PaymentInfo(BaseModel):
    payment_id: str
    status: str
    preference_id: str
```

### Configuration Model

```python
class Config(BaseModel):
    # Supabase
    supabase_url: str
    supabase_key: str
    
    # MercadoPago
    mercadopago_access_token: str
    mercadopago_webhook_secret: Optional[str]
    
    # CORS
    frontend_url: str
    
    @validator('supabase_url')
    def validate_supabase_url(cls, v):
        if not v.startswith('https://'):
            raise ValueError('Supabase URL must start with https://')
        return v
    
    @validator('mercadopago_access_token', 'supabase_key')
    def validate_non_empty(cls, v):
        if not v or v.strip() == '':
            raise ValueError('Token cannot be empty')
        return v
```

### Database Schema

#### Tabla productos

```sql
CREATE TABLE productos (
    id_producto TEXT PRIMARY KEY,  -- Frontend usa string IDs como '1', '2', etc.
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('electrodomesticos', 'muebleria', 'colchoneria')),
    subcategoria VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    precio_original DECIMAL(10, 2) CHECK (precio_original >= 0),
    imagenes JSONB NOT NULL,  -- Array de URLs
    descripcion TEXT,
    especificaciones JSONB,  -- Object con especificaciones
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    destacado BOOLEAN DEFAULT FALSE,
    marca VARCHAR(100) NOT NULL,
    calificacion DECIMAL(2, 1) DEFAULT 0 CHECK (calificacion >= 0 AND calificacion <= 5),
    cantidad_resenas INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_destacado ON productos(destacado);
CREATE INDEX idx_productos_slug ON productos(slug);
```

#### Tabla ordenes

```sql
CREATE TABLE ordenes (
    id_orden TEXT PRIMARY KEY,  -- UUID o timestamp-based ID
    id_usuario TEXT NOT NULL,
    nombre_cliente VARCHAR(255) NOT NULL,
    email_cliente VARCHAR(255) NOT NULL,
    telefono_cliente VARCHAR(50) NOT NULL,
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('mp', 'fiserv')),
    estado VARCHAR(50) NOT NULL DEFAULT 'pending',
    id_preferencia VARCHAR(255) UNIQUE,
    numero_orden VARCHAR(50) UNIQUE NOT NULL,  -- Ej: SH12345
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ordenes_id_preferencia ON ordenes(id_preferencia);
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_ordenes_id_usuario ON ordenes(id_usuario);
CREATE INDEX idx_ordenes_numero_orden ON ordenes(numero_orden);
```

#### Tabla items_orden

```sql
CREATE TABLE items_orden (
    id_item TEXT PRIMARY KEY,
    id_orden TEXT NOT NULL REFERENCES ordenes(id_orden) ON DELETE CASCADE,
    id_producto TEXT NOT NULL REFERENCES productos(id_producto),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0)
);

CREATE INDEX idx_items_orden_id_orden ON items_orden(id_orden);
CREATE INDEX idx_items_orden_id_producto ON items_orden(id_producto);
```

### Integration Flows

#### Order Creation Flow

```
Client                  API                 OrderService         PaymentService      Database         MercadoPago
  │                      │                       │                     │                │                 │
  ├─POST /orders────────>│                       │                     │                │                 │
  │                      ├─create_order()───────>│                     │                │                 │
  │                      │                       ├─validate_products───┼───────────────>│                 │
  │                      │                       │<────────────────────┼────────────────┤                 │
  │                      │                       ├─check_stock─────────┼───────────────>│                 │
  │                      │                       │<────────────────────┼────────────────┤                 │
  │                      │                       ├─get_prices──────────┼───────────────>│                 │
  │                      │                       │<────────────────────┼────────────────┤                 │
  │                      │                       ├─create_order────────┼───────────────>│                 │
  │                      │                       │<─order_id───────────┼────────────────┤                 │
  │                      │<──order──────────────┤                     │                │                 │
  │                      ├─create_preference()──┼─────────────────────>│                │                 │
  │                      │                       │                     ├─POST /preferences───────────────>│
  │                      │                       │                     │<─preference_id,init_point────────┤
  │                      │                       │                     ├─update_preference_id────────────>│
  │                      │<─PreferenceResponse──┼─────────────────────┤                │                 │
  │<─200 {order_id,init_point}─────────────────┤                     │                │                 │
```

#### Webhook Processing Flow

```
MercadoPago         API              WebhookHandler    PaymentService    OrderService    ProductService   Database
     │               │                     │                 │                │                │             │
     ├─POST /webhook>│                     │                 │                │                │             │
     │               ├─handle_webhook()───>│                 │                │                │             │
     │               │                     ├─get_payment_info()──────────────>│                │             │
     │               │                     │                 ├─GET /payments/{id}──>           │             │
     │               │                     │                 │<─payment_data────────           │             │
     │               │                     │<────────────────┤                │                │             │
     │               │                     │ (if approved)   │                │                │             │
     │               │                     ├─update_order_status()───────────>│                │             │
     │               │                     │                 │                ├───────────────────────────>│
     │               │                     │                 │                │<──────────────────────────┤
     │               │                     ├─decrement_stock()───────────────────────────────>│             │
     │               │                     │                 │                │                ├───────────>│
     │               │                     │                 │                │                │<──────────┤
     │               │<─{"status":"ok"}────┤                 │                │                │             │
     │<─200──────────┤                     │                 │                │                │             │
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Complete Product Retrieval

*For any* set of products in the database, calling GET /products should return all products without omission.

**Validates: Requirements 1.1**

### Property 2: Product Response Format

*For any* successful product retrieval, the API response should be a JSON array with HTTP status 200.

**Validates: Requirements 1.2**

### Property 3: Product Response Completeness

*For any* product in the response, it should contain all required fields: id, name, description, price, and stock.

**Validates: Requirements 1.4**

### Property 4: Invalid Product Rejection

*For any* order containing at least one non-existent product ID, the Order_Service should reject the order with an error message and HTTP status 400.

**Validates: Requirements 2.1, 2.2**

### Property 5: Price Integrity

*For any* order, the calculated total should equal the sum of (database_price × quantity) for all items, regardless of any client-provided price values.

**Validates: Requirements 2.3, 2.4**

### Property 6: Stock Validation

*For any* order where the requested quantity of any product exceeds available stock, the Order_Service should reject the order with an error message and HTTP status 400.

**Validates: Requirements 2.5**

### Property 7: Initial Order Status

*For any* newly created order, its status in the database should be "pending".

**Validates: Requirements 3.1**

### Property 8: Order Data Persistence

*For any* created order, querying it from the database should return all customer fields (name, email, phone) and the calculated total.

**Validates: Requirements 3.2**

### Property 9: Order Items Creation

*For any* order with N items, the database should contain exactly N order_items records with correct product_id, quantity, and unit_price for each item.

**Validates: Requirements 3.3**

### Property 10: Order Creation Response

*For any* successfully created order, the API response should contain the order_id and HTTP status 201.

**Validates: Requirements 3.4**

### Property 11: Transactional Atomicity

*For any* order creation attempt, either both the order and all order_items are created, or neither exists in the database (no partial state).

**Validates: Requirements 3.5**

### Property 12: Payment Preference Completeness

*For any* order sent to MercadoPago, the preference should include all order items with their title, quantity, and unit_price.

**Validates: Requirements 4.2**

### Property 13: Preference ID Persistence

*For any* order with a successfully created MercadoPago preference, querying the order from the database should return the preference_id, and the API response should contain the init_point.

**Validates: Requirements 4.1, 4.3, 4.4**

### Property 14: Webhook Payment ID Extraction

*For any* valid webhook notification payload, the Webhook_Handler should successfully extract the payment_id.

**Validates: Requirements 5.1**

### Property 15: Payment Status Verification

*For any* payment_id received in a webhook, the Webhook_Handler should query the MercadoPago API to verify the payment status.

**Validates: Requirements 5.2**

### Property 16: Order Status Update on Payment

*For any* order associated with an approved payment, the order status in the database should be updated to "paid".

**Validates: Requirements 5.3**

### Property 17: Stock Decrement on Payment

*For any* order that transitions to "paid" status, the stock of each product in the order should decrease by the ordered quantity.

**Validates: Requirements 5.4**

### Property 18: Webhook Acknowledgment

*For any* webhook request, the Webhook_Handler should return HTTP status 200.

**Validates: Requirements 5.6**

### Property 19: Configuration Validation

*For any* configuration missing required environment variables (supabase_url, supabase_key, mercadopago_access_token, frontend_url), the Config_Parser should raise a descriptive error and prevent application startup.

**Validates: Requirements 7.4, 10.2**

### Property 20: Error Response Format

*For any* validation error, the API should return a JSON response containing an error message with the appropriate HTTP status code.

**Validates: Requirements 9.1**

### Property 21: Error Status Code Mapping

*For any* client error (validation failure, resource not found, insufficient stock), the API should return HTTP status 400, and for any server error (database failure, external API failure), the API should return HTTP status 500.

**Validates: Requirements 9.4, 9.5**

### Property 22: Configuration Parsing

*For any* valid set of environment variables, the Config_Parser should successfully parse them into a Configuration object with all fields populated.

**Validates: Requirements 10.1**

### Property 23: URL Format Validation

*For any* configuration with a supabase_url that does not start with "https://", the Config_Validator should reject it with a validation error.

**Validates: Requirements 10.3**

### Property 24: Token Non-Empty Validation

*For any* configuration with empty or whitespace-only values for mercadopago_access_token or supabase_key, the Config_Validator should reject it with a validation error.

**Validates: Requirements 10.4**

### Property 25: Configuration Round-Trip

*For any* valid Configuration object, serializing it to JSON and then deserializing it back should produce an equivalent Configuration object with all fields matching.

**Validates: Requirements 10.5**

## Error Handling

### Error Categories

**Client Errors (HTTP 400)**
- Invalid product ID in order
- Insufficient stock for requested quantity
- Missing or invalid required fields in request body
- Invalid email format
- Quantity or product_id less than or equal to 0

**Server Errors (HTTP 500)**
- Database connection failure
- Database query execution failure
- MercadoPago API request failure
- Unexpected exceptions in business logic

### Error Response Format

All errors return JSON with consistent structure:

```json
{
  "error": "Descriptive error message",
  "detail": "Additional context (optional)"
}
```

### Exception Handling Strategy

**Custom Exceptions** (`app/exceptions.py`)

```python
class ProductNotFoundError(Exception):
    """Raised when product ID doesn't exist"""
    pass

class InsufficientStockError(Exception):
    """Raised when requested quantity exceeds available stock"""
    pass

class MercadoPagoError(Exception):
    """Raised when MercadoPago API request fails"""
    pass

class DatabaseError(Exception):
    """Raised when database operation fails"""
    pass
```

**Exception Handlers in Routes**

```python
@app.exception_handler(ProductNotFoundError)
async def product_not_found_handler(request: Request, exc: ProductNotFoundError):
    return JSONResponse(
        status_code=400,
        content={"error": str(exc)}
    )

@app.exception_handler(InsufficientStockError)
async def insufficient_stock_handler(request: Request, exc: InsufficientStockError):
    return JSONResponse(
        status_code=400,
        content={"error": str(exc)}
    )

@app.exception_handler(MercadoPagoError)
async def mercadopago_error_handler(request: Request, exc: MercadoPagoError):
    logger.error(f"MercadoPago API error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Payment service temporarily unavailable"}
    )

@app.exception_handler(DatabaseError)
async def database_error_handler(request: Request, exc: DatabaseError):
    logger.error(f"Database error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )
```

### Logging Strategy

- **INFO**: Successful operations (order created, payment processed)
- **WARNING**: Recoverable issues (stock update failed but order marked paid)
- **ERROR**: Failures requiring attention (database errors, MercadoPago API failures)
- **DEBUG**: Detailed execution flow (development only)

Log format includes: timestamp, level, module, message, request_id (for tracing)

### Webhook Error Handling

Webhooks always return HTTP 200 to prevent MercadoPago retries, but log errors internally:

```python
try:
    # Process webhook
    await process_payment_notification(payment_id)
except Exception as e:
    logger.error(f"Webhook processing failed: {e}", exc_info=True)
    # Still return 200 to acknowledge receipt
    return {"status": "ok"}
```

## Testing Strategy

### Dual Testing Approach

This system requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples demonstrating correct behavior
- Edge cases (empty database, single product, maximum values)
- Error conditions (network failures, invalid data)
- Integration points between components

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariants that must always be true
- Round-trip properties (serialization, parsing)

Together, unit tests catch concrete bugs while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Library**: Use `hypothesis` for Python property-based testing

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `# Feature: ecommerce-backend-api, Property {number}: {property_text}`

**Example Property Test Structure**:

```python
from hypothesis import given, strategies as st
import pytest

# Feature: ecommerce-backend-api, Property 5: Price Integrity
@given(
    products=st.lists(
        st.fixed_dictionaries({
            'id': st.integers(min_value=1),
            'price': st.floats(min_value=0.01, max_value=10000),
        }),
        min_size=1,
        max_size=10
    ),
    quantities=st.lists(st.integers(min_value=1, max_value=100))
)
@pytest.mark.property_test
async def test_price_integrity(products, quantities):
    """
    For any order, the calculated total should equal the sum of
    (database_price × quantity) for all items.
    """
    # Setup: Insert products into test database
    # Execute: Create order with items
    # Verify: order.total == sum(db_price * qty for each item)
    pass
```

### Unit Testing Strategy

**Test Organization**:
```
tests/
├── unit/
│   ├── test_product_service.py
│   ├── test_order_service.py
│   ├── test_payment_service.py
│   ├── test_database_operations.py
│   └── test_config.py
├── properties/
│   ├── test_order_properties.py
│   ├── test_product_properties.py
│   ├── test_payment_properties.py
│   └── test_config_properties.py
└── integration/
    ├── test_order_flow.py
    └── test_webhook_flow.py
```

**Unit Test Examples**:

```python
# Example: Test specific case
async def test_create_order_with_single_product():
    """Verify order creation with one product"""
    # Given: One product in database
    # When: Create order with that product
    # Then: Order and order_item created correctly

# Example: Test edge case
async def test_create_order_with_zero_stock():
    """Verify rejection when stock is zero"""
    # Given: Product with stock=0
    # When: Attempt to order that product
    # Then: InsufficientStockError raised

# Example: Test error condition
async def test_mercadopago_api_timeout():
    """Verify handling of MercadoPago timeout"""
    # Given: Mock MercadoPago API to timeout
    # When: Create order
    # Then: MercadoPagoError raised, order not created
```

### Test Data Strategy

**Property Tests**: Use Hypothesis strategies to generate:
- Random products with valid constraints (price > 0, stock >= 0)
- Random orders with 1-10 items
- Random customer data with valid formats
- Edge cases automatically (empty strings, large numbers, special characters)

**Unit Tests**: Use fixtures for:
- Sample products with known values
- Sample orders with predictable totals
- Mock MercadoPago responses
- Test database with isolated transactions

### Integration Testing

**Order Creation Flow**:
1. Setup: Clean test database, mock MercadoPago API
2. Execute: POST /orders with valid data
3. Verify: Order in database, preference created, correct response

**Webhook Flow**:
1. Setup: Create order with preference_id
2. Execute: POST /webhook with approved payment
3. Verify: Order status updated, stock decremented

### Mocking Strategy

**Mock External Services**:
- MercadoPago API (use `responses` or `httpx-mock`)
- Supabase client (use test database or mock)

**Don't Mock**:
- Internal services (test real integration)
- Pydantic validation (test real validation logic)
- Database operations (use test database with transactions)

### CI/CD Testing

**Pre-commit**:
- Linting (ruff, black)
- Type checking (mypy)
- Fast unit tests

**CI Pipeline**:
- All unit tests
- All property tests (100 iterations each)
- Integration tests
- Coverage report (target: >80%)

**Test Database**:
- Use separate test database or transactions with rollback
- Reset state between tests
- Seed with minimal required data

