"""
Integration tests for account group endpoints.
Tests the actual API endpoints with SQLite database.
"""
import pytest
from uuid import uuid4
from datetime import date


@pytest.mark.integration
class TestCreateAccountGroup:
    """Test account group creation endpoint."""

    async def test_create_account_group_unauthorized(self, test_client):
        """Test creating account group without authentication."""
        response = await test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "Test Group",
                "description": "Test Description"
            },
        )

        assert response.status_code in [401, 403]

    async def test_create_account_group_success(self, authenticated_test_client):
        """Test successful account group creation without accounts."""
        response = await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "Investment Funds",
                "description": "High risk investment accounts"
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Investment Funds"
        assert data["description"] == "High risk investment accounts"
        assert "id" in data
        assert isinstance(data["accounts"], list)
        assert len(data["accounts"]) == 0

    async def test_create_account_group_with_accounts(self, authenticated_test_client):
        """Test creating account group with associated accounts."""
        # Create an account first
        account_response = await authenticated_test_client.post(
            "/api/v1/accounts",
            json={
                "account_name": "Test Account",
                "currency": "USD",
                "account_type": "savings",
            },
        )
        account_id = account_response.json()["id"]

        # Create account group with account
        response = await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "Savings Group",
                "description": "All savings accounts",
                "accounts": [account_id]
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Savings Group"
        assert len(data["accounts"]) == 1
        assert data["accounts"][0] == account_id

    async def test_create_account_group_missing_fields(self, authenticated_test_client):
        """Test creating account group with missing fields."""
        response = await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={"name": "Test Group"},  # Missing description
        )

        assert response.status_code == 422  # Validation error

    async def test_create_account_group_nonexistent_account(self, authenticated_test_client):
        """Test creating account group with non-existent account."""
        fake_account_id = str(uuid4())
        response = await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "Test Group",
                "description": "Test Description",
                "accounts": [fake_account_id]
            },
        )

        # Service catches the error and returns 400
        assert response.status_code == 400


@pytest.mark.integration
class TestGetAllAccountGroups:
    """Test get all account groups endpoint - returns summary data."""

    async def test_get_all_account_groups_unauthorized(self, test_client):
        """Test getting account groups without authentication."""
        response = await test_client.get("/api/v1/account-groups")

        assert response.status_code in [401, 403]

    async def test_get_all_account_groups_empty(self, authenticated_test_client):
        """Test getting all account groups when user has none."""
        response = await authenticated_test_client.get("/api/v1/account-groups")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Could be empty or have groups from previous tests

    async def test_get_all_account_groups_with_data(self, authenticated_test_client):
        """Test getting all account groups with summary data."""
        # Create an account group first
        await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "Test Group",
                "description": "Test Description"
            },
        )

        response = await authenticated_test_client.get("/api/v1/account-groups")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        # Verify summary fields exist
        assert "account_count" in data[0]
        assert "total_balance_gbp" in data[0]
        assert "total_balance_usd" in data[0]
        assert isinstance(data[0]["account_count"], int)

    async def test_get_all_account_groups_summary_data(self, authenticated_test_client):
        """Test that summary endpoint returns aggregated data."""
        # Create an account with balance
        account_response = await authenticated_test_client.post(
            "/api/v1/accounts",
            json={
                "account_name": "GBP Account",
                "currency": "GBP",
                "account_type": "savings",
                "balances": [
                    {
                        "amount": 1000.50,
                        "date": "2024-01-01"
                    }
                ]
            },
        )

        account_id = account_response.json()["id"]

        # Create account group with account
        await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "GBP Savings",
                "description": "All GBP savings",
                "accounts": [account_id]
            },
        )

        # Get all account groups
        response = await authenticated_test_client.get("/api/v1/account-groups")

        assert response.status_code == 200
        data = response.json()
        # Find our group
        group = next((g for g in data if g["name"] == "GBP Savings"), None)
        assert group is not None
        assert group["account_count"] == 1
        assert group["total_balance_gbp"] == 1000.50


