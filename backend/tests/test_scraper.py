import pytest
from app.services.scraper.scraper import parse_episodes_from_soup, extract_max_page_from_soup

def test_parse_episodes_from_soup_none():
    result = parse_episodes_from_soup(None, "https://example.com")
    assert result == []

def test_extract_max_page_from_soup_none():
    result = extract_max_page_from_soup(None)
    assert result == 1
