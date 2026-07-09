# 🔐 Authentication API

Endpoints for user registration, login, and profile management.

| Endpoint                    | Method | Input Parameters                | Description                                   |
| :-------------------------- | :----- | :------------------------------ | :-------------------------------------------- |
| `/api/auth/register`        | `POST` | `username`, `password`, `email` | Registers a new user account.                 |
| `/api/auth/login`           | `POST` | `username`, `password`          | Logs in a user, returning a JWT token.        |
| `/api/auth/google`          | `POST` | `token` (Google ID token)       | Handles federated Google Authentication.      |
| `/api/auth/forgot-password` | `POST` | `email`                         | Initiates the account recovery flow (mocked). |
| `/api/auth/me`              | `GET`  | _Header Authorization Token_    | Returns the currently logged-in user profile. |

---

## ⚡ Credits System

The credits system gates all AI and media-generation features. Every deduction and addition is recorded atomically in the `credit_transactions` ledger table.

### Endpoints

| Endpoint                                   | Method | Auth Required | Description                                           |
| :----------------------------------------- | :----- | :------------ | :---------------------------------------------------- |
| `/api/auth/credits`                        | `GET`  | ✅ User       | Returns current balance + low_balance flag.           |
| `/api/auth/transactions`                   | `GET`  | ✅ User       | Returns the paginated ledger (default 100, max 500).  |
| `/api/admin/users/{user_id}/add-credits`   | `POST` | ✅ Admin only | Manually grant credits to a user.                     |

---

### `GET /api/auth/credits`

Polled by the frontend header every 30 seconds to keep the badge in sync.

**Response (200 OK)**
```json
{
  "success": true,
  "credits": 142,
  "low_balance": false,
  "threshold": 20
}
```

| Field         | Type    | Description                                                      |
| :------------ | :------ | :--------------------------------------------------------------- |
| `credits`     | integer | Current balance.                                                 |
| `low_balance` | boolean | `true` when `credits < threshold`. Used to trigger frontend toast. |
| `threshold`   | integer | The server-side `LOW_BALANCE_THRESHOLD` constant (default: 20).  |

---

### `GET /api/auth/transactions?limit=N`

Returns the credit ledger for the authenticated user.

**Query Parameters**

| Param   | Default | Max | Description                  |
| :------ | :------ | :-- | :--------------------------- |
| `limit` | 100     | 500 | Number of rows to return.    |

**Response (200 OK)**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "amount": -5,
      "feature_name": "sfx_mix",
      "created_at": "2026-07-09T10:00:00Z",
      "balance_after": 137
    }
  ]
}
```

| Field          | Type    | Description                                                             |
| :------------- | :------ | :---------------------------------------------------------------------- |
| `amount`       | integer | Negative = deduction, positive = addition.                              |
| `feature_name` | string  | Which feature consumed/added the credits (see cost table below).        |
| `balance_after`| integer | Running balance **immediately after** this transaction was applied.      |

---

### `POST /api/admin/users/{user_id}/add-credits`

Admin-only. Grants credits to any user and writes an audit ledger row.

**Request Body**
```json
{ "amount": 100, "reason": "manual top-up for support ticket #1234" }
```

**Response (200 OK)**
```json
{ "success": true, "new_balance": 242 }
```

---

### Error Responses

| Status | When                                                      | Body `detail`                              |
| :----- | :-------------------------------------------------------- | :----------------------------------------- |
| `402`  | Deduction would exceed current balance (non-admin users). | `"Insufficient credits: need X, have Y"`   |
| `403`  | Non-admin user calls an admin-only credit endpoint.       | `"Admin access required"`                  |
| `404`  | `user_id` does not exist.                                 | `"User not found"`                         |

---

### Per-Feature Credit Costs

| Feature              | `feature_name`       | Cost |
| :------------------- | :------------------- | :--- |
| SD Image Generate    | `sd_generate`        | 5    |
| SD Inpaint           | `sd_inpaint`         | 5    |
| SD Upscale           | `sd_upscale`         | 3    |
| SD Style Transfer    | `sd_style_transfer`  | 5    |
| SD Batch Generate    | `sd_batch_generate`  | 10   |
| Video Render         | `video_render`       | 20   |
| SFX Mix              | `sfx_mix`            | 5    |
| Panel Analysis (AI)  | `panel_analysis`     | 5    |
| Daily Claim          | `daily_claim`        | +15  |
| Admin Manual Grant   | `admin_grant`        | +N   |

> **Note:** Costs are enforced server-side and validated atomically. The frontend `hasSufficientCredits(cost)` helper from `useCredits` provides a proactive UI gate before the request is made.

