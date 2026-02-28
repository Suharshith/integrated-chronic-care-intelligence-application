"""
ICCIP - Google Maps Doctor Suggestion Service
Finds nearby specialist doctors based on patient location and risk conditions
"""

import os
from typing import Optional

GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "AIzaSyAfb8oRqyNgqNIkwu5RYkQgdR7KB3HZ7b8")

# Map disease → medical specialty
SPECIALTY_MAP = {
    "heart": {"specialty": "Cardiologist", "query": "cardiologist hospital", "icon": "🫀"},
    "kidney": {"specialty": "Nephrologist", "query": "nephrologist kidney hospital", "icon": "🫘"},
    "stroke": {"specialty": "Neurologist", "query": "neurologist hospital", "icon": "🧠"},
    "diabetes": {"specialty": "Endocrinologist", "query": "endocrinologist diabetes clinic", "icon": "🩸"},
    "brain": {"specialty": "Neurosurgeon", "query": "neurologist neurosurgeon brain hospital", "icon": "🧠"},
    "thyroid": {"specialty": "Endocrinologist", "query": "endocrinologist thyroid clinic", "icon": "🦋"},
}


def find_nearby_doctors(latitude: float, longitude: float, condition: str, radius: int = 10000) -> dict:
    """Find nearby specialist doctors using Google Maps Places API"""
    spec = SPECIALTY_MAP.get(condition.lower(), SPECIALTY_MAP['heart'])

    try:
        import googlemaps
        gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)

        results = gmaps.places_nearby(
            location=(latitude, longitude),
            radius=radius,
            keyword=spec['query'],
            type='hospital'
        )

        doctors = []
        for place in results.get('results', [])[:5]:
            # Get distance
            loc = place.get('geometry', {}).get('location', {})
            doc = {
                "name": place.get('name', 'Unknown'),
                "address": place.get('vicinity', 'Address not available'),
                "rating": place.get('rating', 'N/A'),
                "total_ratings": place.get('user_ratings_total', 0),
                "is_open": place.get('opening_hours', {}).get('open_now', None),
                "latitude": loc.get('lat'),
                "longitude": loc.get('lng'),
                "place_id": place.get('place_id', ''),
                "maps_url": f"https://www.google.com/maps/place/?q=place_id:{place.get('place_id', '')}",
            }
            doctors.append(doc)

        return {
            "condition": condition,
            "specialty": spec['specialty'],
            "icon": spec['icon'],
            "location": {"latitude": latitude, "longitude": longitude},
            "radius_meters": radius,
            "doctors": doctors,
            "total_found": len(doctors),
            "source": "Google Maps Places API"
        }

    except ImportError:
        print("⚠️ googlemaps not installed, using fallback")
        return _fallback_doctors(latitude, longitude, condition)
    except Exception as e:
        print(f"Google Maps error: {e}")
        return _fallback_doctors(latitude, longitude, condition)


def get_doctors_for_all_risks(latitude: float, longitude: float, predictions: dict) -> list:
    """Get doctor suggestions for all high/medium risk conditions"""
    results = []
    for disease, result in predictions.items():
        if isinstance(result, dict) and result.get('risk_level') in ['Medium', 'High']:
            doctors = find_nearby_doctors(latitude, longitude, disease)
            results.append(doctors)
    
    if not results:
        # If all low risk, suggest general physician
        results.append(find_nearby_doctors(latitude, longitude, 'heart'))
    
    return results


def _fallback_doctors(latitude: float, longitude: float, condition: str) -> dict:
    """Fallback response when Google Maps API is unavailable"""
    spec = SPECIALTY_MAP.get(condition.lower(), SPECIALTY_MAP['heart'])
    return {
        "condition": condition,
        "specialty": spec['specialty'],
        "icon": spec['icon'],
        "location": {"latitude": latitude, "longitude": longitude},
        "doctors": [
            {
                "name": f"Search for {spec['specialty']} near you",
                "address": "Use Google Maps to find specialists",
                "rating": "N/A",
                "total_ratings": 0,
                "is_open": None,
                "maps_url": f"https://www.google.com/maps/search/{spec['query']}/@{latitude},{longitude},14z",
            }
        ],
        "total_found": 0,
        "source": "Fallback - API key not configured",
        "search_url": f"https://www.google.com/maps/search/{spec['query']}/@{latitude},{longitude},14z"
    }
