# Detailed Bug Report: Stock Discrepancy & Order Validation Bug

## 1. Bug Overview
Users are still able to order/book products on the main website even when the Admin Dashboard displays **`Remaining: 0`**. 

* **Symptoms:**
  * Admin dashboard shows stock as `0`.
  * Customer-facing website shows stock as `3`.
  * Checkout/Order placement API allows the order to go through without validation or throwing an out-of-stock error.

---

## 2. Root Cause Analysis

### A. Discrepancy in Stock Calculation
The stock calculation is inconsistent between the Admin Dashboard and the Customer Website API.

1. **Admin Dashboard (Shows `0`):**
   In `app/Http/Controllers/Admin/ProductController.php`, the dashboard dynamically calculates `online_remaining` stock by summing quantities in the `seller_stocks` table, filtering **only** for sellers who are active, approved, and selling online:
   ```php
   'online_remaining' => \App\Models\SellerStock::selectRaw('IFNULL(SUM(seller_stocks.quantity), 0)')
       ->join('sellers', 'seller_stocks.seller_id', '=', 'sellers.id')
       ->whereColumn('seller_stocks.product_id', 'products.id')
       ->where('sellers.wants_to_sell_online', true)
       ->where('sellers.status', '!=', 'suspended')
   ```
   If a seller is suspended (e.g. Seller ID 9) or is not selling online, their stock is correctly excluded. Hence, the admin panel displays `Remaining: 0`.

2. **Customer Website / API (Shows `3`):**
   The API endpoint `GET /api/products/{slug}` in `app/Http/Controllers/Api/ProductController.php` reads the static `stock_quantity` column directly from the `products` table:
   ```php
   'stock_quantity' => $product->stock_quantity,
   'is_out_of_stock' => $product->stock_quantity <= 0,
   ```
   Since the `products.stock_quantity` column in the database holds the value `3`, the customer website displays the product as in stock.

3. **Why `products.stock_quantity` remains `3`:**
   In `app/Models/Product.php`, `updateStockFromSellers()` calculates product stock. However, it preserves any manually added "direct stock":
   ```php
   // Calculate direct stock (stock not from sellers)
   $directStock = max(0, $currentStock - $sellerStockSum);

   // New total = preserved direct stock + seller stock sum
   $newTotal = $directStock + $sellerStockSum;
   ```
   When a seller is suspended, `$sellerStockSum` drops to `0`. However, the fallback logic `max(0, 3 - 0)` interprets the difference as `3` units of "direct stock", which keeps the total `stock_quantity` at `3`.

---

### B. Lack of Stock Validation at Checkout
The order placement API endpoint (`POST /api/orders`) does **not** validate product stock availability.

In `app/Http/Controllers/Api/OrderController.php` (lines 114–130), the checkout process only verifies:
* Product is active.
* Cash on Delivery (COD) is allowed (if selected).
* Minimum and maximum order quantity constraints.

It completely misses checking:
```php
if ($product->stock_quantity <= 0) { ... }
```
As a result, even if the database `stock_quantity` was `0`, the API would still let the customer purchase the product.

---

### C. Stock Reservation Logic (COD & Pending Orders)
Currently, in `app/Models/Order.php`, stock decrement only triggers when the payment status transitions to `'paid'`:
```php
static::updating(function ($order) {
    if ($order->isDirty('payment_status') && $order->payment_status === 'paid') {
        $order->reduceStock();
    }
});
```
This means Cash on Delivery (COD) or pending online orders **do not reserve stock when placed**. Multiple users can place orders simultaneously for the same item, leading to severe overselling.

---

## 3. How to Fix (Action Plan for API Team)

### Step 1: Align `updateStockFromSellers` with Online Selling Rules
Update the stock sum query in `app/Models/Product.php` to exclude suspended and offline sellers. Additionally, fix the fallback logic so that suspended seller stock does not incorrectly get converted to "direct stock."

* **Option A: If Direct Stock is not used (All stock comes from sellers):**
  Simply set the product stock directly to the active seller stock sum:
  ```php
  public function updateStockFromSellers()
  {
      $sellerStockSum = SellerStock::where('product_id', $this->id)
          ->whereHas('seller', function($query) {
              $query->where('status', 'approved')
                    ->where('wants_to_sell_online', true)
                    ->where('status', '!=', 'suspended');
          })
          ->sum('quantity');
      
      $this->stock_quantity = $sellerStockSum;
      $this->save();
  }
  ```

* **Option B: If Direct Stock is required:**
  Store "direct stock" in a dedicated database column (e.g., `direct_stock_quantity`) or assign it to a "System/Admin" seller ID in the `seller_stocks` table, rather than calculating it dynamically on the fly.

---

### Step 2: Implement Stock Check in Order Placement API
Add a validation step in `app/Http/Controllers/Api/OrderController.php` during order creation.

```php
// In OrderController.php -> store()
foreach ($items as $item) {
    $product = $products->get($item['product_id']);
    $quantity = (int) $item['quantity'];

    // 1. Check if product is out of stock
    if ($product->stock_quantity <= 0) {
        throw new \Exception("Product '{$product->name}' is currently out of stock.");
    }

    // 2. Check if requested quantity exceeds available stock
    if ($product->stock_quantity < $quantity) {
        throw new \Exception("Only {$product->stock_quantity} units of '{$product->name}' are available.");
    }
    
    // ... existing validations (active, cod, min/max qty)
}
```

---

### Step 3: Reserve Stock at Order Placement (Pending / COD)
Rather than waiting for payment status to become `'paid'`, reserve the stock immediately when the order is created, and restore it if the order is cancelled or payment fails.

1. **In `app/Http/Controllers/Api/OrderController.php` (during `store()`):**
   Reduce the product stock immediately inside the database transaction:
   ```php
   // Inside the order items creation loop
   $product->decrement('stock_quantity', $quantity);
   ```

2. **In `app/Models/Order.php` (handle cancellations/failures):**
   Adjust the boot/updating method to restore stock when an order is cancelled:
   ```php
   static::updating(function ($order) {
       // If status changes to 'cancelled', restore the stock
       if ($order->isDirty('status') && $order->status === 'cancelled') {
           $order->restoreStock();
       }
   });
   ```
