import io
import re

import fitz
import pytesseract
from PIL import Image, ImageOps
from pytesseract import Output


def _normalize_number(value):
    if value is None:
        return None
    cleaned = re.sub(r'[^\d.,+-]', '', str(value).strip().replace(' ', ''))
    if not re.search(r'\d', cleaned):
        return None

    sign = '-' if cleaned.startswith('-') else ''
    cleaned = cleaned.lstrip('+-')
    separators = [separator for separator in '.,' if separator in cleaned]
    if not separators:
        return sign + cleaned

    decimal_separator = max(separators, key=cleaned.rfind)
    decimal_digits = len(cleaned) - cleaned.rfind(decimal_separator) - 1
    if decimal_digits in (1, 2):
        integer = re.sub(r'[.,]', '', cleaned[:cleaned.rfind(decimal_separator)])
        fraction = cleaned[cleaned.rfind(decimal_separator) + 1:]
        return f'{sign}{integer}.{fraction}'

    if decimal_digits == 3 and len(cleaned[:cleaned.rfind(decimal_separator)]) <= 3:
        return sign + re.sub(r'[.,]', '', cleaned)

    return sign + re.sub(r'[.,]', '', cleaned)


def _as_float(value):
    try:
        return float(str(value).replace(',', '.'))
    except (TypeError, ValueError):
        return None


