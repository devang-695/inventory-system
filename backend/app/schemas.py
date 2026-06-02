from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


# ─── Product ───────────────────────────────────────────────
class ProductBase(BaseModel):
    name:              str
    sku:               str
    price:             float
    quantity_in_stock: int = 0

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v):
        if v < 0:
            raise ValueError("Price must be non-negative")
        return v

    @field_validator("quantity_in_stock")
    @classmethod
    def qty_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError("Quantity cannot be negative")
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name:              Optional[str]   = None
    sku:               Optional[str]   = None
    price:             Optional[float] = None
    quantity_in_stock: Optional[int]   = None


class ProductOut(ProductBase):
    id: int

    model_config = {"from_attributes": True}


# ─── Customer ──────────────────────────────────────────────
class CustomerBase(BaseModel):
    full_name: str
    email:     EmailStr
    phone:     Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    id: int

    model_config = {"from_attributes": True}


# ─── Order ─────────────────────────────────────────────────
class OrderItemCreate(BaseModel):
    product_id: int
    quantity:   int

    @field_validator("quantity")
    @classmethod
    def qty_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be greater than 0")
        return v


class OrderItemOut(BaseModel):
    id:         int
    product_id: int
    quantity:   int
    unit_price: float
    product:    ProductOut

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    customer_id: int
    items:       List[OrderItemCreate]

    @field_validator("items")
    @classmethod
    def items_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("Order must contain at least one item")
        return v


class OrderOut(BaseModel):
    id:           int
    customer_id:  int
    total_amount: float
    created_at:   datetime
    customer:     CustomerOut
    order_items:  List[OrderItemOut]

    model_config = {"from_attributes": True}