# NetWorth Tracker API - Postman Collection

Complete Postman collection for testing all NetWorth Tracker API endpoints.

## 📋 What's Included

This collection includes **ALL API endpoints**:

### 🔐 Authentication (1 endpoint)
- POST `/api/v1/auth/login` - Login and get access token

### 💰 Accounts (5 endpoints)
- GET `/api/v1/accounts` - Get all accounts
- GET `/api/v1/accounts/{id}` - Get specific account
- POST `/api/v1/accounts` - Create new account
- PUT `/api/v1/accounts/{id}` - Update account
- DELETE `/api/v1/accounts/{id}` - Delete account

### 📊 Balances (5 endpoints)
- GET `/api/v1/accounts/{account_id}/balances` - Get all balances for an account
- GET `/api/v1/balances/{id}` - Get specific balance
- POST `/api/v1/accounts/{account_id}/balances` - Create balance
- PUT `/api/v1/balances/{id}` - Update balance
- DELETE `/api/v1/balances/{id}` - Delete balance

### 📁 Account Groups (6 endpoints)
- GET `/api/v1/account-groups` - Get all groups (summary with aggregated totals)
- GET `/api/v1/account-groups/{id}` - Get group details (with accounts & balances)
- POST `/api/v1/account-groups` - Create new group
- POST `/api/v1/account-groups` - Create group with accounts
- PUT `/api/v1/account-groups/{id}` - Update group
- DELETE `/api/v1/account-groups/{id}` - Delete group

**Total: 17 endpoints**

## 🚀 Quick Start

### 1. Import Collection
1. Open Postman
2. Click "Import" button
3. Select "File" tab
4. Choose `NetWorthTracker-API.postman_collection.json`
5. Click "Import"

### 2. Start Your Server
```bash
cd /Users/jmacgillivray/Development/networth_tracker_app/backend
uv run uvicorn nw_tracker.main:app --reload --port 8000
```

### 3. Populate Test Data (Optional)
```bash
cd /Users/jmacgillivray/Development/networth_tracker_app/backend
uv run python scripts/populate_test_data.py
```

### 4. Test the Endpoints

**Step 1: Login**
- Run the `Authentication > Login` request first
- This automatically saves the access token

**Step 2: Test Other Endpoints**
- All other requests will automatically use the saved token
- Just click "Send" on any request

## 🔧 Collection Variables

The collection uses these variables (pre-configured):

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `http://localhost:8000` | API base URL |
| `access_token` | *auto-saved* | JWT access token (saved after login) |
| `user_id` | `de7c7d9c-a424...` | Test user ID |
| `account_id` | `96a89b1c-9c95...` | Test account ID (Main Savings) |
| `account_group_id` | `8af76eec-1521...` | Test account group ID (Banking) |
| `balance_id` | `64314c5a-86fd...` | Test balance ID |

## 📝 Endpoint Examples

### Get All Account Groups (Summary)
Returns aggregated data:
```json
[
  {
    "id": "uuid",
    "name": "Banking",
    "description": "All bank accounts",
    "account_count": 2,
    "total_balance_gbp": 22450.25,
    "total_balance_usd": 0.0
  }
]
```

### Get Account Group by ID (Detail)
Returns complete data with accounts and balances:
```json
{
  "id": "uuid",
  "name": "Banking",
  "accounts": [
    {
      "id": "uuid",
      "account_name": "Main Savings",
      "currency": "GBP",
      "account_type": "savings",
      "balances": [
        {
          "id": "uuid",
          "amount": 19000.0,
          "date": "2026-02-02"
        }
      ]
    }
  ]
}
```

## 🎯 Test Scenarios

### Scenario 1: Create Account with Balance
1. Run `Accounts > Create Account`
2. Note the new `account_id` from response
3. Update collection variable `account_id`
4. Run `Balances > Get Account Balances`

### Scenario 2: Create Account Group with Accounts
1. Run `Accounts > Get All Accounts`
2. Copy account IDs you want to group
3. Run `Account Groups > Create Account Group with Accounts`
4. Update the `accounts` array with your IDs

### Scenario 3: Update Balance
1. Run `Balances > Get Account Balances`
2. Copy a `balance_id`
3. Update collection variable `balance_id`
4. Run `Balances > Update Balance`

## 🛠️ Customization

### Change Test Data
1. Click on the collection name
2. Go to "Variables" tab
3. Update any variable values
4. Click "Save"

### Add New Environment
1. Click "Manage Environments" (gear icon)
2. Click "Add"
3. Name it (e.g., "Staging", "Production")
4. Add variables with different `base_url`
5. Save and select the environment

## 🔍 Troubleshooting

### "401 Unauthorized"
- Make sure you ran `Login` first
- Check that `access_token` variable is set
- Try logging in again (token expires after 15 minutes)

### "404 Not Found"
- Verify the server is running on port 8000
- Check that the ID exists in your database
- Run `populate_test_data.py` to create test data

### "500 Internal Server Error"
- Check server logs: `tail -f /tmp/uvicorn.log`
- Verify database connection
- Ensure all migrations are run

### Variable Not Working
- Check variable name matches (case-sensitive)
- Make sure variable has a value
- Try clicking "Send" on Login again to refresh token

## 📚 Additional Resources

- **FastAPI Docs**: http://localhost:8000/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/redoc
- **Backend Code**: `/Users/jmacgillivray/Development/networth_tracker_app/backend`

## ✅ Features

- ✅ Auto-token save after login
- ✅ Bearer authentication on all protected endpoints
- ✅ Pre-configured test data
- ✅ Complete CRUD for accounts, balances, and account groups
- ✅ Example request bodies
- ✅ Organized in folders by resource
- ✅ Standard Postman JSON format (easily shareable)

## 🎉 Quick Test

1. Import collection
2. Start server
3. Run `Authentication > Login`
4. Run `Account Groups > Get All Account Groups (Summary)`
5. Run `Accounts > Get All Accounts`
6. Run `Balances > Get Account Balances`

All done! You're now ready to test the full API. 🚀