@pytest.mark.integration
class TestGetAccountGroupById:
    """Test get account group by ID endpoint - returns full details with accounts and balances."""

    async def test_get_account_group_by_id_success(self, authenticated_test_client):
        """Test retrieving account group by ID."""
        # Create an account group
        create_response = await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "Specific Group",
                "description": "A specific test group"
            },
        )
        group_id = create_response.json()["id"]

        # Get the account group
        response = await authenticated_test_client.get(f"/api/v1/account-groups/{group_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == group_id
        assert data["name"] == "Specific Group"
        assert "accounts" in data
        assert isinstance(data["accounts"], list)

    async def test_get_account_group_by_id_unauthorized(self, test_client):
        """Test getting account group without authentication."""
        fake_id = uuid4()
        response = await test_client.get(f"/api/v1/account-groups/{fake_id}")

        assert response.status_code in [401, 403]

    async def test_get_account_group_not_found(self, authenticated_test_client):
        """Test retrieving non-existent account group."""
        fake_id = uuid4()
        response = await authenticated_test_client.get(f"/api/v1/account-groups/{fake_id}")

        assert response.status_code == 404

    async def test_get_account_group_invalid_id_format(self, authenticated_test_client):
        """Test getting account group with invalid ID format."""
        response = await authenticated_test_client.get("/api/v1/account-groups/not-a-uuid")

        assert response.status_code == 422  # Validation error

    async def test_get_account_group_with_accounts_and_balances(self, authenticated_test_client):
        """Test getting account group returns full account details with balances."""
        # Create an account with multiple balances
        account_response = await authenticated_test_client.post(
            "/api/v1/accounts",
            json={
                "account_name": "Investment Account",
                "currency": "USD",
                "account_type": "investment",
                "balances": [
                    {
                        "amount": 5000.00,
                        "date": "2024-01-01"
                    },
                    {
                        "amount": 5200.00,
                        "date": "2024-02-01"
                    }
                ]
            },
        )

        account_id = account_response.json()["id"]

        # Create account group
        group_response = await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "Investments",
                "description": "All investment accounts",
                "accounts": [account_id]
            },
        )

        group_id = group_response.json()["id"]

        # Get the account group
        response = await authenticated_test_client.get(f"/api/v1/account-groups/{group_id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data["accounts"]) == 1
        account = data["accounts"][0]
        assert account["account_name"] == "Investment Account"
        assert account["currency"] == "USD"
        assert len(account["balances"]) == 2
        assert account["balances"][0]["amount"] == 5000.00
        assert account["balances"][1]["amount"] == 5200.00


@pytest.mark.integration
class TestUpdateAccountGroup:
    """Test update account group endpoint."""

    async def test_update_account_group_success(self, authenticated_test_client):
        """Test updating an account group."""
        # Create an account group
        create_response = await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "Original Name",
                "description": "Original Description"
            },
        )
        group_id = create_response.json()["id"]

        # Update the account group
        response = await authenticated_test_client.put(
            f"/api/v1/account-groups/{group_id}",
            json={
                "name": "Updated Name",
                "description": "Updated Description"
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["description"] == "Updated Description"

    async def test_update_account_group_unauthorized(self, test_client):
        """Test updating account group without authentication."""
        fake_id = uuid4()
        response = await test_client.put(
            f"/api/v1/account-groups/{fake_id}",
            json={"name": "Updated"},
        )

        assert response.status_code in [401, 403]

    async def test_update_account_group_not_found(self, authenticated_test_client):
        """Test updating non-existent account group."""
        fake_id = uuid4()
        response = await authenticated_test_client.put(
            f"/api/v1/account-groups/{fake_id}",
            json={
                "name": "Updated Name",
                "description": "Updated Description"
            },
        )

        assert response.status_code == 404

    async def test_update_account_group_partial(self, authenticated_test_client):
        """Test partial account group update."""
        # Create an account group
        create_response = await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "Original",
                "description": "Original Description"
            },
        )
        group_id = create_response.json()["id"]

        # Update only name
        response = await authenticated_test_client.put(
            f"/api/v1/account-groups/{group_id}",
            json={
                "name": "New Name",
                "description": "Original Description"
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"


@pytest.mark.integration
class TestDeleteAccountGroup:
    """Test delete account group endpoint."""

    async def test_delete_account_group_success(self, authenticated_test_client):
        """Test deleting an account group."""
        # Create an account group
        create_response = await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "To Delete",
                "description": "This will be deleted"
            },
        )
        group_id = create_response.json()["id"]

        # Delete the account group
        response = await authenticated_test_client.delete(f"/api/v1/account-groups/{group_id}")

        assert response.status_code == 204

        # Verify it's deleted
        get_response = await authenticated_test_client.get(f"/api/v1/account-groups/{group_id}")
        assert get_response.status_code == 404

    async def test_delete_account_group_unauthorized(self, test_client):
        """Test deleting account group without authentication."""
        fake_id = uuid4()
        response = await test_client.delete(f"/api/v1/account-groups/{fake_id}")

        assert response.status_code in [401, 403]

    async def test_delete_account_group_not_found(self, authenticated_test_client):
        """Test deleting non-existent account group."""
        fake_id = uuid4()
        response = await authenticated_test_client.delete(f"/api/v1/account-groups/{fake_id}")

        assert response.status_code == 404


