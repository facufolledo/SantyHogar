"""Application configuration management."""
from pathlib import Path
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_REPO_ROOT = _BACKEND_ROOT.parent


def _env_files() -> tuple[str, ...]:
    """Busca .env en múltiples ubicaciones (el último gana)."""
    paths: list[Path] = [
        _REPO_ROOT / ".env",
        _BACKEND_ROOT / ".env",
        _BACKEND_ROOT / ".kiro" / ".env",
    ]
    found = tuple(str(p) for p in paths if p.is_file())
    print(f"DEBUG: Archivos .env encontrados: {found}")
    return found


class Config(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=_env_files() or (str(_BACKEND_ROOT / ".env"),),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # Supabase
    supabase_url: str = Field(..., description="Supabase project URL")
    supabase_key: str = Field(..., description="Supabase anon/service key")
    
    # MercadoPago
    mercadopago_access_token: str = Field(..., description="MercadoPago access token")
    mercadopago_public_key: str = Field(default="", description="MercadoPago public key")
    mercadopago_webhook_secret: Optional[str] = Field(None, description="MercadoPago webhook secret")
    
    # CORS
    frontend_url: str = Field(default="http://localhost:5173", description="Frontend URL for CORS")
    
    # Desarrollo: si True, los 500 por DatabaseError incluyen el mensaje real (útil para Supabase/RLS).
    debug: bool = Field(default=False, description="Expose DB error details in API responses")

    # API
    api_host: str = Field(default="0.0.0.0", description="API host")
    api_port: int = Field(default=8000, description="API port")
    public_api_url: str = Field(
        default="http://localhost:8000",
        description="URL pública del backend (webhook Mercado Pago, back_urls si aplica)",
    )
    
    # Admin Security
    admin_master_password: str = Field(
        default="",
        description="Contraseña maestra para crear nuevos usuarios admin"
    )
    
    @field_validator('supabase_url')
    @classmethod
    def validate_supabase_url(cls, v: str) -> str:
        """Validate that Supabase URL starts with https://."""
        if not v.startswith('https://'):
            raise ValueError('Supabase URL must start with https://')
        return v
    
    @field_validator('mercadopago_access_token', 'supabase_key')
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        """Validate that tokens are non-empty."""
        if not v or v.strip() == '':
            raise ValueError('Token cannot be empty')
        return v


# Global config instance
_config: Optional[Config] = None


def get_config() -> Config:
    """Get or create the global configuration instance."""
    global _config
    if _config is None:
        _config = Config()
        # Debug: verificar que se cargó la contraseña maestra
        print(f"DEBUG CONFIG: admin_master_password = '{_config.admin_master_password}' (len={len(_config.admin_master_password)})")
    return _config
