# PAN Card API Documentation

API for managing user PAN card information with 1-to-1 mapping (each user can have only one PAN card).

## Base URL

```
/api/user
```

## Authentication

All endpoints require JWT authentication:

```
Authorization: Bearer <your_jwt_token>
```

---

## Form Fields Mapping

| Form Field | API Field | Type | Required |
|------------|-----------|------|----------|
| PAN Card Number | `pan_number` | string | ✅ Yes |
| Full Name | `full_name` | string | ✅ Yes |
| Upload PAN Card (JPEG) | `pan_image` | file | ✅ Yes |
| Declaration Checkbox | `declaration_accepted` | boolean | ✅ Yes |

---

## Endpoints

### 1. Get PAN Card Details

Retrieve the user's PAN card information.

**Endpoint:** `GET /api/user/pan-card`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "pan_number": "ABCDE1234F",
        "full_name": "John Doe",
        "pan_image": "pan_cards/abc123.jpg",
        "pan_image_url": "https://example.com/storage/pan_cards/abc123.jpg",
        "declaration_accepted": true,
        "verification_status": "pending",
        "rejection_reason": null,
        "verified_at": null,
        "created_at": "2025-12-15T10:00:00.000000Z",
        "updated_at": "2025-12-15T10:00:00.000000Z"
    }
}
```

**Error Response - Not Found (404):**
```json
{
    "success": false,
    "message": "PAN card not found. Please upload your PAN card.",
    "data": null
}
```

---

### 2. Upload PAN Card

Upload a new PAN card for the user.

**Endpoint:** `POST /api/user/pan-card`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (form-data):**

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `pan_number` | string | Exactly 10 chars, format: `ABCDE1234F` | ✅ Yes |
| `full_name` | string | Max 255 characters | ✅ Yes |
| `pan_image` | file | JPEG only, max 2MB | ✅ Yes |
| `declaration_accepted` | boolean | Must be `true`/`1`/`yes`/`on` | ✅ Yes |

**PAN Number Format:**
- 5 uppercase letters + 4 digits + 1 uppercase letter
- Example: `ABCDE1234F`, `BXYPS1234K`
- Regex: `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`

**Example (cURL):**
```bash
curl -X POST "https://api.example.com/api/user/pan-card" \
  -H "Authorization: Bearer <token>" \
  -F "pan_number=ABCDE1234F" \
  -F "full_name=John Doe" \
  -F "pan_image=@/path/to/pancard.jpg" \
  -F "declaration_accepted=true"
```

**Example (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('pan_number', 'ABCDE1234F');
formData.append('full_name', 'John Doe');
formData.append('pan_image', fileInput.files[0]);
formData.append('declaration_accepted', 'true');

fetch('/api/user/pan-card', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token
    },
    body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

**Success Response (201):**
```json
{
    "success": true,
    "message": "PAN card uploaded successfully. Verification is pending.",
    "data": {
        "id": 1,
        "user_id": 1,
        "type": "shipping",
        "address_type": "home",
        "name": "John Doe",
        "phone": "9876543210",
        "alternate_phone": "9123456789",
        "locality": "Andheri East",
        "address_line1": "123, ABC Building, XYZ Road",
        "landmark": "Near Railway Station",
        "city": "Mumbai",
        "state": "Maharashtra",
        "postal_code": "400069",
        "country": "India",
        "is_default": true,
        "created_at": "2025-12-15T10:00:00.000000Z",
        "updated_at": "2025-12-15T10:00:00.000000Z"
    }
}
```

**Error Response - Already Exists (409):**
```json
{
    "success": false,
    "message": "PAN card already exists. Use update endpoint to modify.",
    "data": {
        "pan_number": "ABCDE1234F",
        "verification_status": "pending"
    }
}
```

**Validation Error Response (422):**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "pan_number": ["Invalid PAN format. PAN must be in format: ABCDE1234F"],
        "pan_image": ["Only JPEG files are allowed for PAN card image."],
        "declaration_accepted": ["You must accept the declaration to proceed."]]
    }
}
```

---

### 3. Update PAN Card

Update existing PAN card details. Only allowed if verification status is `pending` or `rejected`.

**Endpoint:** `PUT /api/user/pan-card`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (only send fields to update):**

| Field | Type | Required |
|-------|------|----------|
| `pan_number` | string | No |
| `full_name` | string | No |
| `pan_image` | file | No |
| `declaration_accepted` | boolean | No |

> **Note:** Updating any field will reset `verification_status` back to `pending`.

