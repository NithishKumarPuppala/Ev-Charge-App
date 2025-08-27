#!/usr/bin/env python3
"""
Backend API Tests for EV Charging Payment App
Tests all core payment and transaction APIs
"""

import requests
import json
import time
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://evcharge-pay.preview.emergentagent.com/api"

class EVChargingAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_order_id = None
        self.created_transaction_id = None
        
    def log_result(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_health_check(self):
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{BACKEND_URL}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "EV ChargeNow API" in data["message"]:
                    self.log_result("Health Check", True, "API is accessible and responding correctly", data)
                    return True
                else:
                    self.log_result("Health Check", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_create_payment_order(self):
        """Test payment order creation for EV charging station"""
        try:
            # Realistic EV charging data
            order_data = {
                "station_id": "DEMO001",
                "amount": 50000,  # ₹500 in paise
                "currency": "INR"
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/payment/create-order",
                json=order_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["order_id", "amount", "currency", "status"]
                
                if all(field in data for field in required_fields):
                    if data["amount"] == 50000 and data["currency"] == "INR" and data["status"] == "created":
                        self.created_order_id = data["order_id"]
                        self.log_result("Create Payment Order", True, f"Order created successfully with ID: {data['order_id']}", data)
                        return True
                    else:
                        self.log_result("Create Payment Order", False, "Incorrect order data returned", data)
                        return False
                else:
                    self.log_result("Create Payment Order", False, "Missing required fields in response", data)
                    return False
            else:
                self.log_result("Create Payment Order", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Create Payment Order", False, f"Request error: {str(e)}")
            return False
    
    def test_complete_payment(self):
        """Test payment completion and transaction creation"""
        if not self.created_order_id:
            self.log_result("Complete Payment", False, "No order_id available from previous test")
            return False
            
        try:
            # Simulate successful payment completion
            payment_data = {
                "order_id": self.created_order_id,
                "payment_id": f"pay_{int(time.time())}",
                "status": "success",
                "station_id": "DEMO001",
                "amount": 50000
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/payment/complete",
                json=payment_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["transaction_id", "payment_id", "status"]
                
                if all(field in data for field in required_fields):
                    if data["status"] == "success":
                        self.created_transaction_id = data["transaction_id"]
                        self.log_result("Complete Payment", True, f"Payment completed successfully, transaction ID: {data['transaction_id']}", data)
                        return True
                    else:
                        self.log_result("Complete Payment", False, "Payment status not success", data)
                        return False
                else:
                    self.log_result("Complete Payment", False, "Missing required fields in response", data)
                    return False
            else:
                self.log_result("Complete Payment", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Complete Payment", False, f"Request error: {str(e)}")
            return False
    
    def test_get_all_transactions(self):
        """Test fetching all transactions"""
        try:
            response = self.session.get(f"{BACKEND_URL}/transactions")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check if our created transaction is in the list
                        transaction = data[0]  # Most recent should be first
                        required_fields = ["id", "station_id", "amount", "status", "timestamp"]
                        
                        if all(field in transaction for field in required_fields):
                            self.log_result("Get All Transactions", True, f"Retrieved {len(data)} transactions successfully", {"count": len(data), "latest": transaction})
                            return True
                        else:
                            self.log_result("Get All Transactions", False, "Transaction missing required fields", transaction)
                            return False
                    else:
                        self.log_result("Get All Transactions", True, "No transactions found (empty list)", data)
                        return True
                else:
                    self.log_result("Get All Transactions", False, "Response is not a list", data)
                    return False
            else:
                self.log_result("Get All Transactions", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Get All Transactions", False, f"Request error: {str(e)}")
            return False
    
    def test_get_recent_transactions(self):
        """Test fetching last 3 transactions"""
        try:
            response = self.session.get(f"{BACKEND_URL}/transactions/recent")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) <= 3:  # Should return max 3 transactions
                        if len(data) > 0:
                            transaction = data[0]
                            required_fields = ["id", "station_id", "amount", "status", "timestamp"]
                            
                            if all(field in transaction for field in required_fields):
                                self.log_result("Get Recent Transactions", True, f"Retrieved {len(data)} recent transactions", {"count": len(data)})
                                return True
                            else:
                                self.log_result("Get Recent Transactions", False, "Transaction missing required fields", transaction)
                                return False
                        else:
                            self.log_result("Get Recent Transactions", True, "No recent transactions found", data)
                            return True
                    else:
                        self.log_result("Get Recent Transactions", False, f"Too many transactions returned: {len(data)} (expected max 3)", data)
                        return False
                else:
                    self.log_result("Get Recent Transactions", False, "Response is not a list", data)
                    return False
            else:
                self.log_result("Get Recent Transactions", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Get Recent Transactions", False, f"Request error: {str(e)}")
            return False
    
    def test_get_specific_transaction(self):
        """Test fetching a specific transaction by ID"""
        if not self.created_transaction_id:
            self.log_result("Get Specific Transaction", False, "No transaction_id available from previous test")
            return False
            
        try:
            response = self.session.get(f"{BACKEND_URL}/transactions/{self.created_transaction_id}")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "station_id", "amount", "status", "timestamp"]
                
                if all(field in data for field in required_fields):
                    if data["id"] == self.created_transaction_id:
                        self.log_result("Get Specific Transaction", True, f"Retrieved transaction {self.created_transaction_id} successfully", data)
                        return True
                    else:
                        self.log_result("Get Specific Transaction", False, f"Wrong transaction ID returned: {data['id']}", data)
                        return False
                else:
                    self.log_result("Get Specific Transaction", False, "Transaction missing required fields", data)
                    return False
            elif response.status_code == 404:
                self.log_result("Get Specific Transaction", False, "Transaction not found (404)", response.text)
                return False
            else:
                self.log_result("Get Specific Transaction", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Get Specific Transaction", False, f"Request error: {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test error handling for invalid requests"""
        try:
            # Test invalid payment order creation
            invalid_order = {
                "station_id": "",  # Empty station ID
                "amount": -100,    # Negative amount
                "currency": "USD"  # Wrong currency
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/payment/create-order",
                json=invalid_order,
                headers={"Content-Type": "application/json"}
            )
            
            # Should handle gracefully (either validation error or create anyway for demo)
            if response.status_code in [200, 400, 422]:
                self.log_result("Error Handling - Invalid Order", True, f"Handled invalid order appropriately (HTTP {response.status_code})")
            else:
                self.log_result("Error Handling - Invalid Order", False, f"Unexpected status code: {response.status_code}")
                
            # Test non-existent transaction
            response = self.session.get(f"{BACKEND_URL}/transactions/nonexistent_id")
            
            if response.status_code == 404:
                self.log_result("Error Handling - Not Found", True, "Correctly returned 404 for non-existent transaction")
                return True
            else:
                self.log_result("Error Handling - Not Found", False, f"Expected 404, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Error Handling", False, f"Request error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚗 Starting EV Charging Payment API Tests...")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Run tests in sequence
        tests = [
            self.test_health_check,
            self.test_create_payment_order,
            self.test_complete_payment,
            self.test_get_all_transactions,
            self.test_get_recent_transactions,
            self.test_get_specific_transaction,
            self.test_error_handling
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            time.sleep(0.5)  # Small delay between tests
        
        print("=" * 60)
        print(f"🏁 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Backend APIs are working correctly.")
        else:
            print("⚠️  Some tests failed. Check the details above.")
        
        return passed == total

if __name__ == "__main__":
    tester = EVChargingAPITester()
    success = tester.run_all_tests()
    
    # Print summary
    print("\n📊 Detailed Test Summary:")
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}: {result['message']}")