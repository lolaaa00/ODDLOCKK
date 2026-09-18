"""
Regression tests for OddLockReferee helper functions.
These test the pure Python helpers that don't require the GenLayer runtime.
Run with: python -m pytest tests/test_contract_helpers.py -v
"""
import sys
import os
import importlib.util

# Load the contract module without the GenLayer runtime
# We mock the genlayer imports first
import types

mock_gl = types.ModuleType("genlayer")
mock_gl.Contract = type("Contract", (), {})
mock_gl.public = types.SimpleNamespace(
    write=types.SimpleNamespace(payable=lambda f: f),
    view=lambda f: f,
)
mock_gl.public.write = lambda f: f
mock_gl.public.write.payable = lambda f: f
mock_gl.public.view = lambda f: f
mock_gl.vm = types.SimpleNamespace(UserError=Exception)
mock_gl.message = types.SimpleNamespace(sender_address="0xtest", value=0)
mock_gl.nondet = types.SimpleNamespace()
mock_gl.eq_principle = types.SimpleNamespace()
mock_gl.evm = types.SimpleNamespace(contract_interface=lambda cls: cls)

sys.modules["genlayer"] = mock_gl

contract_path = os.path.join(os.path.dirname(__file__), "..", "contracts", "OddLockReferee.py")
spec = importlib.util.spec_from_file_location("OddLockReferee", contract_path)
mod = importlib.util.module_from_spec(spec)


# Inject mock builtins that the contract uses from genlayer
import builtins
original_builtins = {}
for name in ["TreeMap", "Address", "u256"]:
    if hasattr(builtins, name):
        original_builtins[name] = getattr(builtins, name)

builtins.TreeMap = dict
builtins.Address = str
builtins.u256 = int
builtins.gl = mock_gl

spec.loader.exec_module(mod)

# Clean up
for name in ["TreeMap", "Address", "u256", "gl"]:
    if name in original_builtins:
        setattr(builtins, name, original_builtins[name])
    elif hasattr(builtins, name):
        delattr(builtins, name)


class TestIsPublicUrl:
    def test_https_valid(self):
        assert mod._is_public_url("https://espn.com/scores") is True

    def test_https_with_path(self):
        assert mod._is_public_url("https://bbc.co.uk/sport/football") is True

    def test_http_rejected(self):
        assert mod._is_public_url("http://espn.com/scores") is False

    def test_localhost_rejected(self):
        assert mod._is_public_url("https://localhost/test") is False

    def test_127_rejected(self):
        assert mod._is_public_url("https://127.0.0.1/test") is False

    def test_private_10_rejected(self):
        assert mod._is_public_url("https://10.0.0.1/test") is False

    def test_private_192_rejected(self):
        assert mod._is_public_url("https://192.168.1.1/test") is False

    def test_private_172_rejected(self):
        assert mod._is_public_url("https://172.16.0.1/test") is False

    def test_172_15_allowed(self):
        assert mod._is_public_url("https://172.15.0.1/test") is True

    def test_credentials_rejected(self):
        assert mod._is_public_url("https://user:pass@example.com/test") is False

    def test_empty_rejected(self):
        assert mod._is_public_url("") is False

    def test_ftp_rejected(self):
        assert mod._is_public_url("ftp://example.com") is False


class TestClip:
    def test_short_string(self):
        assert mod._clip("hello", 10) == "hello"

    def test_long_string(self):
        assert mod._clip("hello world", 5) == "hello"


class TestSafeConfidence:
    def test_normal(self):
        assert mod._safe_confidence(85) == 85

    def test_over_100(self):
        assert mod._safe_confidence(150) == 100

    def test_negative(self):
        assert mod._safe_confidence(-5) == 0

    def test_string(self):
        assert mod._safe_confidence("abc") == 0


class TestNormaliseEnum:
    def test_valid(self):
        assert mod._normalise_enum("CREATOR_WINS", mod.ALLOWED_SETTLEMENT_OUTCOMES, "MORE_EVIDENCE_REQUIRED") == "CREATOR_WINS"

    def test_lowercase(self):
        assert mod._normalise_enum("creator_wins", mod.ALLOWED_SETTLEMENT_OUTCOMES, "MORE_EVIDENCE_REQUIRED") == "CREATOR_WINS"

    def test_invalid(self):
        assert mod._normalise_enum("INVALID_VALUE", mod.ALLOWED_SETTLEMENT_OUTCOMES, "MORE_EVIDENCE_REQUIRED") == "MORE_EVIDENCE_REQUIRED"


class TestHash:
    def test_deterministic(self):
        assert mod._hash("test") == mod._hash("test")

    def test_different_inputs(self):
        assert mod._hash("a") != mod._hash("b")

    def test_short_hash_length(self):
        assert len(mod._short_hash("test")) == 12


class TestStripJsonFences:
    def test_plain_json(self):
        assert mod._strip_json_fences('{"a": 1}') == '{"a": 1}'

    def test_fenced_json(self):
        result = mod._strip_json_fences('```json\n{"a": 1}\n```')
        assert '"a"' in result
        assert "```" not in result


class TestExtractJsonObject:
    def test_clean_json(self):
        result = mod._extract_json_object('{"outcome": "CREATOR_WINS"}')
        assert result["outcome"] == "CREATOR_WINS"

    def test_json_with_prefix(self):
        result = mod._extract_json_object('Here is the result: {"outcome": "PUSH_REFUND"}')
        assert result["outcome"] == "PUSH_REFUND"

    def test_invalid_json_raises(self):
        import pytest
        with pytest.raises(Exception):
            mod._extract_json_object("not json at all")
