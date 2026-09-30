import unittest

from app.simulation import SimulationEngine


class SimulationTests(unittest.TestCase):
    def setUp(self):
        self.engine = SimulationEngine()

    def test_regression_returns_preliminary_one_and_three_sigma_ranges(self):
        result = self.engine.get_predictions([100, 118, 111, 135, 129, 150], 6)
        self.assertTrue(result["is_preliminary"])
        self.assertEqual(len(result["predictions"]), 6)
        for prediction, low, high, low3, high3 in zip(
            result["predictions"], result["lo"], result["hi"], result["lo3"], result["hi3"]
        ):
            self.assertLessEqual(low, prediction)
            self.assertLessEqual(prediction, high)
            self.assertLessEqual(low3, low)
            self.assertGreaterEqual(high3, high)

    def test_impact_uses_progressive_bill_waste_and_purchase_savings(self):
        baseline = {"purchasesBs": [1000], "energyKWh": [252], "foodWasteKg": [10]}
        scenario = {"purchasesBs": [900], "energyKWh": [200], "foodWasteKg": [9]}
        impact = self.engine.calculate_impact(baseline, scenario)
        self.assertEqual(impact["totalBsSaved"], 183.39)
        self.assertEqual(impact["totalCo2SavedKg"], 29.5)


if __name__ == "__main__":
    unittest.main()