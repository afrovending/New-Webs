"""
AfroVending - Shipping Routes with EasyPost Integration
Real-time shipping rates, address verification, and label generation
"""
import os
import easypost
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, timezone
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/shipping", tags=["Shipping"])

# Initialize EasyPost client
EASYPOST_API_KEY = os.environ.get('EASYPOST_API_KEY', '')
client = None

def get_easypost_client():
    global client
    if client is None and EASYPOST_API_KEY:
        client = easypost.EasyPostClient(EASYPOST_API_KEY)
    return client


# Worldwide Countries List
WORLDWIDE_COUNTRIES = [
    # Africa
    {"code": "NG", "name": "Nigeria", "region": "Africa", "flag": "🇳🇬"},
    {"code": "GH", "name": "Ghana", "region": "Africa", "flag": "🇬🇭"},
    {"code": "KE", "name": "Kenya", "region": "Africa", "flag": "🇰🇪"},
    {"code": "ZA", "name": "South Africa", "region": "Africa", "flag": "🇿🇦"},
    {"code": "ET", "name": "Ethiopia", "region": "Africa", "flag": "🇪🇹"},
    {"code": "TZ", "name": "Tanzania", "region": "Africa", "flag": "🇹🇿"},
    {"code": "SN", "name": "Senegal", "region": "Africa", "flag": "🇸🇳"},
    {"code": "CM", "name": "Cameroon", "region": "Africa", "flag": "🇨🇲"},
    {"code": "CI", "name": "Ivory Coast", "region": "Africa", "flag": "🇨🇮"},
    {"code": "MA", "name": "Morocco", "region": "Africa", "flag": "🇲🇦"},
    {"code": "EG", "name": "Egypt", "region": "Africa", "flag": "🇪🇬"},
    {"code": "UG", "name": "Uganda", "region": "Africa", "flag": "🇺🇬"},
    {"code": "DZ", "name": "Algeria", "region": "Africa", "flag": "🇩🇿"},
    {"code": "AO", "name": "Angola", "region": "Africa", "flag": "🇦🇴"},
    {"code": "BJ", "name": "Benin", "region": "Africa", "flag": "🇧🇯"},
    {"code": "BW", "name": "Botswana", "region": "Africa", "flag": "🇧🇼"},
    {"code": "CD", "name": "Congo (DRC)", "region": "Africa", "flag": "🇨🇩"},
    {"code": "RW", "name": "Rwanda", "region": "Africa", "flag": "🇷🇼"},
    {"code": "ZM", "name": "Zambia", "region": "Africa", "flag": "🇿🇲"},
    {"code": "ZW", "name": "Zimbabwe", "region": "Africa", "flag": "🇿🇼"},
    
    # North America
    {"code": "US", "name": "United States", "region": "North America", "flag": "🇺🇸"},
    {"code": "CA", "name": "Canada", "region": "North America", "flag": "🇨🇦"},
    {"code": "MX", "name": "Mexico", "region": "North America", "flag": "🇲🇽"},
    
    # Europe
    {"code": "GB", "name": "United Kingdom", "region": "Europe", "flag": "🇬🇧"},
    {"code": "DE", "name": "Germany", "region": "Europe", "flag": "🇩🇪"},
    {"code": "FR", "name": "France", "region": "Europe", "flag": "🇫🇷"},
    {"code": "IT", "name": "Italy", "region": "Europe", "flag": "🇮🇹"},
    {"code": "ES", "name": "Spain", "region": "Europe", "flag": "🇪🇸"},
    {"code": "NL", "name": "Netherlands", "region": "Europe", "flag": "🇳🇱"},
    {"code": "BE", "name": "Belgium", "region": "Europe", "flag": "🇧🇪"},
    {"code": "PT", "name": "Portugal", "region": "Europe", "flag": "🇵🇹"},
    {"code": "CH", "name": "Switzerland", "region": "Europe", "flag": "🇨🇭"},
    {"code": "AT", "name": "Austria", "region": "Europe", "flag": "🇦🇹"},
    {"code": "SE", "name": "Sweden", "region": "Europe", "flag": "🇸🇪"},
    {"code": "NO", "name": "Norway", "region": "Europe", "flag": "🇳🇴"},
    {"code": "DK", "name": "Denmark", "region": "Europe", "flag": "🇩🇰"},
    {"code": "FI", "name": "Finland", "region": "Europe", "flag": "🇫🇮"},
    {"code": "IE", "name": "Ireland", "region": "Europe", "flag": "🇮🇪"},
    {"code": "PL", "name": "Poland", "region": "Europe", "flag": "🇵🇱"},
    {"code": "CZ", "name": "Czech Republic", "region": "Europe", "flag": "🇨🇿"},
    {"code": "GR", "name": "Greece", "region": "Europe", "flag": "🇬🇷"},
    
    # Asia
    {"code": "CN", "name": "China", "region": "Asia", "flag": "🇨🇳"},
    {"code": "JP", "name": "Japan", "region": "Asia", "flag": "🇯🇵"},
    {"code": "KR", "name": "South Korea", "region": "Asia", "flag": "🇰🇷"},
    {"code": "IN", "name": "India", "region": "Asia", "flag": "🇮🇳"},
    {"code": "SG", "name": "Singapore", "region": "Asia", "flag": "🇸🇬"},
    {"code": "MY", "name": "Malaysia", "region": "Asia", "flag": "🇲🇾"},
    {"code": "TH", "name": "Thailand", "region": "Asia", "flag": "🇹🇭"},
    {"code": "ID", "name": "Indonesia", "region": "Asia", "flag": "🇮🇩"},
    {"code": "PH", "name": "Philippines", "region": "Asia", "flag": "🇵🇭"},
    {"code": "VN", "name": "Vietnam", "region": "Asia", "flag": "🇻🇳"},
    {"code": "AE", "name": "United Arab Emirates", "region": "Asia", "flag": "🇦🇪"},
    {"code": "SA", "name": "Saudi Arabia", "region": "Asia", "flag": "🇸🇦"},
    {"code": "IL", "name": "Israel", "region": "Asia", "flag": "🇮🇱"},
    {"code": "TR", "name": "Turkey", "region": "Asia", "flag": "🇹🇷"},
    
    # South America
    {"code": "BR", "name": "Brazil", "region": "South America", "flag": "🇧🇷"},
    {"code": "AR", "name": "Argentina", "region": "South America", "flag": "🇦🇷"},
    {"code": "CL", "name": "Chile", "region": "South America", "flag": "🇨🇱"},
    {"code": "CO", "name": "Colombia", "region": "South America", "flag": "🇨🇴"},
    {"code": "PE", "name": "Peru", "region": "South America", "flag": "🇵🇪"},
    
    # Oceania
    {"code": "AU", "name": "Australia", "region": "Oceania", "flag": "🇦🇺"},
    {"code": "NZ", "name": "New Zealand", "region": "Oceania", "flag": "🇳🇿"},
    
    # Caribbean
    {"code": "JM", "name": "Jamaica", "region": "Caribbean", "flag": "🇯🇲"},
    {"code": "TT", "name": "Trinidad and Tobago", "region": "Caribbean", "flag": "🇹🇹"},
    {"code": "BB", "name": "Barbados", "region": "Caribbean", "flag": "🇧🇧"},
    {"code": "BS", "name": "Bahamas", "region": "Caribbean", "flag": "🇧🇸"},
]

