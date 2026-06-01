from pydantic import BaseModel, EmailStr, Field
from typing import List

class ProductBase(BaseModel):
    name: str
    sku: str
    price: float = Field(gt=0)
    quantity: int = Field(ge=0)

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    class Config: from_attributes = True

class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str

class CustomerResponse(CustomerCreate):
    id: int
    class Config: from_attributes = True

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)

class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: float
    class Config: from_attributes = True