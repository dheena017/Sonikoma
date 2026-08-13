import pytest
from app.services.image.scraper.scraper import parse_episodes_from_soup, extract_max_page_from_soup

def test_parse_episodes_from_soup_none():
    result = parse_episodes_from_soup(None, "https://example.com")
    assert result == []

def test_extract_max_page_from_soup_none():
    result = extract_max_page_from_soup(None)
    assert result == 1

def test_parse_with_bs4_ignores_creator_notes_and_avatars():
    from services.image.scraper.parsers import parse_with_bs4
    sample_html = """
    <html>
      <body>
        <div class="creator_note">
          <img src="https://example.com/creator_avatar.jpg" />
        </div>
        <div id="_imageList">
          <img src="https://example.com/panel_1.jpg" />
          <img src="https://example.com/panel_2.jpg" />
        </div>
        <div class="author_area">
          <img src="https://example.com/author_profile.jpg" />
        </div>
      </body>
    </html>
    """
    images = parse_with_bs4(sample_html, "https://example.com/comic/viewer")
    assert "https://example.com/panel_1.jpg" in images
    assert "https://example.com/panel_2.jpg" in images
    assert "https://example.com/creator_avatar.jpg" not in images
    assert "https://example.com/author_profile.jpg" not in images