@pytest.mark.integration
class TestAccountGroupWithAccounts:
    """Test account group with accounts relationship."""

    async def test_get_account_group_with_accounts(self, authenticated_test_client):
        """Test getting account group with full account details."""
        # Create accounts
        account1_response = await authenticated_test_client.post(
            "/api/v1/accounts",
            json={
                "account_name": "Account 1",
                "currency": "GBP",
                "account_type": "savings",
            },
        )
        account1_id = account1_response.json()["id"]

        account2_response = await authenticated_test_client.post(
            "/api/v1/accounts",
            json={
                "account_name": "Account 2",
                "currency": "USD",
                "account_type": "investment",
            },
        )
        account2_id = account2_response.json()["id"]

        # Create account group with accounts
        group_response = await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "Mixed Accounts",
                "description": "Accounts in different currencies",
                "accounts": [account1_id, account2_id]
            },
        )
        group_id = group_response.json()["id"]

        # Get account group with accounts
        response = await authenticated_test_client.get(f"/api/v1/account-groups/{group_id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data["accounts"]) == 2
        account_ids = [acc["id"] for acc in data["accounts"]]
        assert account1_id in account_ids
        assert account2_id in account_ids

    async def test_update_account_group_accounts(self, authenticated_test_client):
        """Test updating accounts in an account group."""
        # Create accounts
        account1_response = await authenticated_test_client.post(
            "/api/v1/accounts",
            json={
                "account_name": "Account 1",
                "currency": "GBP",
                "account_type": "savings",
            },
        )
        account1_id = account1_response.json()["id"]

        account2_response = await authenticated_test_client.post(
            "/api/v1/accounts",
            json={
                "account_name": "Account 2",
                "currency": "USD",
                "account_type": "investment",
            },
        )
        account2_id = account2_response.json()["id"]

        # Create account group with one account
        group_response = await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "Growing Group",
                "description": "Will add more accounts",
                "accounts": [account1_id]
            },
        )
        group_id = group_response.json()["id"]

        # Update to add second account
        response = await authenticated_test_client.put(
            f"/api/v1/account-groups/{group_id}",
            json={
                "name": "Growing Group",
                "description": "Now has more accounts",
                "accounts": [account1_id, account2_id]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["accounts"]) == 2
        assert account2_id in data["accounts"]

    async def test_many_to_many_relationship(self, authenticated_test_client):
        """Test that many-to-many relationship works correctly."""
        # Create accounts
        account1_response = await authenticated_test_client.post(
            "/api/v1/accounts",
            json={
                "account_name": "Shared Account 1",
                "currency": "GBP",
                "account_type": "savings",
            },
        )
        account1_id = account1_response.json()["id"]

        account2_response = await authenticated_test_client.post(
            "/api/v1/accounts",
            json={
                "account_name": "Shared Account 2",
                "currency": "GBP",
                "account_type": "current",
            },
        )
        account2_id = account2_response.json()["id"]

        # Create first group with both accounts
        group1_response = await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "Group 1",
                "description": "First group",
                "accounts": [account1_id, account2_id]
            },
        )
        group1_id = group1_response.json()["id"]

        # Create second group with same accounts (many-to-many)
        group2_response = await authenticated_test_client.post(
            "/api/v1/account-groups",
            json={
                "name": "Group 2",
                "description": "Second group with same accounts",
                "accounts": [account1_id, account2_id]
            },
        )
        group2_id = group2_response.json()["id"]

        # Verify both groups have the accounts
        response1 = await authenticated_test_client.get(f"/api/v1/account-groups/{group1_id}")
        assert response1.status_code == 200
        data1 = response1.json()
        assert len(data1["accounts"]) == 2

        response2 = await authenticated_test_client.get(f"/api/v1/account-groups/{group2_id}")
        assert response2.status_code == 200
        data2 = response2.json()
        assert len(data2["accounts"]) == 2

        # Verify same accounts in both groups
        ids1 = [acc["id"] for acc in data1["accounts"]]
        ids2 = [acc["id"] for acc in data2["accounts"]]
        assert set(ids1) == set(ids2)
