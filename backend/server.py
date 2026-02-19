"""
AfroVending - Server Entry Point
Re-exports app from server_modular for backwards compatibility
"""
from server_modular import app

__all__ = ["app"]
