import pytest
from common.utils.exceptions import ValidationError
from common.utils.validators import require_not_empty, require_type
from common.utils.string_utils import to_camel_case, to_snake_case
from common.utils.cache import SimpleCache

def test_validators():
    require_not_empty("test", "field")
    with pytest.raises(ValidationError):
        require_not_empty("", "field")

    require_type(1, int, "field")
    with pytest.raises(ValidationError):
        require_type("1", int, "field")

def test_string_utils():
    assert to_camel_case("hello_world") == "helloWorld"
    assert to_snake_case("helloWorld") == "hello_world"

def test_cache():
    cache = SimpleCache()
    cache.set("key", "value")
    assert cache.get("key") == "value"
    cache.clear()
    assert cache.get("key") is None
