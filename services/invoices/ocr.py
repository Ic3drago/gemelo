import pytesseract
from PIL import Image
import re
import io

def parse_invoice(image_bytes: bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image, lang='spa')
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    
    # Regexes
    nit_match = re.search(r'(?i)NIT.*?(\d+)', text)
    nit = nit_match.group(1) if nit_match else None
    
    factura_match = re.search(r'(?i)Factura\s*(?:N[°o]?\.*|#)?\s*:?\s*(\d+)', text)
    number = factura_match.group(1) if factura_match else None
    
    total_match = re.search(r'(?i)Total.*?(?:Bs\.?|BOB)?\s*(\d+[\.,]\d{2})', text)
    total = total_match.group(1) if total_match else None
    
    date_match = re.search(r'(?i)Fecha.*?:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
    date = date_match.group(1) if date_match else None
    
    # Items
    items = []
    lines = text.split('\n')
    for line in lines:
        # Simple heuristic for items: look for a price at the end
        match = re.search(r'^(.*?)\s+(\d+[\.,]\d{2})$', line.strip())
        if match:
            name = match.group(1).strip()
            price = match.group(2)
            
            # Simple classification
            name_lower = name.lower()
            if any(word in name_lower for word in ['leche', 'pan', 'carne', 'pollo', 'arroz', 'fideo', 'galleta', 'agua', 'jugo']):
                category = 'alimentos'
                perishability = True
            elif any(word in name_lower for word in ['jabon', 'shampoo', 'detergente', 'limpiador', 'escoba']):
                category = 'limpieza'
                perishability = False
            else:
                category = 'otros'
                perishability = False
                
            # Filter out lines that might be total, subtotal, etc.
            if not any(word in name_lower for word in ['total', 'subtotal', 'descuento', 'cambio', 'efectivo', 'tarjeta']):
                # skip empty names
                if name:
                    items.append({
                        "name": name,
                        "price": price,
                        "category": category,
                        "perishability": perishability
                    })
                
    confidence = 'high' if (nit and number and total and date) else ('medium' if (nit or number or total or date) else 'low')
    
    return {
        "success": True,
        "data": {
            "nit": nit,
            "date": date,
            "number": number,
            "total": total,
            "items": items
        },
        "confidence": confidence
    }