# Regional shipping rates (USD base rates)
REGIONAL_RATES = {
    "Africa": {"base": 15.00, "per_kg": 5.00, "delivery_days": "5-10"},
    "North America": {"base": 25.00, "per_kg": 8.00, "delivery_days": "3-7"},
    "Europe": {"base": 30.00, "per_kg": 10.00, "delivery_days": "5-10"},
    "Asia": {"base": 35.00, "per_kg": 12.00, "delivery_days": "7-14"},
    "South America": {"base": 40.00, "per_kg": 15.00, "delivery_days": "10-20"},
    "Oceania": {"base": 45.00, "per_kg": 15.00, "delivery_days": "10-15"},
    "Caribbean": {"base": 30.00, "per_kg": 10.00, "delivery_days": "7-14"},
}


# Pydantic Models
class AddressModel(BaseModel):
    name: str
    street1: str
    street2: Optional[str] = None
    city: str
    state: str
    zip: str
    country: str = "US"
    phone: Optional[str] = None
    email: Optional[str] = None


class ParcelModel(BaseModel):
    length: float = Field(..., gt=0, description="Length in inches")
    width: float = Field(..., gt=0, description="Width in inches")
    height: float = Field(..., gt=0, description="Height in inches")
    weight: float = Field(..., gt=0, description="Weight in ounces")


