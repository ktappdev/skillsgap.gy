import unittest

from services.ocr.validation import InvalidPageSelection, parse_page_numbers


class PageSelectionTests(unittest.TestCase):
    def test_accepts_order_independent_selection(self) -> None:
        self.assertEqual(parse_page_numbers("3, 1,3"), {1, 3})

    def test_rejects_non_numeric_selection(self) -> None:
        with self.assertRaises(InvalidPageSelection):
            parse_page_numbers("first")

    def test_rejects_pages_outside_processing_limit(self) -> None:
        with self.assertRaises(InvalidPageSelection):
            parse_page_numbers("9")


if __name__ == "__main__":
    unittest.main()
