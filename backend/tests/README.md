# Test Suite Documentation

This directory contains comprehensive unit and integration tests for the Net Worth Tracker API.

## Test Structure

```
tests/
├── conftest.py                      # Shared fixtures for all tests
├── unit/                            # Unit tests (mocked database)
│   ├── auth/                        # Authentication service tests
│   ├── accounts/                    # Account service tests
│   ├── balances/                    # Balance service tests
│   └── account_groups/              # Account group service tests
└── integration/                     # Integration tests (SQLite database)
    ├── auth/                        # Authentication endpoint tests
    ├── accounts/                    # Account endpoint tests
    ├── balances/                    # Balance endpoint tests
    └── account_groups/              # Account group endpoint tests
```

## Test Types

### Unit Tests (`@pytest.mark.unit`)
- Fast tests that mock database connections
- Test business logic in isolation
- Located in `tests/unit/`
- Run with: `pytest -m unit`

### Integration Tests (`@pytest.mark.integration`)
- Slower tests that use real SQLite database
- Test complete API endpoints
- Database is freshly populated for each test session
- Located in `tests/integration/`
- Run with: `pytest -m integration`

## Running Tests

### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Run All Tests

```bash
pytest
```

### Run Only Unit Tests

```bash
pytest -m unit
```

### Run Only Integration Tests

```bash
pytest -m integration
```

### Run Specific Test File

```bash
pytest tests/unit/auth/test_auth_service.py
```

### Run Specific Test Class

```bash
pytest tests/unit/auth/test_auth_service.py::TestAuthServicePasswordHandling
```

### Run Specific Test Method

```bash
pytest tests/unit/auth/test_auth_service.py::TestAuthServicePasswordHandling::test_hash_password
```

### Run with Coverage Report

Coverage is automatically generated. Reports are saved to:
- Terminal output (with missing lines): `--cov-report=term-missing`
- HTML report: `htmlcov/index.html`

View HTML coverage report:
```bash
open htmlcov/index.html
```

### Run Tests in Parallel (Faster)

Install pytest-xdist:
```bash
pip install pytest-xdist
```

Run with multiple workers:
```bash
pytest -n auto
```

## Coverage Goals

Target: **80%+ coverage** across all modules

View current coverage:
```bash
pytest --cov=nw_tracker --cov-report=term-missing
```

## Test Data

### Populated Database (Integration Tests)

Integration tests use a consistent test dataset that's loaded at the start of each test session:

- **3 Users**: user1, user2, user3
- **6 Accounts**: 2 accounts per user
- **18 Balances**: 3 balances per account
- **3 Account Groups**: 1 per user with 2 accounts each

This ensures tests can reference specific data and expect consistent results.

### Fixtures

Key fixtures available in tests:

#### Shared Fixtures (conftest.py)
- `fake_data` - Faker instance for generating test data
- `sample_user_data` - Sample user data dict
- `sample_account_data` - Sample account data dict
- `sample_balance_data` - Sample balance data dict
- `sample_account_group_data` - Sample account group data dict

#### Unit Test Fixtures
- `mock_async_session` - Mocked AsyncSession
- `mock_db_result` - Mock database result helper
- Module-specific mock objects (see each module's conftest.py)

#### Integration Test Fixtures
- `sqlite_engine` - SQLite engine for tests
- `db_session` - Database session with automatic rollback
- `test_client` - FastAPI test client
- `authenticated_test_client` - Pre-authenticated test client
- `populated_db_session` - Session with pre-populated test data
- `populated_test_client` - Authenticated client with populated data

## Writing New Tests

### Unit Test Template

```python
"""
Unit tests for [Service Name].
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.mark.unit
class Test[ServiceName][Feature]:
    """Test [feature description]."""

    @pytest.fixture
    def [service_name](self, mock_async_session):
        """Create [ServiceName] instance."""
        from nw_tracker.services.[service_name] import [ServiceName]
        return [ServiceName](mock_async_session)

    @pytest.mark.asyncio
    async def test_[specific_behavior](self, [service_name]):
        """Test [specific behavior]."""
        # Arrange
        # Set up mocks and test data

        # Act
        # Call the method being tested

        # Assert
        # Verify expected behavior
```

### Integration Test Template

```python
"""
Integration tests for [Endpoint Name].
"""
import pytest


@pytest.mark.integration
class Test[EndpointName][Action]:
    """Test [action description]."""

    @pytest.mark.asyncio
    async def test_[specific_scenario](self, authenticated_test_client):
        """Test [specific scenario]."""
        # Arrange
        # Set up data via API calls

        # Act
        response = await authenticated_test_client.[method]("/path")

        # Assert
        assert response.status_code == expected_status
        data = response.json()
        assert data["field"] == expected_value
```

## Best Practices

1. **Use descriptive test names** - `test_create_account_success` not `test_1`

2. **Follow Arrange-Act-Assert pattern** - Clearly structure each test

3. **Test both success and failure cases** - Cover 200, 404, 403, 401, etc.

4. **Use parametrize for similar tests** - Avoid code duplication

5. **Don't over-mock in unit tests** - Only mock external dependencies (DB, APIs)

6. **Create real instances in tests** - Don't mock services/repositories if you can create them

7. **Use fixtures for setup** - Keep tests DRY (Don't Repeat Yourself)

8. **Test behavior, not implementation** - Test what the code should do, not how

9. **Keep tests independent** - Each test should be able to run alone

10. **Use assertions effectively** - One assertion per logical check

## Debugging Failed Tests

### Run with verbose output

```bash
pytest -v
```

### Stop on first failure

```bash
pytest -x
```

### Enter debugger on failure

```bash
pytest --pdb
```

### Show print statements

```bash
pytest -s
```

### Run specific test with detailed output

```bash
pytest -v -s tests/unit/auth/test_auth_service.py::TestAuthServicePasswordHandling::test_hash_password
```

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    pip install -r requirements.txt
    pytest --cov=nw_tracker --cov-report=xml --cov-report=term-missing

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage.xml
```

## Test Markers

Available markers for organizing tests:

- `@pytest.mark.unit` - Unit tests (mocked DB)
- `@pytest.mark.integration` - Integration tests (real DB)
- `@pytest.mark.slow` - Slow-running tests
- `@pytest.mark.asyncio` - Async test functions

## Common Issues

### Import Errors

Ensure you're running tests from the backend directory:
```bash
cd /Users/jmacgillivray/Development/networth_tracker_app/backend
pytest
```

### Database Lock Errors

Make sure tests use proper isolation:
- Unit tests should mock DB operations
- Integration tests should use the `db_session` fixture with automatic rollback

### Async Test Warnings

Ensure `asyncio_mode = auto` is set in `pytest.ini`

## Test Coverage Report

After running tests, view detailed coverage:

```bash
# Terminal report with missing lines
pytest --cov=nw_tracker --cov-report=term-missing

# HTML report
open htmlcov/index.html
```

## Contributing

When adding new features:

1. Write unit tests for service layer
2. Write integration tests for API endpoints
3. Ensure coverage remains above 80%
4. Test both success and error cases
5. Test data isolation between users
6. Test edge cases and boundary conditions
