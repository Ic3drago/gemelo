import io
import os
import sys
import unittest

from PIL import Image, ImageDraw
import fitz

sys.path.insert(0, os.path.dirname(__file__))
from ocr import _infer_total_from_components, _normalize_number, parse_invoice


class ParseInvoiceTests(unittest.TestCase):
    def test_empty_payload_keeps_manual_review_mode(self):
        result = parse_invoice(b'')
        self.assertTrue(result['success'])
        self.assertTrue(result['requiresConfirmation'])
        self.assertEqual(result['data']['total'], '')
        self.assertEqual(result['confidence'], 'low')

    def test_image_with_total_is_tolerant(self):
        image = Image.new('RGB', (800, 500), 'white')
        draw = ImageDraw.Draw(image)
        draw.text((40, 60), 'Factura', fill='black')
        draw.text((40, 120), 'Total Bs 123.45', fill='black')
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')

        result = parse_invoice(buffer.getvalue())
        self.assertTrue(result['success'])
        self.assertTrue(result['requiresConfirmation'])
        self.assertIn(result['confidence'], {'low', 'medium', 'high'})

    def test_total_uses_gift_card_plus_base_amount(self):
        words = [
            {'text': 'MONTO', 'conf': 90, 'top': 10}, {'text': 'GIFT', 'conf': 90, 'top': 10}, {'text': 'CARDS', 'conf': 90, 'top': 10}, {'text': '2000', 'conf': 90, 'top': 10},
            {'text': 'IMPORTE', 'conf': 90, 'top': 20}, {'text': 'BASE', 'conf': 90, 'top': 20}, {'text': 'CREDITO', 'conf': 90, 'top': 20}, {'text': 'FISCAL', 'conf': 90, 'top': 20}, {'text': '500', 'conf': 90, 'top': 20},
            {'text': 'TOTAL', 'conf': 90, 'top': 30}, {'text': 'BS', 'conf': 90, 'top': 30}, {'text': '2500', 'conf': 90, 'top': 30},
        ]

        self.assertEqual(_infer_total_from_components(words, 2000), 2500.0)

    def test_currency_normalization_preserves_decimal_amounts(self):
        self.assertEqual(_normalize_number('2500.00'), '2500.00')
        self.assertEqual(_normalize_number('2.500,00'), '2500.00')
        self.assertEqual(_normalize_number('2,500.00'), '2500.00')

    def test_text_pdf_extracts_invoice_fields_and_total(self):
        document = fitz.open()
        page = document.new_page()
        page.insert_text((40, 50), 'PRUEBA CASA MATRIZ')
        page.insert_text((40, 80), 'NIT 456489012')
        page.insert_text((40, 110), 'FACTURA N 100')
        page.insert_text((40, 140), 'Lugar y Fecha: La Paz, 22/07/2021 11:00 AM')
        page.insert_text((40, 220), 'TOTAL BS 2500.00')
        page.insert_text((40, 250), 'MONTO GIFT CARD BS 2000.00')
        page.insert_text((40, 280), 'IMPORTE BASE CREDITO FISCAL 500.00')
        pdf_bytes = document.tobytes()
        document.close()

        result = parse_invoice(pdf_bytes)

        self.assertEqual(result['data']['total'], '2500.00')
        self.assertEqual(result['data']['nit'], '456489012')
        self.assertEqual(result['data']['number'], '100')


if __name__ == '__main__':
    unittest.main()
