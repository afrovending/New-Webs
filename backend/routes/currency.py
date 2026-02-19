"""
AfroVending - Currency Routes
"""
from fastapi import APIRouter, Request
import httpx
import os

router = APIRouter(prefix="/currency", tags=["Currency"])

# Static exchange rates (fallback)
STATIC_RATES = {
    "USD": 1,
    "EUR": 0.92,
    "GBP": 0.79,
    "NGN": 1550,
    "KES": 153,
    "ZAR": 18.5,
    "GHS": 15.8,
    "EGP": 30.9,
    "MAD": 10,
    "XOF": 605,
}

# Country to currency mapping
COUNTRY_CURRENCY = {
    "US": "USD",
    "GB": "GBP",
    "DE": "EUR",
    "FR": "EUR",
    "NG": "NGN",
    "KE": "KES",
    "ZA": "ZAR",
    "GH": "GHS",
    "EG": "EGP",
    "MA": "MAD",
}


@router.get("/rates")
async def get_static_rates():
    """Get static exchange rates"""
    return {"rates": STATIC_RATES, "base": "USD"}


@router.get("/live-rates")
async def get_live_rates():
    """Get live exchange rates from API"""
    api_key = os.environ.get("EXCHANGE_RATE_API_KEY", "")
    
    if api_key:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://v6.exchangerate-api.com/v6/{api_key}/latest/USD",
                    timeout=5.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "rates": {k: data["conversion_rates"].get(k, v) for k, v in STATIC_RATES.items()},
                        "base": "USD",
                        "live": True
                    }
        except Exception:
            pass
    
    # Fallback to static rates
    return {"rates": STATIC_RATES, "base": "USD", "live": False}


@router.get("/detect")
async def detect_currency(request: Request):
    """Detect user's currency based on IP/headers"""
    # Try to get country from headers (set by CDN/proxy)
    country = request.headers.get("CF-IPCountry", "")
    if not country:
        country = request.headers.get("X-Country-Code", "US")
    
    currency = COUNTRY_CURRENCY.get(country.upper(), "USD")
    return {"currency": currency, "country": country}
