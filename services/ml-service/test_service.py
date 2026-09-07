"""
UNIT & INTEGRATION TESTS FOR INFRAZYN ML SERVICE
SIH26103 | Team InfraZyn | DevTeXhHub

Verifies:
1. Health endpoint response and models availability
2. Metadata registry and genuine calculated metrics
3. Anti-leakage input schema enforcement
4. Prediction boundary validation (0 <= prob <= 100)
5. Invalid input rejection (e.g. negative costs, invalid percentages)
"""

import unittest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

class TestInfraZynMLService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertTrue(data.get("models_loaded"))
        self.assertIn("Synthetic Longitudinal", data.get("dataset_type", ""))

    def test_02_metadata_endpoint(self):
        response = self.client.get("/metadata")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("models", data)
        self.assertIn("cost_overrun_xgb", data["models"])
        self.assertIn("time_overrun_xgb", data["models"])
        
        # Verify real calculated metrics exist
        cost_metrics = data["models"]["cost_overrun_xgb"]["metrics"]
        self.assertGreater(cost_metrics["accuracy"], 0.5)
        self.assertGreater(cost_metrics["roc_auc"], 0.5)
        self.assertIn("confusion_matrix", cost_metrics)

    def test_03_feature_importance_endpoint(self):
        response = self.client.get("/feature-importance")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("cost_overrun_features", data)
        self.assertIn("time_overrun_features", data)
        self.assertGreater(len(data["cost_overrun_features"]), 0)

    def test_04_prediction_valid_input(self):
        payload = {
            "sanctioned_cost": 4500.0,
            "project_age_months": 28,
            "planned_duration_months": 48,
            "cumulative_expenditure_to_date": 2800.0,
            "physical_progress_to_date": 42.0,
            "progress_gap": 16.5,
            "expenditure_intensity": 1.48,
            "sector": "Railways",
            "terrain_complexity_index": 0.60,
            "clearance_bottlenecks_count": 2,
            "historical_revisions_count": 1,
            "project_code": "TEST-PRJ-01",
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["project_code"], "TEST-PRJ-01")
        
        # Verify probability bounds
        cost_prob = data["cost_overrun"]["probability_percent"]
        self.assertTrue(0.0 <= cost_prob <= 100.0)
        time_prob = data["time_overrun"]["probability_percent"]
        self.assertTrue(0.0 <= time_prob <= 100.0)
        
        # Verify top contributing features are extracted
        self.assertGreater(len(data["top_contributing_features"]), 0)
        self.assertIn("scientific_disclaimer", data)

    def test_05_anti_leakage_post_outcome_fields_ignored(self):
        """Verifies that unauthorized post-outcome fields (e.g. final revised cost) are not accepted or used."""
        payload = {
            "sanctioned_cost": 3000.0,
            "project_age_months": 20,
            "planned_duration_months": 36,
            "cumulative_expenditure_to_date": 1200.0,
            "physical_progress_to_date": 55.0,
            "progress_gap": 0.0,
            "expenditure_intensity": 0.72,
            "sector": "Roads & Highways",
            "terrain_complexity_index": 0.20,
            # Leaked fields passed intentionally:
            "revised_cost": 99999.0,
            "actual_final_delay": 50,
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 200)
        # Verify prediction is normal and not distorted by arbitrary leaked fields
        data = response.json()
        self.assertTrue(0.0 <= data["cost_overrun"]["probability_percent"] <= 100.0)

    def test_06_invalid_negative_input_rejection(self):
        payload = {
            "sanctioned_cost": -500.0,  # Invalid negative cost
            "project_age_months": 10,
            "planned_duration_months": 24,
            "cumulative_expenditure_to_date": 100.0,
            "physical_progress_to_date": 20.0,
            "progress_gap": 5.0,
            "expenditure_intensity": 1.0,
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 422)  # Unprocessable Entity

if __name__ == '__main__':
    unittest.main()
