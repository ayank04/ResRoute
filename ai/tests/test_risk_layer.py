import unittest
from ai.risk_engine import RiskEngine
from ai.segment_annotator import annotate_segments
from ai.disruption_detector import DisruptionDetector

class TestRiskLayer(unittest.TestCase):

    def test_high_traffic_bad_weather(self):
        # High traffic + bad weather -> risk > 0.7
        route = {
            "duration": 4000, 
            "static_duration": 2000, # 100% delay = 1.0 traffic score
            "segments": []
        }
        weather = {"condition": "Thunderstorm"} # 0.9 weather score
        incidents = [] # 0.0 incident score
        
        # Risk = 0.5*1.0 + 0.3*0.9 + 0.2*0.0 = 0.5 + 0.27 = 0.77
        res = RiskEngine.compute_route_risk(route, weather, incidents)
        self.assertGreater(res["risk_score"], 0.7)

    def test_no_delay_clear_weather(self):
        # No delay + clear weather -> risk < 0.2
        route = {
            "duration": 2000, 
            "static_duration": 2000, # 0 delay
            "segments": []
        }
        weather = {"condition": "Clear"}
        incidents = [{"severity": "MINOR"}] # Some minor incident to just check
        
        # Risk = 0.5*0 + 0.3*0 + 0.2*0.1 = 0.02
        res = RiskEngine.compute_route_risk(route, weather, incidents)
        self.assertLess(res["risk_score"], 0.2)

    def test_multiple_severe_incidents(self):
        # Multiple severe incidents -> risk approaches 1
        route = {
            "duration": 3000, 
            "static_duration": 1500 # traffic score 1.0
        }
        weather = {"condition": "Snow"} # weather score 0.9
        incidents = [
            {"severity": "SEVERE"},
            {"severity": "SEVERE"}
        ] # incident score 1.4 -> clipped to 1.0
        
        # Risk = 0.5*1.0 + 0.3*0.9 + 0.2*1.0 = 0.5 + 0.27 + 0.2 = 0.97
        res = RiskEngine.compute_route_risk(route, weather, incidents)
        self.assertAlmostEqual(res["risk_score"], 0.97)
        self.assertEqual(res["breakdown"]["incident"], 1.0)
        
    def test_segment_annotation(self):
        route = {
            "segments": [
                {"start": {"lat": 1, "lng": 1}, "end": {"lat": 2, "lng": 2}, "traffic_factor": 0.5},
                {"start": {"lat": 2, "lng": 2}, "end": {"lat": 3, "lng": 3}, "traffic_factor": 1.5},
                {"start": {"lat": 3, "lng": 3}, "end": {"lat": 4, "lng": 4}, "traffic_factor": 1.0}
            ]
        }
        # Given a base risk of 0.5
        annotated = annotate_segments(route, 0.5)
        
        self.assertEqual(len(annotated), 3)
        
        # Seg 1: 0.5 * 0.5 = 0.25 (<0.3 -> LOW)
        self.assertEqual(annotated[0]["risk_level"], "LOW")
        self.assertEqual(annotated[0]["risk_score"], 0.25)
        
        # Seg 2: 0.5 * 1.5 = 0.75 (>0.6 -> HIGH)
        self.assertEqual(annotated[1]["risk_level"], "HIGH")
        self.assertEqual(annotated[1]["risk_score"], 0.75)
        
        # Seg 3: 0.5 * 1.0 = 0.5 (MEDIUM)
        self.assertEqual(annotated[2]["risk_level"], "MEDIUM")
        self.assertEqual(annotated[2]["risk_score"], 0.5)
        
    def test_disruption_detector_structured(self):
        data = {
            "traffic_delay_pct": 0.5, # > 0.4 -> jam
            "weather_code": 600,      # >= 500 -> rain
            "incident_count": 2       # > 0 -> incidents
        }
        res = DisruptionDetector.detect_structured(data)
        self.assertIn("traffic_jam", res["flags"])
        self.assertIn("rain", res["flags"])
        self.assertIn("incidents", res["flags"])
        # Risk hint: 0.3 + 0.4 + 0.3 = 1.0
        self.assertEqual(res["risk_hint"], 1.0)

    def test_disruption_detector_unstructured(self):
        # Massive accident text
        text = "Massive accident near Silk Board"
        res = DisruptionDetector.detect_unstructured(text)
        self.assertEqual(res["location"], "Silk Board")
        self.assertEqual(res["severity"], "CRITICAL")
        self.assertEqual(res["estimated_delay_minutes"], 45)

if __name__ == '__main__':
    unittest.main()