class RateRequest(BaseModel):
    from_address: AddressModel
    to_address: AddressModel
    parcel: ParcelModel


class ShipmentRequest(BaseModel):
    from_address: AddressModel
    to_address: AddressModel
    parcel: ParcelModel
    rate_id: str
    order_id: Optional[str] = None


# Routes
@router.get("/countries")
async def get_shipping_countries(region: Optional[str] = None):
    """Get all available shipping countries, optionally filtered by region"""
    countries = WORLDWIDE_COUNTRIES
    
    if region:
        countries = [c for c in countries if c["region"].lower() == region.lower()]
    
    # Group by region
    regions = {}
    for country in countries:
        r = country["region"]
        if r not in regions:
            regions[r] = []
        regions[r].append(country)
    
    return {
        "countries": countries,
        "by_region": regions,
        "total": len(countries)
    }


@router.get("/regions")
async def get_shipping_regions():
    """Get shipping regions with rates"""
    return {
        "regions": REGIONAL_RATES,
        "note": "Rates are in USD. Actual rates may vary based on package dimensions."
    }


@router.post("/estimate")
async def estimate_shipping(
    country_code: str,
    weight_kg: float = 1.0
):
    """
    Get estimated shipping cost based on destination country and weight.
    This is a quick estimate before full rate calculation.
    """
    country = next((c for c in WORLDWIDE_COUNTRIES if c["code"] == country_code), None)
    if not country:
        raise HTTPException(status_code=400, detail="Country not supported")
    
    region = country["region"]
    rates = REGIONAL_RATES.get(region)
    
    if not rates:
        raise HTTPException(status_code=400, detail="Region rates not available")
    
    estimated_cost = rates["base"] + (weight_kg * rates["per_kg"])
    
    return {
        "country": country,
        "weight_kg": weight_kg,
        "estimated_cost": round(estimated_cost, 2),
        "delivery_days": rates["delivery_days"],
        "currency": "USD",
        "note": "This is an estimate. Actual rates may vary."
    }


@router.post("/verify-address")
async def verify_address(address: AddressModel):
    """
    Verify and validate a shipping address using EasyPost.
    Returns verified address with corrections if needed.
    """
    ep_client = get_easypost_client()
    
    if not ep_client:
        # Fallback: basic validation without EasyPost
        return {
            "verified": True,
            "original": address.dict(),
            "verified_address": address.dict(),
            "note": "Basic validation only - EasyPost not configured"
        }
    
    try:
        verified = ep_client.address.create_and_verify(
            street1=address.street1,
            street2=address.street2,
            city=address.city,
            state=address.state,
            zip=address.zip,
            country=address.country,
            name=address.name,
            phone=address.phone,
            email=address.email
        )
        
        return {
            "verified": True,
            "address_id": verified.id,
            "verified_address": {
                "name": verified.name,
                "street1": verified.street1,
                "street2": verified.street2,
                "city": verified.city,
                "state": verified.state,
                "zip": verified.zip,
                "country": verified.country,
                "phone": verified.phone,
                "residential": getattr(verified, "residential", None)
            },
            "original": address.dict()
        }
    except Exception as e:
        return {
            "verified": False,
            "error": str(e),
            "original": address.dict()
        }


