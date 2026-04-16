"""Application-specific exceptions."""


class AppError(Exception):
    """Base class for domain errors."""

    def __init__(self, message: str = "") -> None:
        self.message = message
        super().__init__(message)


class ProductNotFoundError(AppError):
    """Raised when a referenced product does not exist."""

    pass


class InsufficientStockError(AppError):
    """Raised when ordered quantity exceeds available stock."""

    pass


class MercadoPagoError(AppError):
    """Raised when Mercado Pago API returns an error or invalid response."""

    pass


class DatabaseError(AppError):
    """Raised when a database operation fails."""

    pass
