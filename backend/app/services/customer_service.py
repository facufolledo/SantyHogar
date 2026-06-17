"""Servicio de gestión de clientes."""
from __future__ import annotations

import logging
from typing import Any, List, Optional
from uuid import UUID

from app.database.operations import DatabaseOperations
from app.exceptions import DatabaseError
from app.models.schemas import (
    Customer,
    CustomerListResponse,
    CustomerResponse,
    CreateCustomerRequest,
    UpdateCustomerRequest,
)

logger = logging.getLogger(__name__)


def row_to_customer(row: dict[str, Any]) -> Customer:
    """Convierte una fila de la base de datos a un objeto Customer."""
    return Customer(
        id=UUID(str(row["id_cliente"])),
        name=row.get("nombre", ""),
        email=row.get("email", ""),
        phone=row.get("telefono"),
        address=row.get("direccion"),
        city=row.get("ciudad"),
        province=row.get("provincia"),
        postal_code=row.get("codigo_postal"),
        registered_at=row.get("fecha_registro"),
        updated_at=row.get("fecha_actualizacion"),
        total_spent=float(row.get("total_gastado", 0)),
        order_count=int(row.get("cantidad_ordenes", 0)),
        notes=row.get("notas"),
        active=bool(row.get("activo", True)),
    )


def customer_to_response(customer: Customer) -> CustomerResponse:
    """Convierte un Customer a CustomerResponse (camelCase)."""
    return CustomerResponse(
        id=customer.id,
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        address=customer.address,
        city=customer.city,
        province=customer.province,
        postalCode=customer.postal_code,
        registeredAt=customer.registered_at.isoformat() if hasattr(customer.registered_at, "isoformat") else str(customer.registered_at),
        updatedAt=customer.updated_at.isoformat() if hasattr(customer.updated_at, "isoformat") else str(customer.updated_at),
        totalSpent=customer.total_spent,
        orderCount=customer.order_count,
        notes=customer.notes,
        active=customer.active,
    )


class CustomerService:
    def __init__(self, db: DatabaseOperations) -> None:
        self._db = db

    async def get_all_customers(self) -> List[CustomerListResponse]:
        """Obtiene todos los clientes (vista simplificada)."""
        rows = await self._db.get_all_customers()
        customers = []
        
        for row in rows:
            customers.append(CustomerListResponse(
                id=UUID(str(row["id_cliente"])),
                name=row.get("nombre", ""),
                email=row.get("email", ""),
                phone=row.get("telefono"),
                totalSpent=float(row.get("total_gastado", 0)),
                orderCount=int(row.get("cantidad_ordenes", 0)),
                registeredAt=row.get("fecha_registro", "").isoformat() if hasattr(row.get("fecha_registro", ""), "isoformat") else str(row.get("fecha_registro", "")),
                active=bool(row.get("activo", True)),
            ))
        
        return customers

    async def get_customer_by_id(self, customer_id: UUID) -> Optional[CustomerResponse]:
        """Obtiene un cliente por ID."""
        row = await self._db.get_customer_by_id(customer_id)
        if not row:
            return None
        
        customer = row_to_customer(row)
        return customer_to_response(customer)

    async def get_customer_by_email(self, email: str) -> Optional[CustomerResponse]:
        """Obtiene un cliente por email."""
        row = await self._db.get_customer_by_email(email)
        if not row:
            return None
        
        customer = row_to_customer(row)
        return customer_to_response(customer)

    async def create_customer(self, request: CreateCustomerRequest) -> CustomerResponse:
        """Crea un nuevo cliente."""
        # Verificar si el email ya existe
        existing = await self._db.get_customer_by_email(request.email)
        if existing:
            raise DatabaseError(f"Ya existe un cliente con el email {request.email}")
        
        # Convertir de camelCase a snake_case para la BD
        db_data = {
            "nombre": request.name,
            "email": request.email,
            "telefono": request.phone,
            "direccion": request.address,
            "ciudad": request.city,
            "provincia": request.province,
            "codigo_postal": request.postalCode,
            "notas": request.notes,
        }
        
        customer_id = await self._db.create_customer(db_data)
        
        # Obtener el cliente creado
        customer = await self.get_customer_by_id(customer_id)
        if not customer:
            raise DatabaseError("Cliente creado pero no se pudo leer")
        
        return customer

    async def update_customer(self, customer_id: UUID, request: UpdateCustomerRequest) -> CustomerResponse:
        """Actualiza un cliente existente."""
        # Verificar que el cliente existe
        existing = await self._db.get_customer_by_id(customer_id)
        if not existing:
            raise DatabaseError("Cliente no encontrado")
        
        # Si se está actualizando el email, verificar que no exista otro cliente con ese email
        if request.email and request.email != existing.get("email"):
            email_exists = await self._db.get_customer_by_email(request.email)
            if email_exists:
                raise DatabaseError(f"Ya existe otro cliente con el email {request.email}")
        
        # Convertir solo los campos que no son None
        db_data = {}
        if request.name is not None:
            db_data["nombre"] = request.name
        if request.email is not None:
            db_data["email"] = request.email
        if request.phone is not None:
            db_data["telefono"] = request.phone
        if request.address is not None:
            db_data["direccion"] = request.address
        if request.city is not None:
            db_data["ciudad"] = request.city
        if request.province is not None:
            db_data["provincia"] = request.province
        if request.postalCode is not None:
            db_data["codigo_postal"] = request.postalCode
        if request.notes is not None:
            db_data["notas"] = request.notes
        if request.active is not None:
            db_data["activo"] = request.active
        
        await self._db.update_customer(customer_id, db_data)
        
        # Obtener el cliente actualizado
        customer = await self.get_customer_by_id(customer_id)
        if not customer:
            raise DatabaseError("Cliente actualizado pero no se pudo leer")
        
        return customer

    async def delete_customer(self, customer_id: UUID) -> None:
        """Elimina un cliente (soft delete)."""
        # Verificar que el cliente existe
        existing = await self._db.get_customer_by_id(customer_id)
        if not existing:
            raise DatabaseError("Cliente no encontrado")
        
        await self._db.delete_customer(customer_id)

    async def get_customer_orders(self, customer_id: UUID) -> List[dict[str, Any]]:
        """Obtiene todas las órdenes de un cliente."""
        return await self._db.get_customer_orders(customer_id)

    async def update_customer_stats(self, customer_id: UUID) -> None:
        """Actualiza las estadísticas del cliente."""
        await self._db.update_customer_stats(customer_id)