@router.post("/rates")
async def get_shipping_rates(request: RateRequest):
    """
    Get real-time shipping rates from multiple carriers using EasyPost.
    Returns sorted list of available shipping options.
    """
    ep_client = get_easypost_client()
    
    # Get destination country for regional rates fallback
    dest_country = next(
        (c for c in WORLDWIDE_COUNTRIES if c["code"] == request.to_address.country),
        None
    )
    
    if not ep_client:
        # Fallback: use regional rates
        if not dest_country:
            raise HTTPException(status_code=400, detail="Destination country not supported")
        
        region = dest_country["region"]
        regional_rate = REGIONAL_RATES.get(region, REGIONAL_RATES["North America"])
        
        weight_kg = request.parcel.weight / 35.274  # oz to kg
        estimated_cost = regional_rate["base"] + (weight_kg * regional_rate["per_kg"])
        
        return {
            "rates": [
                {
                    "id": "standard_shipping",
                    "carrier": "AfroVending Shipping",
                    "service": "Standard International",
                    "rate": round(estimated_cost, 2),
                    "currency": "USD",
                    "delivery_days": regional_rate["delivery_days"],
                    "delivery_estimate": regional_rate["delivery_days"] + " business days"
                },
                {
                    "id": "express_shipping",
                    "carrier": "AfroVending Shipping",
                    "service": "Express International",
                    "rate": round(estimated_cost * 1.5, 2),
                    "currency": "USD",
                    "delivery_days": "3-5",
                    "delivery_estimate": "3-5 business days"
                }
            ],
            "shipment_id": None,
            "fallback": True
        }
    
    try:
        # Create shipment to get rates
        shipment = ep_client.shipment.create(
            from_address={
                "name": request.from_address.name,
                "street1": request.from_address.street1,
                "street2": request.from_address.street2,
                "city": request.from_address.city,
                "state": request.from_address.state,
                "zip": request.from_address.zip,
                "country": request.from_address.country,
                "phone": request.from_address.phone,
                "email": request.from_address.email
            },
            to_address={
                "name": request.to_address.name,
                "street1": request.to_address.street1,
                "street2": request.to_address.street2,
                "city": request.to_address.city,
                "state": request.to_address.state,
                "zip": request.to_address.zip,
                "country": request.to_address.country,
                "phone": request.to_address.phone,
                "email": request.to_address.email
            },
            parcel={
                "length": request.parcel.length,
                "width": request.parcel.width,
                "height": request.parcel.height,
                "weight": request.parcel.weight
            }
        )
        
        rates = []
        for rate in shipment.rates:
            rates.append({
                "id": rate.id,
                "carrier": rate.carrier,
                "service": rate.service,
                "rate": float(rate.rate),
                "list_rate": float(rate.list_rate) if rate.list_rate else None,
                "retail_rate": float(rate.retail_rate) if rate.retail_rate else None,
                "currency": rate.currency,
                "delivery_days": rate.delivery_days,
                "delivery_estimate": f"{rate.delivery_days} business days" if rate.delivery_days else "Varies"
            })
        
        # Sort by price
        rates.sort(key=lambda x: x["rate"])
        
        return {
            "rates": rates,
            "shipment_id": shipment.id,
            "fallback": False
        }
        
    except Exception as e:
        # Fallback to regional rates on error
        if dest_country:
            region = dest_country["region"]
            regional_rate = REGIONAL_RATES.get(region, REGIONAL_RATES["North America"])
            weight_kg = request.parcel.weight / 35.274
            estimated_cost = regional_rate["base"] + (weight_kg * regional_rate["per_kg"])
            
            return {
                "rates": [
                    {
                        "id": "standard_shipping",
                        "carrier": "AfroVending Shipping",
                        "service": "Standard International",
                        "rate": round(estimated_cost, 2),
                        "currency": "USD",
                        "delivery_days": regional_rate["delivery_days"],
                        "delivery_estimate": regional_rate["delivery_days"] + " business days"
                    }
                ],
                "shipment_id": None,
                "fallback": True,
                "error": str(e)
            }
        raise HTTPException(status_code=400, detail=f"Failed to get rates: {str(e)}")


