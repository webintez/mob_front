# Flash Sale API & Frontend Integration Guide

This document outlines how the frontend team should integrate with the Flash Sale features. The backend has been updated to seamlessly inject Flash Sale data into product responses, handle nested category inheritance, and manage purchase control rules.

---

## 1. Product API Updates (Automatic Injection)

Whenever you fetch products from the standard APIs (e.g., `GET /api/products`, `GET /api/products/featured`, or `GET /api/products/{slug}`), the backend will **automatically** check if the product is part of a Flash Sale (either directly or via its category/parent category).

If the product is involved in a Flash Sale, the response will include a `flash_sale_data` object. If not, it will be `null`.

### Example Product Payload

```json
{
    "id": 15,
    "name": "Poco X6 Neo 5G",
    "price": "14999.00", // The ORIGINAL price
    "category_slug": "mobile",
    "flash_sale_data": {
        "id": 1,
        "name": "Summer Mega Sale",
        "is_live": true,
        "flash_price": "12999.00",
        "savings": "2000.00",
        "discount_percentage": 13.33,
        "start_time": "2026-06-16T10:00:00.000000Z",
        "end_time": "2026-06-18T23:59:59.000000Z",
        "remaining_time": 125000,
        "time_until_start": 0,
        "can_buy_before_sale": false,
        "can_buy_after_sale": true,
        "custom_image": "storage/flash_sales/custom_x6.jpg",
        "is_category_scoped": false
    }
}
```

### Frontend Implementation Rules

When rendering a product card or details page, check if `product.flash_sale_data` exists:

1. **Pricing Display**:
   - If `flash_sale_data.is_live === true`, display the `flash_sale_data.flash_price` as the primary price.
   - Cross out the original `product.price` to show the discount.
   - Show a badge with `flash_sale_data.discount_percentage`% OFF.

2. **Countdowns**:
   - If `is_live === false` and `time_until_start > 0`: The sale is **Upcoming**. Display a countdown: "Starts in [time_until_start]".
   - If `is_live === true`: The sale is **Active**. Display a countdown: "Ends in [remaining_time]".

3. **Purchase Controls (Add to Cart / Buy Now buttons)**:
   - **Upcoming Sales**: If `is_live === false` and `time_until_start > 0`:
     - Check `flash_sale_data.can_buy_before_sale`.
     - If `false`, **disable or hide** the "Add to Cart" button and display a message: "Available when sale starts".
   - **Expired Sales**: If `is_live === false` and `time_until_start <= 0` (meaning it ended):
     - Check `flash_sale_data.can_buy_after_sale`.
     - If `false`, **disable or hide** the "Add to Cart" button and display a message: "Sale ended, currently unavailable".
   - **Active Sales**: If `is_live === true`, allow purchases normally.

4. **Images**:
   - If `flash_sale_data.custom_image` is not null, prioritize displaying this image over the product's default `image_url` to show the promotional flash sale graphic.

---

## 2. Flash Sale Endpoints

If you need to fetch metadata about the flash sales themselves (for banner displays, homepage carousels, or dedicated Flash Sale landing pages), use these endpoints:

### Fetch All Flash Sales
`GET /api/flash-sales`
Returns all flash sales that are toggled "Active" in the admin panel, regardless of whether their dates have started yet (useful for "Upcoming Sales" sections).

**Response Structure:**
```json
[
  {
    "id": 1,
    "name": "Summer Mega Sale",
    "description": "Massive summer discounts",
    "start_time": "2026-06-16T10:00:00.000000Z",
    "end_time": "2026-06-18T23:59:59.000000Z",
    "is_active": true,
    "scope": "product",
    "can_buy_before_sale": false,
    "can_buy_after_sale": true
  }
]
```

### Fetch Only Live Flash Sales
`GET /api/flash-sales/active`
Returns only flash sales where the current time is strictly between `start_time` and `end_time`.

**Response Structure:**
```json
[
  {
    "id": 1,
    "name": "Summer Mega Sale",
    "description": "Massive summer discounts",
    "start_time": "2026-06-16T10:00:00.000000Z",
    "end_time": "2026-06-18T23:59:59.000000Z",
    "is_active": true,
    "scope": "product",
    "can_buy_before_sale": false,
    "can_buy_after_sale": true,
    "products": [
      {
        "id": 15,
        "name": "Poco X6 Neo 5G",
        "slug": "poco-x6-neo-5g",
        "image_url": "/storage/products/poco.jpg",
        "pivot": {
          "flash_price": "12999.00",
          "max_quantity_per_customer": 2,
          "total_quantity_limit": 100,
          "sold_quantity": 0,
          "is_active": 1,
          "custom_image": "storage/flash_sales/custom_x6.jpg"
        }
      }
    ],
    "categories": [
      {
        "id": 3,
        "name": "Electronics",
        "slug": "electronics",
        "image_url": "/storage/categories/electronics.jpg",
        "pivot": {
          "discount_percentage": 20,
          "max_quantity_per_customer": 5,
          "total_quantity_limit": 500,
          "custom_image": "storage/flash_sales/cat_electronics.jpg"
        }
      }
    ]
  }
]
```

### Fetch Products for a Specific Flash Sale Page
`GET /api/products/flash-sale`
Returns a paginated list of all products currently on an active flash sale. 
*(Note: Products returned here will already have their root `price` overridden by the backend to the flash price, and they will also include the `flash_sale_data` object).*

**Response Structure:**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 15,
      "name": "Poco X6 Neo 5G",
      "price": "12999.00", // Overridden to Flash Price
      "flash_sale_data": {
        "is_live": true,
        "flash_price": "12999.00",
        "savings": "2000.00",
        "discount_percentage": 13.33,
        ...
      }
    }
  ],
  "total": 50,
  "last_page": 3
}
```
---

## 3. Category Inheritance Note

The backend fully supports nested categories. If the admin puts the "Electronics" category on Flash Sale, all products inside the "Smartphones" child category will automatically receive the `flash_sale_data` object with perfectly calculated prices based on the admin's percentage discount. 

The frontend team does **not** need to handle category trees or calculate percentage math—just use the `flash_price` provided in the API!
