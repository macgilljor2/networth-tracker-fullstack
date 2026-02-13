# Quick Start Guide - Test Suite

## Installation

First, install the test dependencies:

```bash
cd backend
pip install -r requirements.txt
```

This will install:
- pytest >= 8.0.0
- pytest-asyncio >= 0.23.0
- pytest-cov >= 4.1.0
- pytest-mock >= 3.12.0
- httpx >= 0.26.0
- faker >= 25.0.0
- aiosqlite >= 0.19.0

## Running Tests

### Option 1: Using the test runner script (Recommended)

```bash
# Run all tests
./run_tests.sh

# Run only unit tests
./run_tests.sh unit

# Run only integration tests
./run_tests.sh integration

# Run tests and open coverage report
./run_tests.sh coverage

# Run unit tests in parallel (faster)
./run_tests.sh fast

# Re-run failed tests
./run_tests.sh failed

# Clean test artifacts
./run_tests.sh clean

# Show all commands
./run_tests.sh help
```

### Option 2: Using pytest directly

```bash
# Run all tests
pytest

# Run unit tests only
pytest -m unit

# Run integration tests only
pytest -m integration

# Run with coverage
pytest --cov=nw_tracker --cov-report=term-missing

# Run specific file
pytest tests/unit/auth/test_auth_service.py

# Run specific test class
pytest tests/unit/auth/test_auth_service.py::TestAuthServicePasswordHandling

# Run specific test method
pytest tests/unit/auth/test_auth_service.py::TestAuthServicePasswordHandling::test_hash_password

# Verbose output
pytest -v

# Stop on first failure
pytest -x

# Enter debugger on failure
pytest --pdb
```

## Test Structure

```
tests/
├── conftest.py                           # Shared fixtures
├── unit/                                 # Unit tests (mocked DB)
│   ├── auth/
│   │   ├── conftest.py
│   │   └── test_auth_service.py
│   ├── accounts/
│   │   ├── conftest.py
│   │   └── test_account_service.py
│   └── balances/
│       ├── conftest.py
│       └── test_balance_service.py
└── integration/                          # Integration tests (SQLite)
    ├── auth/
    │   ├── conftest.py
    │   └── test_auth_endpoints.py
    ├── accounts/
    │   └── test_account_endpoints.py
    ├── balances/
    │   └── test_balance_endpoints.py
    └── account_groups/
        └── test_account_group_endpoints.py
```

## What's Been Tested

### Unit Tests (Mocked Database)
- ✅ AuthService - Password hashing, token generation/validation, user authentication
- ✅ AccountService - CRUD operations, data conversion, ownership checks
- ✅ BalanceService - CRUD operations, authorization

### Integration Tests (SQLite Database)
- ✅ Auth Endpoints - Registration, login, token refresh, logout, get current user
- ✅ Account Endpoints - CRUD operations, data isolation, balance relationships
- ✅ Balance Endpoints - CRUD operations, data isolation
- ✅ Account Group Endpoints - CRUD operations, account associations, data isolation

## Coverage Goals

Target: **80%+ coverage**

Current test files cover:
- Authentication logic and endpoints
- Account management
- Balance tracking
- Account groups
- Data isolation between users
- Error handling (401, 403, 404)
- Input validation

## Viewing Coverage Reports

After running tests with coverage:

```bash
# Open HTML report (macOS)
open htmlcov/index.html

# Open HTML report (Linux)
xdg-open htmlcov/index.html

# Or just open the file in your browser
# File located at: backend/htmlcov/index.html
```

## Test Data

Integration tests use a consistent dataset:
- 3 test users
- 6 accounts (2 per user)
- 18 balances (3 per account)
- 3 account groups (1 per user)

This ensures predictable test results.

## Common Issues

### Import errors
```bash
# Make sure you're in the backend directory
cd backend
pytest
```

### Tests not found
```bash
# Install package in development mode
pip install -e .
```

### Database connection errors in integration tests
- Integration tests use SQLite in-memory database
- No external database needed
- Database is automatically created/destroyed for each test

## Writing New Tests

### Unit Test Example
```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.unit
class TestMyFeature:
    @pytest.mark.asyncio
    async def test_something(self, mock_async_session):
        # Arrange
        # Set up test data

        # Act
        # Call method

        # Assert
        # Verify results
```

### Integration Test Example
```python
import pytest

@pytest.mark.integration
class TestMyEndpoint:
    @pytest.mark.asyncio
    async def test_endpoint(self, authenticated_test_client):
        # Arrange
        # Set up via API

        # Act
        response = await authenticated_test_client.post("/path", json={})

        # Assert
        assert response.status_code == 201
```

## Next Steps

1. Run all tests: `./run_tests.sh all`
2. Check coverage: `./run_tests.sh coverage`
3. Fix any failing tests
4. Add tests for new features as you develop
5. Maintain 80%+ coverage

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
- name: Run tests
  run: |
    cd backend
    pip install -r requirements.txt
    pytest --cov=nw_tracker --cov-report=xml --cov-report=term-missing

- name: Check coverage threshold
  run: |
    cd backend
    pytest --cov=nw_tracker --cov-fail-under=80
```

## Support

For detailed documentation, see: [tests/README.md](README.md)
