"""Mercado Pago puede reenviar el mismo webhook; evitar doble aplicación de efectos."""


def skip_webhook_side_effects(estado: str) -> bool:
    """
    True si no hay que volver a marcar pago ni descontar stock.

    Uso típico al inicio del handler:

        if skip_webhook_side_effects(order["estado"]):
            return {"status": "ok"}
    """
    return estado == "paid"
