"""
ICCIP - PDF Report Generator
Generates structured medical reports in PDF format
"""

import os
from datetime import datetime
from pathlib import Path


def generate_report(patient_data: dict, predictions: dict, diet_plan: dict = None,
                    doctors: list = None, ai_explanation: str = None) -> str:
    """Generate a comprehensive PDF medical report"""
    try:
        from fpdf import FPDF
    except ImportError:
        print("⚠️ fpdf2 not installed, cannot generate PDF")
        return ""

    patient_id = patient_data.get('patient_id', 'UNKNOWN')
    patient_dir = Path(__file__).parent / "data" / "patients" / patient_id
    patient_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = str(patient_dir / "report.pdf")

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)

    # --- Page 1: Header & Risk Summary ---
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 24)
    pdf.set_text_color(41, 98, 255)
    pdf.cell(0, 15, "ICCIP Health Assessment Report", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, "Integrated Chronic Care Intelligence Platform", ln=True, align="C")
    pdf.cell(0, 6, f"Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", ln=True, align="C")
    pdf.ln(10)

    # Patient Info Box
    pdf.set_fill_color(240, 245, 255)
    pdf.set_draw_color(41, 98, 255)
    pdf.rect(10, pdf.get_y(), 190, 30, "FD")
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(30, 30, 30)
    y = pdf.get_y() + 5
    pdf.set_xy(15, y)
    pdf.cell(90, 7, f"Patient ID: {patient_id}", ln=False)
    pdf.cell(90, 7, f"Name: {patient_data.get('name', 'N/A')}", ln=True)
    pdf.set_x(15)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(60, 7, f"Age: {patient_data.get('age', 'N/A')}", ln=False)
    pdf.cell(60, 7, f"Gender: {patient_data.get('sex', patient_data.get('gender', 'N/A'))}", ln=False)
    pdf.cell(60, 7, f"Phone: {patient_data.get('phone', 'N/A')}", ln=True)
    pdf.ln(15)

    # Risk Summary Table
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 10, "Disease Risk Assessment", ln=True)
    pdf.ln(3)

    # Table header
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(41, 98, 255)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(50, 8, "Disease", 1, 0, "C", True)
    pdf.cell(35, 8, "Risk Score", 1, 0, "C", True)
    pdf.cell(35, 8, "Risk Level", 1, 0, "C", True)
    pdf.cell(35, 8, "Confidence", 1, 0, "C", True)
    pdf.cell(35, 8, "Model", 1, 1, "C", True)

    # Table rows
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(30, 30, 30)
    row_fill = False
    for disease, result in predictions.items():
        if isinstance(result, dict) and 'risk_percentage' in result:
            if row_fill:
                pdf.set_fill_color(245, 247, 255)
            else:
                pdf.set_fill_color(255, 255, 255)

            risk_level = result.get('risk_level', 'N/A')
            pdf.cell(50, 7, disease.title(), 1, 0, "L", True)
            pdf.cell(35, 7, f"{result.get('risk_percentage', 0)}%", 1, 0, "C", True)

            # Color-code risk level
            if risk_level == 'High':
                pdf.set_text_color(220, 38, 38)
            elif risk_level == 'Medium':
                pdf.set_text_color(234, 88, 12)
            else:
                pdf.set_text_color(22, 163, 74)

            pdf.cell(35, 7, risk_level, 1, 0, "C", True)
            pdf.set_text_color(30, 30, 30)
            pdf.cell(35, 7, f"{result.get('confidence', 0) * 100:.1f}%", 1, 0, "C", True)
            model_name = result.get('model_used', 'N/A')
            if len(model_name) > 20:
                model_name = model_name[:18] + ".."
            pdf.cell(35, 7, model_name, 1, 1, "C", True)
            row_fill = not row_fill

    pdf.ln(8)

    # Overall risk
    overall_risk = 0
    count = 0
    highest_disease = ""
    highest_risk = 0
    for disease, result in predictions.items():
        if isinstance(result, dict) and 'risk_score' in result:
            overall_risk += result['risk_score']
            count += 1
            if result['risk_score'] > highest_risk:
                highest_risk = result['risk_score']
                highest_disease = disease

    overall_pct = (overall_risk / count * 100) if count > 0 else 0
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, f"Overall Health Risk Score: {overall_pct:.1f}%", ln=True)
    if highest_disease:
        pdf.set_font("Helvetica", "I", 11)
        pdf.cell(0, 7, f"Highest Risk: {highest_disease.title()} ({highest_risk * 100:.1f}%)", ln=True)

    # --- Page 2: AI Explanation ---
    if ai_explanation:
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 16)
        pdf.set_text_color(41, 98, 255)
        pdf.cell(0, 10, "AI Health Explanation", ln=True)
        pdf.ln(5)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(50, 50, 50)
        # Clean markdown
        clean_text = ai_explanation.replace("**", "").replace("##", "").replace("*", "")
        pdf.multi_cell(0, 5, clean_text)

    # --- Page 3: Diet Plan ---
    if diet_plan and isinstance(diet_plan, dict):
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 16)
        pdf.set_text_color(41, 98, 255)
        pdf.cell(0, 10, "Personalized Diet Plan", ln=True)
        pdf.ln(3)

        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(30, 30, 30)
        pdf.cell(0, 7, f"Diet Type: {diet_plan.get('diet_type', 'Balanced')}", ln=True)
        pdf.cell(0, 7, f"Target Calories: {diet_plan.get('daily_calories', '1800-2200')}", ln=True)
        pdf.ln(3)

        if 'avoid_foods' in diet_plan:
            pdf.set_font("Helvetica", "B", 10)
            pdf.cell(0, 7, "Foods to Avoid:", ln=True)
            pdf.set_font("Helvetica", "", 9)
            pdf.cell(0, 6, ", ".join(diet_plan['avoid_foods'][:10]), ln=True)
            pdf.ln(3)

        weekly = diet_plan.get('weekly_plan', {})
        for day, meals in list(weekly.items())[:7]:
            if pdf.get_y() > 250:
                pdf.add_page()
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_fill_color(230, 240, 255)
            pdf.cell(0, 7, day, 1, 1, "L", True)
            pdf.set_font("Helvetica", "", 9)
            if isinstance(meals, dict):
                for meal_type, meal in meals.items():
                    pdf.cell(30, 6, f"  {meal_type.title()}:", 0, 0)
                    meal_text = str(meal)[:100]
                    pdf.cell(0, 6, meal_text, 0, 1)
            pdf.ln(2)

    # --- Page 4: Doctor Recommendations ---
    if doctors:
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 16)
        pdf.set_text_color(41, 98, 255)
        pdf.cell(0, 10, "Recommended Specialists", ln=True)
        pdf.ln(5)

        for group in doctors:
            if isinstance(group, dict):
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(30, 30, 30)
                pdf.cell(0, 8, f"{group.get('icon', '')} {group.get('specialty', 'Specialist')} ({group.get('condition', '').title()})", ln=True)
                for doc in group.get('doctors', [])[:3]:
                    pdf.set_font("Helvetica", "", 10)
                    pdf.cell(0, 6, f"  - {doc.get('name', 'N/A')}", ln=True)
                    pdf.set_font("Helvetica", "", 9)
                    pdf.set_text_color(100, 100, 100)
                    pdf.cell(0, 5, f"    {doc.get('address', '')}", ln=True)
                    rating = doc.get('rating', 'N/A')
                    pdf.cell(0, 5, f"    Rating: {rating}", ln=True)
                    pdf.set_text_color(30, 30, 30)
                pdf.ln(4)

    # --- Footer: Emergency Note ---
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(220, 38, 38)
    pdf.cell(0, 10, "Emergency Advisory", ln=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(0, 6, (
        "If you experience any of the following symptoms, seek immediate medical attention:\n\n"
        "- Chest pain or pressure\n"
        "- Difficulty breathing\n"
        "- Sudden weakness or numbness on one side\n"
        "- Sudden severe headache\n"
        "- Blood pressure > 180/120 mmHg\n"
        "- Blood sugar > 300 mg/dL\n"
        "- Loss of consciousness\n\n"
        "Call emergency services (112) immediately."
    ))
    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(0, 6, "This report is generated by ICCIP AI and is NOT a medical diagnosis.", ln=True)
    pdf.cell(0, 6, "Always consult a qualified healthcare professional for medical decisions.", ln=True)
    pdf.cell(0, 6, f"Report ID: {patient_id} | Generated: {datetime.now().isoformat()}", ln=True)

    # Save PDF
    pdf.output(pdf_path)
    print(f"📄 Report saved: {pdf_path}")
    return pdf_path
