from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from .database import engine, Base, get_db
from . import models, schemas

# Initialize Database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory Management API")
@app.get("/")
def root():
    return {
        "status": "healthy",
        "message": "Inventory Management API is live and operational!",
        "documentation": "/docs"
        }

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "https://your-vercel-app.vercel.app"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PRODUCTS ---
@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if db_product:
        raise HTTPException(status_code=400, detail="SKU already exists")
    new_product = models.Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.get("/products", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

# --- CUSTOMERS ---
@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    db_cust = db.query(models.Customer).filter(models.Customer.email == customer.email).first()
    if db_cust:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_cust = models.Customer(**customer.model_dump())
    db.add(new_cust)
    db.commit()
    db.refresh(new_cust)
    return new_cust

@app.get("/customers", response_model=List[schemas.CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).all()

# --- ORDERS & BUSINESS LOGIC ---
@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    # Validate customer
    customer = db.query(models.Customer).filter(models.Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    total_amount = 0.0
    order_items_to_create = []

    # Process items / Transaction check
    for item in order_data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found")
        
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for {product.name}. Available: {product.quantity}"
            )
        
        # Deduct Stock & Increment calculated price
        product.quantity -= item.quantity
        total_amount += float(product.price) * item.quantity
        
        order_items_to_create.append(models.OrderItem(product_id=product.id, quantity=item.quantity))

    # Save complete structural transaction
    new_order = models.Order(customer_id=order_data.customer_id, total_amount=total_amount)
    db.add(new_order)
    db.commit()  # Commits order to get ID
    
    for order_item in order_items_to_create:
        order_item.order_id = new_order.id
        db.add(order_item)
        
    db.commit()
    db.refresh(new_order)
    return new_order

@app.get("/orders", response_model=List[schemas.OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).all()

# --- DASHBOARD METRICS ---
@app.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    low_stock = db.query(models.Product).filter(models.Product.quantity < 5).all()
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": [p.name for p in low_stock]
    }


# --- MISSING PRODUCT SPECIFIC CRUD ---
@app.get("/products/{id}", response_model=schemas.ProductResponse)
def get_product_by_id(id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.put("/products/{id}", response_model=schemas.ProductResponse)
def update_product(id: int, updated_fields: schemas.ProductCreate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Validate unique SKU check on rename actions
    sku_check = db.query(models.Product).filter(models.Product.sku == updated_fields.sku, models.Product.id != id).first()
    if sku_check:
        raise HTTPException(status_code=400, detail="SKU already exists on another item")

    product.name = updated_fields.name
    product.sku = updated_fields.sku
    product.price = updated_fields.price
    product.quantity = updated_fields.quantity
    db.commit()
    db.refresh(product)
    return product

@app.delete("/products/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None


# --- MISSING CUSTOMER SPECIFIC CRUD ---
@app.get("/customers/{id}", response_model=schemas.CustomerResponse)
def get_customer_by_id(id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.delete("/customers/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return None


# --- MISSING ORDER SPECIFIC CRUD ---
@app.get("/orders/{id}", response_model=schemas.OrderResponse)
def get_order_by_id(id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tracking ID not found")
    return order

@app.delete("/orders/{id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_and_delete_order(id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order record not found")
    
    # Business Logic: Restoring original stock balances upon cancellation
    for item in order.items:
        prod = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if prod:
            prod.quantity += item.quantity
            
    db.delete(order)
    db.commit()
    return None