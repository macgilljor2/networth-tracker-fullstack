# API Specification for Frontend Development

**Net Worth Tracker API**
Base URL: `http://localhost:8000/api/v1`
API Docs: `http://localhost:8000/docs` (Swagger UI)

---

## Currency Conversion

**All monetary values are returned in GBP (British Pounds).**

The API automatically converts balances from USD/EUR accounts to GBP using live exchange rates:
- Exchange rates fetched from public API and cached for 24 hours
- Dashboard, account groups, and balance history all return GBP-only values
- If exchange rate API fails, uses fallback rates (USD=1.25, EUR=1.15)

---

## Authentication Flow

### JWT Token-Based Authentication

The API uses **access tokens** (short-lived) and **refresh tokens** (long-lived):

| Token Type | Expires In | Purpose |
|------------|------------|---------|
| Access Token | 15 minutes | Authorize API requests |
| Refresh Token | 7 days | Get new access tokens |

### Token Storage & Usage

1. **Login**: Receive both tokens, store refresh token securely (httpOnly cookie recommended)
2. **API Requests**: Include access token in Authorization header:
   ```
   Authorization: Bearer <access_token>
   ```
3. **Token Refresh**: When access token expires (401 response), use refresh endpoint
4. **Logout**: Revoke refresh token on server

### Auth Endpoints

#### POST `/auth/register`
Register new user account.

**Request:**
```typescript
{
  username: string;  // 3-50 chars
  email: string;     // Valid email
  password: string;  // min 8 chars
}
```

**Response (201):**
```typescript
{
  id: string;           // UUID
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;   // ISO 8601 datetime
  last_login: string | null;
}
```

---

#### POST `/auth/login`
Authenticate user and receive tokens.

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response (200):**
```typescript
{
  access_token: string;   // JWT for API calls
  refresh_token: string;  // For token refresh
  token_type: "bearer";
  expires_in: number;     // Seconds until expiry (900 = 15 min)
}
```

---

#### POST `/auth/refresh`
Get new access token using refresh token.

**Request:**
```typescript
{
  refresh_token: string;
}
```

**Response (200):**
```typescript
{
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}
```

---

#### POST `/auth/logout`
Revoke refresh token (logout user).

**Request:**
```typescript
{
  refresh_token: string;
}
```

**Response (200):**
```typescript
{
  message: string;  // Success message
}
```

---

#### GET `/auth/me`
Get current authenticated user info.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```typescript
{
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}
```

---

## Enums

Use GET `/enums` to fetch all enums, or hardcode these values:

### AccountType
| Value | Display Label |
|-------|---------------|
| `savings` | Savings |
| `current` | Current |
| `loan` | Loan |
| `credit` | Credit |
| `investment` | Investment |

### Currency
| Value | Display Label |
|-------|---------------|
| `GBP` | British Pound (£) |
| `USD` | US Dollar ($) |
| `EUR` | Euro (€) |

### Theme
| Value |
|-------|
| `light` |
| `dark` |

---

## Protected Endpoints

All endpoints below require `Authorization: Bearer <access_token>` header.

---

### Accounts

#### POST `/accounts/`
Create new account.

**Request:**
```typescript
{
  account_name: string;
  currency?: "GBP" | "USD" | "EUR";  // default: "GBP"
  account_type?: "savings" | "current" | "loan" | "credit" | "investment";  // default: "savings"
  balances?: Array<{                 // Optional initial balances
    amount: number;
    date: string;  // ISO 8601 date (YYYY-MM-DD)
  }>;
  groups?: string[];  // Array of account group UUIDs
}
```

**Response (201):**
```typescript
{
  id: string;              // UUID
  account_name: string;
  currency: string;
  account_type: string;
  user_id: string;         // UUID
  current_balance: number;
  created_at: string;      // ISO 8601 datetime
  updated_at: string;      // ISO 8601 datetime
}
```

---

#### GET `/accounts/`
Get all accounts for authenticated user.

**Response (200):** `Array<AccountResponse>`

---

#### GET `/accounts/{account_id}`
Get single account by ID.

**Response (200):** `AccountResponse`

---

#### PUT `/accounts/{account_id}`
Update account.

