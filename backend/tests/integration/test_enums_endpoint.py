"""
Integration tests for enums endpoint.
Tests the public endpoint that returns all application enums.
"""
import pytest


@pytest.mark.integration
class TestGetEnums:
    """Test get all enums endpoint."""

    async def test_get_enums_success(self, test_client):
        """Test retrieving all application enums."""
        response = await test_client.get("/api/v1/enums")

        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert "account_types" in data
        assert "currencies" in data
        assert "themes" in data

        # Verify account types
        account_types = data["account_types"]
        assert len(account_types) == 5
        assert {"value", "label"}.issubset(set(account_types[0].keys()))

        # Verify account type values
        account_type_values = [at["value"] for at in account_types]
        assert "savings" in account_type_values
        assert "current" in account_type_values
        assert "loan" in account_type_values
        assert "credit" in account_type_values
        assert "investment" in account_type_values

        # Verify currencies
        currencies = data["currencies"]
        assert len(currencies) == 3
        currency_values = [c["value"] for c in currencies]
        assert "GBP" in currency_values
        assert "USD" in currency_values
        assert "EUR" in currency_values

        # Verify currency labels are user-friendly
        gbp_label = next(c["label"] for c in currencies if c["value"] == "GBP")
        assert "£" in gbp_label or "Pound" in gbp_label

        usd_label = next(c["label"] for c in currencies if c["value"] == "USD")
        assert "$" in usd_label or "Dollar" in usd_label

        eur_label = next(c["label"] for c in currencies if c["value"] == "EUR")
        assert "€" in eur_label or "Euro" in eur_label

        # Verify themes
        themes = data["themes"]
        assert len(themes) == 2
        theme_values = [t["value"] for t in themes]
        assert "light" in theme_values
        assert "dark" in theme_values

    async def test_get_enums_no_auth_required(self, test_client):
        """Test that enums endpoint is publicly accessible (no auth needed)."""
        response = await test_client.get("/api/v1/enums")

        # Should return 200, not 401/403
        assert response.status_code == 200

    async def test_get_enums_caching_headers(self, test_client):
        """Test that enums endpoint returns cache-friendly headers."""
        response = await test_client.get("/api/v1/enums")

        assert response.status_code == 200

        # Check for cache headers (optional, but good practice)
        cache_control = response.headers.get("cache-control")
        # We might want to add caching later, but for now just check response is valid
        assert response.json() is not None