def _word_lines(words):
    ordered = sorted(words, key=lambda word: (int(word.get('top', 0)), int(word.get('left', 0))))
    lines = []
    for word in ordered:
        top = int(word.get('top', 0))
        height = max(1, int(word.get('height', 1)))
        if not lines or abs(top - lines[-1]['top']) > max(4, height // 2):
            lines.append({'top': top, 'words': [word]})
        else:
            lines[-1]['words'].append(word)
    return [line['words'] for line in lines]


def _amount_on_labeled_line(words, label_pattern, exclude_pattern=None):
    amount_pattern = re.compile(r'(?<![\w/])\d[\d.,]*(?![\w/])')
    for line_words in _word_lines(words):
        line = ' '.join(str(word.get('text', '')) for word in line_words)
        label = re.search(label_pattern, line, re.IGNORECASE)
        if not label or (exclude_pattern and re.search(exclude_pattern, line, re.IGNORECASE)):
            continue
        amounts = amount_pattern.findall(line[label.end():])
        for amount in reversed(amounts):
            normalized = _normalize_number(amount)
            if normalized and _as_float(normalized) is not None:
                label_word = next((word for word in line_words if label.group(0).lower() in str(word.get('text', '')).lower()), line_words[0])
                return normalized, label_word.get('conf')
    return None, None


def _infer_total_from_components(words, proposed_total):
    total_value = _as_float(proposed_total)

    base, _ = _amount_on_labeled_line(words, r'\bBASE\b')
    gift, _ = _amount_on_labeled_line(words, r'\bGI?F?T\s*CARD?S?\b')
    base_amount = _as_float(base)
    gift_amount = _as_float(gift)

    if base_amount is not None and gift_amount is not None:
        expected_total = base_amount + gift_amount
        if total_value is None:
            return expected_total
        if total_value <= gift_amount and expected_total > total_value:
            return expected_total
        if abs(expected_total - total_value) <= max(50.0, abs(expected_total) * 0.3):
            return expected_total

    if total_value is not None:
        return total_value

    return None


def _infer_category(words):
    text = ' '.join(str(word.get('text', '')) for word in words).lower()
    categories = {
        'alimentos': ['alimentos', 'supermercado', 'mercado', 'pan', 'panaderia', 'fruta', 'verdura', 'leche', 'queso', 'pollo', 'carne', 'arroz', 'fideo', 'carnes', 'super'],
        'servicios': ['servicios', 'internet', 'agua', 'luz', 'gas', 'telefono', 'telefonia', 'energia', 'tv', 'streaming', 'suministro'],
        'transporte': ['transporte', 'bus', 'taxi', 'uber', 'gasolina', 'combustible', 'metro', 'aeropuerto', 'pasaje', 'tramo'],
        'ocio': ['ocio', 'cine', 'restaurante', 'bar', 'pizza', 'caf', 'pelicula', 'juego', 'entretencion', 'club'],
        'hogar': ['hogar', 'casa', 'mantenimiento', 'lavadora', 'microondas', 'electrodomestico', 'limpieza', 'tienda', 'decoracion'],
    }

    scores = {name: 0 for name in categories}
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in text:
                scores[category] += 1

    best_category = 'hogar'
    best_score = 0
    for category, score in scores.items():
        if score > best_score:
            best_category = category
            best_score = score

    return best_category


def _looks_like_label(token):
    return bool(re.search(r'(?i)(nit|fecha|factura|total|monto|importe|folio|codigo|numero|nro)', token))


def _preprocess_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    image = ImageOps.grayscale(image)
    image = ImageOps.autocontrast(image)
    image = image.resize((image.width * 2, image.height * 2))
    return image.point(lambda p: 255 if p > 180 else 0)


def _ocr_word_grid(image):
    data = pytesseract.image_to_data(
        image,
        lang='spa',
        config='--psm 6',
        output_type=Output.DICT,
    )

    words = []
    for idx, word in enumerate(data.get('text', [])):
        token = (word or '').strip()
        if not token:
            continue
        conf = data.get('conf', [0])[idx]
        try:
            conf_value = int(float(conf))
        except (TypeError, ValueError):
            conf_value = 0
        words.append({
            'text': token,
            'conf': conf_value,
            'left': int(data.get('left', [0])[idx]),
            'top': int(data.get('top', [0])[idx]),
            'width': int(data.get('width', [0])[idx]),
            'height': int(data.get('height', [0])[idx]),
        })
    return words


def _extract_field_from_words(words, label_patterns, capture_count=8, allow_decimal=True):
    for idx, word in enumerate(words):
        token = word['text'].upper()
        if not any(pattern in token for pattern in label_patterns):
            continue

        candidate_tokens = []
        for next_word in words[idx + 1:idx + capture_count + 1]:
            value = next_word['text']
            if re.search(r'(?i)(\d+[\.,]\d{2,}|\d{4,}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', value):
                candidate_tokens.append(value)
                if len(candidate_tokens) >= 2:
                    break

        if not candidate_tokens:
            continue

        for candidate in candidate_tokens:
            if allow_decimal:
                normalized = _normalize_number(candidate)
            else:
                normalized = re.sub(r'\D', '', candidate)
            if normalized:
                return normalized, word['conf']

    return None, None


def _extract_store(words):
    low_conf = []
    for item in words:
        token = item['text']
        if len(token) < 3 or _looks_like_label(token):
            continue
        if any(ch.isdigit() for ch in token):
            continue
        low_conf.append((token, item['conf'], item['top']))
    if not low_conf:
        return '', 0
    chosen = sorted(low_conf, key=lambda x: (x[2], -x[1]))[0]
    return chosen[0], chosen[1]


def _extract_items(words):
    items = []
    for idx, word in enumerate(words):
        token = word['text']
        if not re.search(r'\d', token):
            continue
        if any(label in token.upper() for label in ['TOTAL', 'SUBTOTAL', 'NIT', 'FACTURA', 'FECHA', 'CODIGO', 'MONTO']):
            continue
        if not token or len(token) < 2:
            continue
        # heuristic: item names are usually plain text before a price-like token
        prev_tokens = [words[j]['text'] for j in range(max(0, idx - 4), idx)]
        if prev_tokens and any(part.isalpha() for part in prev_tokens):
            name = ' '.join(prev_tokens[-3:])
            price = token
            if re.search(r'\d+[\.,]\d{2,}', price):
                items.append({
                    'name': name.strip(),
                    'price': _normalize_number(price),
                    'category': 'alimentos' if any(word in name.lower() for word in ['leche', 'pan', 'carne', 'pollo', 'arroz', 'fideo', 'galleta', 'agua', 'jugo', 'papa', 'tomate', 'queso', 'huevo']) else 'hogar',
                    'perishability': any(word in name.lower() for word in ['leche', 'pan', 'carne', 'pollo', 'papa', 'tomate', 'queso']),
                    'estimatedExpiryDays': 5 if any(word in name.lower() for word in ['leche', 'pan', 'carne', 'pollo', 'papa', 'tomate', 'queso']) else None,
                })
    return items[:10]


def _extract_from_words(words):
    total, total_conf = _amount_on_labeled_line(
        words,
        r'\b(?:TOTAL(?:\s+(?:BS|BOB|A\s+PAGAR))?|IMPORTE\s+TOTAL|MONTO\s+TOTAL)\b',
        r'\bSUB\s*TOTAL\b',
    )
    if not total:
        total, total_conf = _extract_field_from_words(words, ['TOTAL', 'MONTO TOTAL', 'IMPORTE TOTAL', 'TOTAL A PAGAR'], capture_count=6)
    nit, nit_conf = _extract_field_from_words(words, ['NIT'], capture_count=4, allow_decimal=False)
    number, number_conf = _extract_field_from_words(words, ['FACTURA', 'NRO', 'N°', 'NUMERO', 'FOLIO'], capture_count=4, allow_decimal=False)
    date, date_conf = _extract_field_from_words(words, ['FECHA', 'FEC', 'EMISION'], capture_count=3)
    store, store_conf = _extract_store(words)

    candidate_total = total if total and _as_float(total) is not None and _as_float(total) > 0 else ''
    if candidate_total:
        candidate_total = str(_infer_total_from_components(words, candidate_total))
    candidate_nit = nit if nit else ''
    candidate_number = number if number and len(str(number)) >= 3 else ''
    candidate_date = date if date else ''

    conf_values = [v for v in [total_conf, nit_conf, number_conf, date_conf, store_conf] if v is not None]
    confidence = 'high' if (candidate_total and candidate_number and candidate_date and candidate_nit) else ('medium' if conf_values else 'low')

    return {
        'store': store,
        'nit': candidate_nit,
        'date': candidate_date,
        'number': candidate_number,
        'total': candidate_total,
        'items': _extract_items(words),
        'category': _infer_category(words),
        'confidence': confidence,
    }


def _extract_from_text(text):
    text = (text or '').replace('\x00', ' ')
    nit_match = re.search(r'(?i)\bNIT\b.*?(\d{5,})', text)
    nit = nit_match.group(1) if nit_match else ''

    factura_match = re.search(r'(?i)Factura\s*(?:N[°o]?\.*|#)?\s*:?\s*(\d+)', text)
    number = factura_match.group(1) if factura_match else ''

    date_match = re.search(r'(?i)Fecha.*?:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
    date = date_match.group(1) if date_match else ''

    words = []
    for line_number, line in enumerate(text.splitlines()):
        for token_number, token in enumerate(re.split(r'\s+', line.strip())):
            if token:
                words.append({'text': token, 'conf': 80, 'top': line_number * 20, 'left': token_number * 10, 'height': 10})

    extracted = _extract_from_words(words)
    total, _ = _amount_on_labeled_line(
        words,
        r'\b(?:TOTAL(?:\s+(?:BS|BOB|A\s+PAGAR))?|IMPORTE\s+TOTAL|MONTO\s+TOTAL)\b',
        r'\bSUB\s*TOTAL\b',
    )
    return {
        'store': extracted['store'] or next((line.strip() for line in text.splitlines() if line.strip() and not re.search(r'(?i)(total|subtotal|nit|factura|fecha)', line)), ''),
        'nit': nit or extracted['nit'],
        'date': date or extracted['date'],
        'number': number or extracted['number'],
        'total': total or extracted['total'],
        'items': extracted['items'],
        'category': extracted['category'] or 'hogar',
        'confidence': 'high' if (nit and number and total and date) else ('medium' if any([nit, number, total, date]) else 'low'),
    }


def _ocr_image(image_bytes):
    image = _preprocess_image(image_bytes)
    words = _ocr_word_grid(image)
    extracted = _extract_from_words(words)
    return extracted


def _ocr_pdf(pdf_bytes):
    pages = []
    try:
        doc = fitz.open(stream=pdf_bytes, filetype='pdf')
    except Exception:
        return {'store': '', 'nit': '', 'date': '', 'number': '', 'total': '', 'items': [], 'category': 'hogar', 'confidence': 'low'}

    for page in doc:
        page_text = page.get_text('text')
        if page_text and page_text.strip():
            pages.append(_extract_from_text(page_text))
            continue

        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        image = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
        extracted = _ocr_image(image.tobytes())
        pages.append(extracted)

    doc.close()

    merged = {'store': '', 'nit': '', 'date': '', 'number': '', 'total': '', 'items': [], 'category': 'hogar', 'confidence': 'low'}
    for page_result in pages:
        for key in ['store', 'nit', 'date', 'number', 'total']:
            if not merged.get(key) and page_result.get(key):
                merged[key] = page_result.get(key)
        if not merged['items'] and page_result.get('items'):
            merged['items'] = page_result.get('items')
        if page_result.get('confidence') == 'medium' or page_result.get('confidence') == 'high':
            merged['confidence'] = page_result['confidence']
    return merged


def parse_invoice(file_bytes: bytes):
    if not file_bytes:
        return {
            'success': True,
            'requiresConfirmation': True,
            'confidence': 'low',
            'data': {
                'store': '',
                'nit': '',
                'date': '',
                'number': '',
                'total': '',
                'items': [],
                'category': 'hogar',
            },
            'message': 'No se recibió ninguna imagen ni PDF.',
        }

    try:
        file_header = file_bytes[:8].lower()
        if b'%pdf' in file_header or file_bytes.lstrip().startswith(b'%PDF'):
            extracted = _ocr_pdf(file_bytes)
        else:
            extracted = _ocr_image(file_bytes)
    except Exception as exc:
        return {
            'success': True,
            'requiresConfirmation': True,
            'confidence': 'low',
            'error': str(exc),
            'data': {
                'store': '',
                'nit': '',
                'date': '',
                'number': '',
                'total': '',
                'items': [],
                'category': 'hogar',
            },
            'message': 'No se pudo extraer información fiable. Revisa y corrige manualmente antes de guardar.',
        }

    # final validation: avoid wrong autofill when the OCR is not reliable
    has_total = bool(extracted.get('total')) and _as_float(extracted.get('total')) is not None and _as_float(extracted.get('total')) > 0
    confidence = extracted.get('confidence', 'low')
    if not has_total or confidence == 'low':
        confidence = 'low'

    return {
        'success': True,
        'requiresConfirmation': True,
        'confidence': confidence,
        'data': {
            'store': extracted.get('store') or '',
            'nit': extracted.get('nit') or '',
            'date': extracted.get('date') or '',
            'number': extracted.get('number') or '',
            'total': extracted.get('total') or '',
            'items': extracted.get('items') or [],
            'category': extracted.get('category') or 'hogar',
        },
        'message': 'OCR completado. Revisa y corrige antes de guardar.' if confidence != 'low' else 'No se pudo leer la factura con confianza. Revisa y completa manualmente.',
    }