**Request:** All fields optional
```typescript
{
  account_name?: string;
  currency?: string;
  account_type?: string;
  balances?: Array<{
    amount?: number;
  }>;
  groups?: string[];
}
```

**Response (200):** `AccountResponse`

---

#### DELETE `/accounts/{account_id}`
Delete account (cascades to balances).

**Response (204):** No content

---

### Balances

Balances are nested under accounts: `/accounts/{account_id}/balances`

#### POST `/accounts/{account_id}/balances/`
Create balance entry for account.

**Request:**
```typescript
{
  amount: number;
  date: string;  // ISO 8601 date (YYYY-MM-DD)
}
```

**Response (201):**
```typescript
{
  id: string;
  amount: number;
  date: string;        // ISO 8601 date
  account_uuid: string;
  created_at: string;
  updated_at: string;
}
```

---

#### GET `/accounts/{account_id}/balances/`
Get all balances for account.

**Response (200):** `Array<BalanceResponse>`

---

#### GET `/accounts/{account_id}/balances/{balance_id}`
Get single balance by ID.

**Response (200):** `BalanceResponse`

---

#### PUT `/accounts/{account_id}/balances/{balance_id}`
Update balance amount.

**Request:**
```typescript
{
  amount: number;
}
```

**Response (200):** `BalanceResponse`

---

#### DELETE `/accounts/{account_id}/balances/{balance_id}`
Delete balance entry.

**Response (204):** No content

---

### Account Groups

#### POST `/account-groups/`
Create account group.

**Request:**
```typescript
{
  name: string;
  description: string;
  accounts?: string[];  // Array of account UUIDs to add
}
```

**Response (201):**
```typescript
{
  id: string;
  name: string;
  description: string;
  user_id: string;
  accounts: string[];   // Array of account UUIDs
  created_at: string;
  updated_at: string;
}
```

---

#### GET `/account-groups/`
Get all account groups with summary data (aggregated balances) and balance history.

**Query Params:**
- `from_date` (optional): Filter balance history from this date (inclusive) - format: `YYYY-MM-DD`
- `to_date` (optional): Filter balance history to this date (inclusive) - format: `YYYY-MM-DD`

**Response (200):**
```typescript
{
  id: string;
  name: string;
  description: string;
  account_count: number;
  total_balance_gbp: number;
  balance_history: Array<{
    date: string;           // ISO 8601 date
    total_balance_gbp: number;
  }>;
  created_at: string;
  updated_at: string;
}[]
```

**Balance History Behavior:**
- Time-series of total balances across all accounts in the group
- Uses "fill-forward" logic: when an account lacks a balance entry on a date, the earliest prior balance is used
- If an account has no prior balance, it is excluded from that date's sum
- **All values converted to GBP** using live exchange rates (cached for 24 hours)

---

#### GET `/account-groups/{account_group_id}`
Get account group with lite account list and balance history.

**Query Params:**
- `from_date` (optional): Filter balance history from this date (inclusive) - format: `YYYY-MM-DD`
- `to_date` (optional): Filter balance history to this date (inclusive) - format: `YYYY-MM-DD`

**Response (200):**
```typescript
{
  id: string;
  name: string;
  description: string;
  user_id: string;
  accounts: Array<{
    id: string;
    account_name: string;
  }>;
  balance_history: Array<{
    date: string;           // ISO 8601 date
    total_balance_gbp: number;
  }>;
  created_at: string;
  updated_at: string;
}
```

**Note:** Returns lite account format (id + name only) for editing purposes.

---

#### PUT `/account-groups/{account_group_id}`
Update account group.

**Request:** All fields optional
```typescript
{
  name?: string;
  description?: string;
  accounts?: string[];
}
```

**Response (200):** `AccountGroupResponse`

---

#### DELETE `/account-groups/{account_group_id}`
Delete account group.

**Response (204):** No content

---

### Users

#### POST `/user/`
Create new user.

**Request:**
```typescript
{
  email: string;
  username: string;
}
```

**Response (201):**
```typescript
{
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}
```

---

#### GET `/user/`
Get all users.

**Response (200):** `Array<UserResponse>`

---

#### GET `/user/{user_id}`
Get user by ID.

**Response (200):** `UserResponse`

---

