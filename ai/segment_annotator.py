import logging
from hashlib import md5
from typing import Dict, Any, List, Optional
from .constants import SEGMENT_RISK_LEVELS

logger = logging.getLogger(__name__)

class SegmentAnnotator:
    """
    Annotates route segments with risk data. Includes caching to prevent redundant 
    re-calculation unless significant risk shifts occur.
    """
    _cache: Dict[str, Any] = {} # Key: hash(polyline), Value: (last_base_risk, annotated_segments)
    _hits = 0
    _total_calls = 0

    @staticmethod
    def annotate_segments(route: Dict[str, Any], base_risk: float) -> List[Dict[str, Any]]:
        """
        Annotates each segment of a route with risk level and adjusted base_risk.
        Uses a polyline-based cache with a 0.05 sensitivity threshold.
        """
        SegmentAnnotator._total_calls += 1
        
        segments = route.get("segments", [])
        polyline = route.get("polyline", "")
        
        # 1. Polyline Caching
        polyline_hash = md5(polyline.encode()).hexdigest()
        
        if polyline_hash in SegmentAnnotator._cache:
            last_risk, cached_segments = SegmentAnnotator._cache[polyline_hash]
            
            # 2. Only re-annotate if risk data changed significantly (> 0.05)
            if abs(base_risk - last_risk) <= 0.05:
                SegmentAnnotator._hits += 1
                if SegmentAnnotator._total_calls % 10 == 0:
                    hit_ratio = SegmentAnnotator._hits / SegmentAnnotator._total_calls
                    logger.info(f"segment_annotator: cache_hit_ratio={hit_ratio:.2f} (calls={SegmentAnnotator._total_calls})")
                return cached_segments

        # 3. Calculation
        annotated_segments = []
        for seg in segments:
            # Default traffic factor is 1.0
            traffic_factor = seg.get("traffic_factor", 1.0)
            
            # Calculate individual segment risk
            segment_risk = base_risk * traffic_factor
            
            # Clip to [0, 1]
            segment_risk = max(0.0, min(1.0, segment_risk))
            
            # Determine risk level
            if segment_risk < SEGMENT_RISK_LEVELS["LOW"]:
                risk_level = "LOW"
            elif segment_risk > SEGMENT_RISK_LEVELS["HIGH"]:
                risk_level = "HIGH"
            else:
                risk_level = "MEDIUM"
                
            annotated_segments.append({
                "start": seg.get("start", {}),
                "end": seg.get("end", {}),
                "risk_score": round(segment_risk, 4),
                "risk_level": risk_level
            })

        # Update cache
        SegmentAnnotator._cache[polyline_hash] = (base_risk, annotated_segments)
        
        if SegmentAnnotator._total_calls % 10 == 0:
            hit_ratio = SegmentAnnotator._hits / SegmentAnnotator._total_calls
            logger.info(f"segment_annotator: cache_hit_ratio={hit_ratio:.2f} (calls={SegmentAnnotator._total_calls})")
            
        return annotated_segments
