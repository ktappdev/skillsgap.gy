MAX_PDF_PAGES = 8


class InvalidPageSelection(ValueError):
    pass


def parse_page_numbers(value: str) -> set[int]:
    if not value.strip():
        return set()
    try:
        page_numbers = {int(item.strip()) for item in value.split(",")}
    except ValueError as error:
        raise InvalidPageSelection("Invalid page selection") from error
    if any(page < 1 or page > MAX_PDF_PAGES for page in page_numbers):
        raise InvalidPageSelection("Invalid page selection")
    return page_numbers
