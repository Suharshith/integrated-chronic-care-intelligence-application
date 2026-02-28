"""
ICCIP - Gemini AI Service
Provides AI-powered medical explanations, diet plans, and chatbot functionality
Uses google.genai (new SDK)
"""

import os
import json
from typing import Optional

# API Key
GEMINI_API_KEY = "AIzaSyANhU_PfAIUKq8jftASkkw-0-5isBzwwko"

_client = None

def _get_client():
    global _client
    if _client is None:
        try:
            from google import genai
            _client = genai.Client(api_key=GEMINI_API_KEY)
            print("✅ Gemini AI client initialized (google.genai)")
        except Exception as e:
            print(f"⚠️ Gemini init error: {e}")
            _client = None
    return _client


from typing import Optional, Any

def _generate(contents: Any) -> str:
    """Call Gemini with retry on different models"""
    client = _get_client()
    if not client:
        return ""

    models = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"]
    for model_name in models:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents
            )
            return response.text
        except Exception as e:
            err = str(e)
            if "quota" in err.lower() or "429" in err or "rate" in err.lower():
                print(f"⚠️ {model_name} quota hit, trying next model...")
                continue
            else:
                print(f"Gemini error ({model_name}): {e}")
                return ""
    print("⚠️ All Gemini models quota exhausted, using fallback")
    return ""


def generate_risk_explanation(predictions: dict, patient_name: str = "Patient") -> str:
    """Generate AI explanation of risk assessment results"""
    prompt = f"""You are a caring, professional medical AI assistant for ICCIP (Integrated Chronic Care Intelligence Platform).

A patient named {patient_name} has received the following health risk assessment:

{json.dumps(predictions, indent=2)}

Please provide:
1. A clear, simple explanation of each risk result (2-3 sentences each)
2. Which conditions need urgent attention (if any risk > 60%)
3. General lifestyle advice based on the combined results
4. Emotional reassurance — be supportive, not alarming
5. A strong recommendation to consult doctors for high-risk conditions

IMPORTANT:
- Use simple, non-medical language
- Never claim to diagnose — say "the model suggests" or "indicators show"
- Be professional but warm
- Keep the total response under 500 words
- Use emojis sparingly for readability"""

    result = _generate(prompt)
    return result if result else _fallback_explanation(predictions)


def generate_diet_plan(predictions: dict, patient_info: dict = None) -> dict:
    """Generate personalized weekly diet plan based on risk factors"""
    risk_conditions = []
    for disease, result in predictions.items():
        if isinstance(result, dict) and result.get('risk_level') in ['Medium', 'High']:
            risk_conditions.append(f"{disease}: {result.get('risk_level')} risk ({result.get('risk_percentage', 0)}%)")

    age = patient_info.get('age', 40) if patient_info else 40
    gender = patient_info.get('sex', 'Not specified') if patient_info else 'Not specified'

    prompt = f"""You are a clinical nutritionist AI for ICCIP healthcare platform.

Patient Profile:
- Age: {age}
- Gender: {gender}
- Health Risks: {', '.join(risk_conditions) if risk_conditions else 'All low risk'}

Diet Personalization Rules:
- Heart High Risk → DASH diet (low sodium, high potassium)
- Diabetes High Risk → Low glycemic index, high fiber
- Kidney High Risk → Low potassium, controlled protein, low sodium
- Brain Tumor detected → Anti-inflammatory diet (omega-3, berries, leaves)
- Hyperthyroid → Control iodine intake
- Hypothyroid → Selenium and zinc rich foods
- Multiple risks → Combine diets safely

Generate a structured 7-day diet plan in this EXACT JSON format:
{{
    "diet_type": "name of diet approach",
    "daily_calories": "estimated range",
    "avoid_foods": ["list of foods to avoid"],
    "weekly_plan": {{
        "Monday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..."}},
        "Tuesday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..."}},
        "Wednesday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..."}},
        "Thursday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..."}},
        "Friday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..."}},
        "Saturday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..."}},
        "Sunday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..."}}
    }},
    "tips": ["general nutrition tips"]
}}

Return ONLY valid JSON. No markdown, no extra text."""

    result = _generate(prompt)
    if result:
        try:
            text = result.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            return json.loads(text)
        except Exception as e:
            print(f"Diet plan JSON parse error: {e}")

    return _fallback_diet_plan(predictions)


def chat_with_ai(message: str, patient_context: dict = None, image_base64: str = None) -> str:
    """Interactive AI health chatbot"""
    context = ""
    if patient_context:
        context = f"\nPatient context: {json.dumps(patient_context, indent=2)}\n"

    prompt = f"""You are ICCIP's AI health assistant — a caring, knowledgeable medical chatbot.

Rules:
- NEVER diagnose. Say "indicators suggest" or "you may want to ask your doctor about"
- Be warm, professional, and supportive
- Give actionable health advice
- If asked about emergencies, always say "Call emergency services immediately"
- Keep responses concise (under 200 words)
- Use simple language anyone can understand
{context}
User message: {message}

Respond helpfully:"""

    contents = [prompt]
    
    if image_base64:
        try:
            mime = "image/jpeg"
            data = image_base64
            if "," in image_base64:
                mime, data = image_base64.split(",", 1)
                mime = mime.split(":")[1].split(";")[0]
            
            import base64
            from google.genai import types
            image_bytes = base64.b64decode(data)
            contents.insert(0, types.Part.from_bytes(data=image_bytes, mime_type=mime))
        except Exception as e:
            print("Failed to process image:", e)

    result = _generate(contents)
    if result:
        return result
    return "I'm sorry, the AI assistant is currently unavailable. Please try again later or consult a healthcare professional."


def _fallback_explanation(predictions: dict) -> str:
    lines = ["## Health Risk Assessment Summary\n"]
    for disease, result in predictions.items():
        if isinstance(result, dict) and 'risk_level' in result:
            emoji = "🟢" if result['risk_level'] == 'Low' else "🟡" if result['risk_level'] == 'Medium' else "🔴"
            lines.append(f"{emoji} **{disease.title()}**: {result.get('risk_percentage', 0)}% risk ({result['risk_level']})")
    lines.append("\n💡 Please consult with a healthcare professional for a complete medical evaluation.")
    return "\n".join(lines)


def _fallback_diet_plan(predictions: dict) -> dict:
    return {
        "diet_type": "Balanced Heart-Healthy Diet",
        "daily_calories": "1800-2200",
        "avoid_foods": ["Excessive salt", "Processed foods", "Sugary drinks", "Trans fats", "Excessive alcohol"],
        "weekly_plan": {
            day: {
                "breakfast": "Oatmeal with fresh berries and nuts",
                "lunch": "Grilled chicken salad with olive oil dressing",
                "dinner": "Baked fish with steamed vegetables and brown rice",
                "snacks": "Greek yogurt, mixed nuts, fresh fruits"
            } for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        },
        "tips": [
            "Drink at least 8 glasses of water daily",
            "Eat 5 servings of fruits and vegetables daily",
            "Limit sodium to less than 2000mg per day",
            "Choose whole grains over refined grains",
            "Include omega-3 fatty acids from fish or flaxseed"
        ]
    }