#### DELETE `/user/{user_id}`
Delete user.

**Response (204):** No content

---

### Dashboard

#### GET `/dashboard/`
Get main dashboard data with totals, group summaries, and account type distribution.

**Response (200):**
```typescript
{
  total_balance_gbp: number;           // Total net worth across all accounts (in GBP)
  groups: Array<{
    id: string;
    name: string;
    total_balance_gbp: number;         // Group's total balance (in GBP)
  }>;
  by_account_type: Array<{
    account_type: string;              // "savings" | "current" | "loan" | "credit" | "investment"
    total_balance_gbp: number;         // Total for this account type (in GBP)
  }>;
}
```

**Note:** All balances are converted to GBP using live exchange rates (cached for 24 hours).

---

#### GET `/dashboard/history`
Get balance history for line graph - total net worth and per-group series.

**Query Params:**
- `from_date` (optional): Filter history from this date (inclusive) - format: `YYYY-MM-DD`
- `to_date` (optional): Filter history to this date (inclusive) - format: `YYYY-MM-DD`

**Response (200):**
```typescript
{
  total_history: Array<{
    date: string;           // ISO 8601 date
    total_balance_gbp: number;
  }>;
  group_histories: Array<{
    group_id: string;
    group_name: string;
    history: Array<{
      date: string;
      total_balance_gbp: number;
    }>;
  }>;
}
```

**Use Cases:**
- Toggle which series to display on the line graph
- Compare total net worth vs individual group performance over time
- All values in GBP for consistent comparison

---

### Enums

#### GET `/enums/`
Get all application enums for frontend dropdowns.

**Response (200):**
```typescript
{
  account_types: Array<{ value: string; label: string }>;
  currencies: Array<{ value: string; label: string }>;
  themes: Array<{ value: string; label: string }>;
}
```

---

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 204 | No content (successful delete) |
| 400 | Validation error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden |
| 404 | Not found |
| 422 | Unprocessable entity (validation failed) |

---

## Error Response Format

```typescript
{
  detail: string;  // Error message
}
```

Example validation error:
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Frontend Implementation Notes

### Axios Interceptor Pattern

```typescript
// Add request interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh token
      const refreshToken = getRefreshToken();
      const { data } = await axios.post('/api/v1/auth/refresh', { refresh_token: refreshToken });
      localStorage.setItem('access_token', data.access_token);
      // Retry original request
      error.config.headers.Authorization = `Bearer ${data.access_token}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Date Format
All dates are ISO 8601 format:
- Datetime: `2024-01-15T10:30:00`
- Date only: `2024-01-15`

### UUID Format
All IDs are UUID v4 strings: `550e8400-e29b-41d4-a716-446655440000`

---

## Quick Reference

| Action | Method | Endpoint | Auth Required |
|--------|--------|----------|---------------|
| Register | POST | `/auth/register` | No |
| Login | POST | `/auth/login` | No |
| Refresh Token | POST | `/auth/refresh` | No |
| Logout | POST | `/auth/logout` | No |
| Get Current User | GET | `/auth/me` | Yes |
| Create Account | POST | `/accounts/` | Yes |
| List Accounts | GET | `/accounts/` | Yes |
| Get Account | GET | `/accounts/{id}` | Yes |
| Update Account | PUT | `/accounts/{id}` | Yes |
| Delete Account | DELETE | `/accounts/{id}` | Yes |
| Add Balance | POST | `/accounts/{id}/balances/` | Yes |
| List Balances | GET | `/accounts/{id}/balances/` | Yes |
| Update Balance | PUT | `/accounts/{id}/balances/{bid}` | Yes |
| Delete Balance | DELETE | `/accounts/{id}/balances/{bid}` | Yes |
| Create Group | POST | `/account-groups/` | Yes |
| List Groups | GET | `/account-groups/` | Yes |
| Get Group | GET | `/account-groups/{id}` | Yes |
| Update Group | PUT | `/account-groups/{id}` | Yes |
| Delete Group | DELETE | `/account-groups/{id}` | Yes |
| Get Dashboard | GET | `/dashboard` | Yes |
| Get Dashboard History | GET | `/dashboard/history` | Yes |
| Get Enums | GET | `/enums/` | No |
