EMISSION_FACTORS = {
  "diesel":   { "car": 0.171, "hgv": 0.900 },
  "petrol":   { "car": 0.192, "hgv": 0.000 },
  "electric": { "car": 0.053, "hgv": 0.000 },
  "cng":      { "car": 0.148, "hgv": 0.000 }
}

def calculate_co2(distance_km: float, fuel_type: str, 
                  vehicle_type: str, load_factor: float = 0.5) -> float:
  """
  Returns kg CO2
  Load factor: 0.0 (empty) to 1.0 (full) — affects logistics by up to 25%
  """
  fuel_type = fuel_type.lower()
  if fuel_type not in EMISSION_FACTORS:
      fuel_type = "petrol"
      
  category = "hgv" if vehicle_type == "logistics" else "car"
  base = EMISSION_FACTORS[fuel_type][category]
  
  # Fallback for 0.0 factors (electric/cng HGVs which might not be in our simple table)
  if base == 0:
      base = 0.05 if fuel_type == "electric" else 0.15
      
  load_multiplier = 1.0 + (0.25 * load_factor) if vehicle_type == "logistics" else 1.0
  return round(distance_km * base * load_multiplier, 3)

def calculate_co2_saved(baseline_km: float, actual_km: float,
                        fuel_type: str, vehicle_type: str) -> float:
  """Calculate difference in CO2 between baseline and actual route"""
  baseline = calculate_co2(baseline_km, fuel_type, vehicle_type)
  actual = calculate_co2(actual_km, fuel_type, vehicle_type)
  return round(baseline - actual, 3)
