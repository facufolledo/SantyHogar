"""Checkout routes for MercadoPago integration."""
import os
import logging

logger = logging.getLogger(__name__)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import mercadopago
import time
from app.config import get_config
from app.database.connection import get_supabase_client

router = APIRouter()


class CheckoutItem(BaseModel):
    product_id: str
    quantity: int


class CheckoutRequest(BaseModel):
    items: list[CheckoutItem]
    customer_email: EmailStr
    customer_name: str
    customer_phone: str


@router.post("/create-preference")
async def create_checkout_preference_deprecated(request: CheckoutRequest):
    """DEPRECATED: This endpoint is no longer used. Use POST /api/checkout/create-preference instead."""
    raise HTTPException(
        status_code=410,
        detail="Este endpoint está deprecado. Usa POST /api/checkout/create-preference"
    )