@router.post("/purchase")
async def purchase_shipment(
    request: ShipmentRequest,
    user: dict = Depends(get_current_user)
):
    """
    Purchase a shipping label using selected rate.
    Returns tracking number and label URL.
    """
    ep_client = get_easypost_client()
    db = get_db()
    
    if not ep_client:
        # Mock response for fallback
        import uuid
        tracking_number = f"AV{uuid.uuid4().hex[:12].upper()}"
        
        return {
            "success": True,
            "tracking_number": tracking_number,
            "label_url": None,
            "carrier": "AfroVending Shipping",
            "service": "Standard International",
            "rate": 25.00,
            "note": "EasyPost not configured - mock label generated"
        }
    
    try:
        # Buy the shipment with selected rate
        shipment = ep_client.shipment.buy(
            request.rate_id.split("_")[0] if "_" in request.rate_id else request.rate_id,
            rate={"id": request.rate_id}
        )
        
        # Store shipment info in database
        shipment_record = {
            "id": shipment.id,
            "tracking_number": shipment.tracking_code,
            "label_url": shipment.postage_label.label_url if shipment.postage_label else None,
            "carrier": shipment.selected_rate.carrier,
            "service": shipment.selected_rate.service,
            "rate": float(shipment.selected_rate.rate),
            "order_id": request.order_id,
            "user_id": user["id"],
            "status": "purchased",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.shipments.insert_one(shipment_record)
        
        # Update order with tracking info if order_id provided
        if request.order_id:
            await db.orders.update_one(
                {"id": request.order_id},
                {
                    "$set": {
                        "tracking_number": shipment.tracking_code,
                        "shipping_carrier": shipment.selected_rate.carrier,
                        "shipping_label_url": shipment.postage_label.label_url if shipment.postage_label else None
                    }
                }
            )
        
        return {
            "success": True,
            "shipment_id": shipment.id,
            "tracking_number": shipment.tracking_code,
            "label_url": shipment.postage_label.label_url if shipment.postage_label else None,
            "carrier": shipment.selected_rate.carrier,
            "service": shipment.selected_rate.service,
            "rate": float(shipment.selected_rate.rate)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to purchase shipment: {str(e)}")


@router.get("/track/{tracking_number}")
async def track_shipment(tracking_number: str, carrier: Optional[str] = None):
    """
    Get tracking information for a shipment.
    """
    ep_client = get_easypost_client()
    db = get_db()
    
    # Check our database first
    shipment = await db.shipments.find_one(
        {"tracking_number": tracking_number},
        {"_id": 0}
    )
    
    if not ep_client:
        if shipment:
            return {
                "tracking_number": tracking_number,
                "carrier": shipment.get("carrier", "Unknown"),
                "status": shipment.get("status", "in_transit"),
                "events": []
            }
        raise HTTPException(status_code=404, detail="Tracking not available")
    
    try:
        tracker = ep_client.tracker.create(
            tracking_code=tracking_number,
            carrier=carrier
        )
        
        return {
            "tracking_number": tracker.tracking_code,
            "carrier": tracker.carrier,
            "status": tracker.status,
            "estimated_delivery": getattr(tracker, "est_delivery_date", None),
            "events": [
                {
                    "status": event.status,
                    "message": event.message,
                    "datetime": event.datetime,
                    "location": {
                        "city": getattr(event, "tracking_location", {}).get("city"),
                        "state": getattr(event, "tracking_location", {}).get("state"),
                        "country": getattr(event, "tracking_location", {}).get("country")
                    } if hasattr(event, "tracking_location") else None
                }
                for event in (tracker.tracking_details or [])
            ]
        }
    except Exception as e:
        if shipment:
            return {
                "tracking_number": tracking_number,
                "carrier": shipment.get("carrier", "Unknown"),
                "status": shipment.get("status", "in_transit"),
                "events": [],
                "error": str(e)
            }
        raise HTTPException(status_code=400, detail=f"Failed to track: {str(e)}")


@router.get("/detect-country")
async def detect_country_by_ip(ip: Optional[str] = None):
    """
    Detect user's country by IP address.
    Uses the existing IP detection logic from the platform.
    """
    import httpx
    
    try:
        # Use ip-api.com for geolocation
        async with httpx.AsyncClient() as client:
            if ip:
                response = await client.get(f"http://ip-api.com/json/{ip}")
            else:
                response = await client.get("http://ip-api.com/json/")
            
            data = response.json()
            
            if data.get("status") == "success":
                country_code = data.get("countryCode", "US")
                
                # Find in our country list
                country = next(
                    (c for c in WORLDWIDE_COUNTRIES if c["code"] == country_code),
                    {"code": "US", "name": "United States", "region": "North America", "flag": "🇺🇸"}
                )
                
                return {
                    "detected_country": country,
                    "city": data.get("city"),
                    "region": data.get("regionName"),
                    "timezone": data.get("timezone")
                }
    except Exception as e:
        pass
    
    # Default to US
    return {
        "detected_country": {"code": "US", "name": "United States", "region": "North America", "flag": "🇺🇸"},
        "note": "Could not detect location, defaulting to US"
    }
