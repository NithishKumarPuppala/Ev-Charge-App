from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import razorpay


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay client (using test credentials)
razorpay_client = razorpay.Client(auth=("rzp_test_1234567890", "test_secret_key"))

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class PaymentOrderCreate(BaseModel):
    station_id: str
    amount: int  # Amount in paise
    currency: str = "INR"

class PaymentOrder(BaseModel):
    order_id: str
    station_id: str
    amount: int
    currency: str
    status: str
    created_at: datetime

class PaymentComplete(BaseModel):
    order_id: str
    payment_id: str
    status: str
    station_id: str
    amount: int

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    station_id: str
    amount: int
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    payment_id: Optional[str] = None
    order_id: Optional[str] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "EV ChargeNow API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Payment endpoints
@api_router.post("/payment/create-order")
async def create_payment_order(order_data: PaymentOrderCreate):
    try:
        # For demo purposes, we'll create a mock order
        # In production, this would use actual Razorpay API
        order_id = f"order_{uuid.uuid4().hex[:12]}"
        
        # Create payment order record
        payment_order = PaymentOrder(
            order_id=order_id,
            station_id=order_data.station_id,
            amount=order_data.amount,
            currency=order_data.currency,
            status="created",
            created_at=datetime.utcnow()
        )
        
        # Store in database
        await db.payment_orders.insert_one(payment_order.dict())
        
        return {
            "order_id": order_id,
            "amount": order_data.amount,
            "currency": order_data.currency,
            "status": "created"
        }
        
    except Exception as e:
        logging.error(f"Error creating payment order: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")

@api_router.post("/payment/complete")
async def complete_payment(payment_data: PaymentComplete):
    try:
        # Create transaction record
        transaction = Transaction(
            station_id=payment_data.station_id,
            amount=payment_data.amount,
            status=payment_data.status,
            payment_id=payment_data.payment_id,
            order_id=payment_data.order_id
        )
        
        # Store transaction in database
        result = await db.transactions.insert_one(transaction.dict())
        
        # Update payment order status
        await db.payment_orders.update_one(
            {"order_id": payment_data.order_id},
            {"$set": {"status": "completed"}}
        )
        
        return {
            "transaction_id": transaction.id,
            "payment_id": payment_data.payment_id,
            "status": "success"
        }
        
    except Exception as e:
        logging.error(f"Error completing payment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to complete payment")

# Transaction endpoints
@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions():
    try:
        transactions = await db.transactions.find().sort("timestamp", -1).to_list(100)
        return [Transaction(**transaction) for transaction in transactions]
    except Exception as e:
        logging.error(f"Error fetching transactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")

@api_router.get("/transactions/recent", response_model=List[Transaction])
async def get_recent_transactions():
    try:
        transactions = await db.transactions.find().sort("timestamp", -1).limit(3).to_list(3)
        return [Transaction(**transaction) for transaction in transactions]
    except Exception as e:
        logging.error(f"Error fetching recent transactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch recent transactions")

@api_router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str):
    try:
        transaction = await db.transactions.find_one({"id": transaction_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return Transaction(**transaction)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching transaction: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch transaction")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
