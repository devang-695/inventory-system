from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey,
    DateTime, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Product(Base):
    __tablename__ = "products"

    id                = Column(Integer, primary_key=True, index=True)
    name              = Column(String(255), nullable=False)
    sku               = Column(String(100), nullable=False, unique=True)
    price             = Column(Float, nullable=False)
    quantity_in_stock = Column(Integer, nullable=False, default=0)

    order_items = relationship("OrderItem", back_populates="product")

    __table_args__ = (
        CheckConstraint("price >= 0",             name="ck_product_price_positive"),
        CheckConstraint("quantity_in_stock >= 0", name="ck_product_qty_non_negative"),
    )


class Customer(Base):
    __tablename__ = "customers"

    id        = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email     = Column(String(255), nullable=False, unique=True)
    phone     = Column(String(20), nullable=True)

    orders = relationship("Order", back_populates="customer")


class Order(Base):
    __tablename__ = "orders"

    id           = Column(Integer, primary_key=True, index=True)
    customer_id  = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    customer    = relationship("Customer", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id         = Column(Integer, primary_key=True, index=True)
    order_id   = Column(Integer, ForeignKey("orders.id",   ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    quantity   = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)   # snapshot of price at time of order

    order   = relationship("Order",   back_populates="order_items")
    product = relationship("Product", back_populates="order_items")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_orderitem_qty_positive"),
    )