**Success Response (200):**
```json
{
    "success": true,
    "message": "PAN card updated successfully. Verification is pending.",
    "data": {
        "id": 1,
        "pan_number": "XYZAB5678C",
        "full_name": "John Updated",
        "pan_image_url": "https://example.com/storage/pan_cards/xyz789.jpg",
        "verification_status": "pending"
    }
}
```

**Error Response - Already Verified (403):**
```json
{
    "success": false,
    "message": "Cannot update verified PAN card. Please contact support."
}
```

---

### 4. Delete PAN Card

Delete the user's PAN card. Only allowed if verification status is `pending` or `rejected`.

**Endpoint:** `DELETE /api/user/pan-card`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "PAN card deleted successfully."
}
```

**Error Response - Already Verified (403):**
```json
{
    "success": false,
    "message": "Cannot delete verified PAN card. Please contact support."
}
```

---

### 5. Check Verification Status

Check the current verification status of the user's PAN card.

**Endpoint:** `GET /api/user/pan-card/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Response - PAN Card Exists (200):**
```json
{
    "success": true,
    "data": {
        "has_pan_card": true,
        "verification_status": "pending",
        "verified_at": null,
        "rejection_reason": null,
        "message": "Your PAN card is under verification."
    }
}
```

**Response - PAN Card Verified (200):**
```json
{
    "success": true,
    "data": {
        "has_pan_card": true,
        "verification_status": "verified",
        "verified_at": "2025-12-15T12:00:00.000000Z",
        "rejection_reason": null,
        "message": "Your PAN card is verified."
    }
}
```

**Response - PAN Card Rejected (200):**
```json
{
    "success": true,
    "data": {
        "has_pan_card": true,
        "verification_status": "rejected",
        "verified_at": null,
        "rejection_reason": "Image is not clear",
        "message": "Your PAN card was rejected. Reason: Image is not clear"
    }
}
```

**Response - No PAN Card (200):**
```json
{
    "success": true,
    "data": {
        "has_pan_card": false,
        "verification_status": null,
        "message": "PAN card not uploaded yet."
    }
}
```

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Get PAN Card | GET | `/api/user/pan-card` |
| Upload PAN Card | POST | `/api/user/pan-card` |
| Update PAN Card | PUT | `/api/user/pan-card` |
| Delete PAN Card | DELETE | `/api/user/pan-card` |
| Check Status | GET | `/api/user/pan-card/status` |

---

## Database Schema

**Table: `user_pan_cards`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `user_id` | bigint | Foreign key (unique - 1-to-1 mapping) |
| `pan_number` | string(10) | PAN number (unique) |
| `full_name` | string | Full name as on PAN card |
| `pan_image` | string | Path to uploaded JPEG file |
| `declaration_accepted` | boolean | User accepted declaration |
| `verification_status` | enum | `pending`, `verified`, `rejected` |
| `rejection_reason` | text | Reason if rejected (nullable) |
| `verified_at` | timestamp | When verified (nullable) |
| `created_at` | timestamp | Created timestamp |
| `updated_at` | timestamp | Updated timestamp |

---

## Verification Status Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERIFICATION STATUS FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Upload PAN Card                                                 │
│        │                                                         │
│        ▼                                                         │
│   ┌─────────┐                                                   │
│   │ PENDING │ ◄──────────────────────────────┐                  │
│   └────┬────┘                                │                  │
│        │                                     │                  │
│   Admin Review                          User Updates            │
│        │                                     │                  │
│   ┌────┴────┐                               │                  │
│   │         │                               │                  │
│   ▼         ▼                               │                  │
│ ┌────────┐  ┌──────────┐                    │                  │
│ │VERIFIED│  │ REJECTED │────────────────────┘                  │
│ └────────┘  └──────────┘                                        │
│     │                                                            │
│     ▼                                                            │
│  Cannot Update/Delete                                            │
│  (Contact Support)                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | PAN card created |
| 403 | Forbidden (cannot modify verified PAN) |
| 404 | PAN card not found |
| 409 | Conflict (PAN card already exists) |
| 422 | Validation error |

---

## Declaration Text

> "I do hereby declare that PAN furnished/stated above is correct and belongs to me, registered as an account holder with www.example.com. I further declare that I shall solely be held responsible for the consequences, in case of any false PAN declaration."

---

## Important Notes

1. **1-to-1 Mapping**: Each user can have only one PAN card record.
2. **JPEG Only**: Only JPEG/JPG images are allowed for PAN card upload.
3. **PAN Format**: Must follow the format `ABCDE1234F` (5 letters + 4 digits + 1 letter).
4. **Update Restrictions**: Verified PAN cards cannot be updated or deleted.
5. **Re-verification**: Any update to a pending/rejected PAN card resets status to `pending`.
