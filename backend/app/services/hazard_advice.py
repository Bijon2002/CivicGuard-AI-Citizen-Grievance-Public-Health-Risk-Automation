from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class HazardAdvice:
    hazard_type: str
    display_name: str
    incident_report: str
    potential_problems: list[str]
    how_to_overcome: list[str]
    prevention_tips: list[str]
    emergency_note: str


DEFAULT_ADVICE = HazardAdvice(
    hazard_type="general_hazard",
    display_name="General Hazard",
    incident_report="A safety risk has been detected and should be reviewed by the responsible team.",
    potential_problems=["Possible injuries", "Property damage", "Blocked access for emergency teams"],
    how_to_overcome=["Keep people away from the hazard", "Inform the relevant authority", "Monitor the area until it is safe"],
    prevention_tips=["Inspect the area regularly", "Report warning signs early", "Follow official safety instructions"],
    emergency_note="If people are in danger, call emergency services immediately and keep the area clear.",
)


def _advice(
    hazard_type: str,
    display_name: str,
    incident_report: str,
    potential_problems: list[str],
    how_to_overcome: list[str],
    prevention_tips: list[str],
    emergency_note: str,
) -> HazardAdvice:
    return HazardAdvice(
        hazard_type=hazard_type,
        display_name=display_name,
        incident_report=incident_report,
        potential_problems=potential_problems,
        how_to_overcome=how_to_overcome,
        prevention_tips=prevention_tips,
        emergency_note=emergency_note,
    )


_HAZARD_ADVICE: dict[str, HazardAdvice] = {
    "water_logging": _advice(
        "water_logging",
        "Flood / Waterlogging",
        "Roads may be submerged, drains can overflow, and homes or shops may be cut off by standing water.",
        ["Vehicle accidents", "Waterborne diseases", "Electrical hazards", "Property damage", "Blocked emergency access"],
        ["Move people to higher ground", "Switch off electricity if water is entering the area", "Avoid walking or driving through flood water", "Report blocked drains and damaged embankments"],
        ["Keep drainage channels clear", "Store important items above floor level", "Prepare an emergency kit", "Monitor weather alerts"],
        "If water is rising quickly, leave immediately and contact emergency services.",
    ),
    "heavy_rain": _advice(
        "heavy_rain",
        "Heavy Rain",
        "Heavy rainfall can cause waterlogging, poor visibility, slippery roads, and overflowing drains.",
        ["Road accidents", "Pedestrian injuries", "Localized flooding", "Traffic congestion"],
        ["Slow down and avoid unnecessary travel", "Use headlights and keep distance between vehicles", "Clear drains before water builds up", "Stay away from slopes that may fail"],
        ["Check weather warnings before travel", "Keep drains and gutters clean", "Park away from low-lying spots", "Report repeated overflow points"],
        "If conditions worsen, stay indoors until authorities say the roads are safe.",
    ),
    "road_damage": _advice(
        "road_damage",
        "Damaged Road",
        "The road surface may be cracked, uneven, or collapsing in sections.",
        ["Vehicle accidents", "Motorcycle falls", "Injuries", "Traffic disruption", "Vehicle damage"],
        ["Cordon off the damaged section", "Warn drivers with visible signage", "Send a repair crew quickly", "Reroute traffic until the surface is safe"],
        ["Inspect roads after rain and heavy traffic", "Repair cracks early", "Mark hazards immediately", "Keep heavy vehicles away from weak edges"],
        "If the road is sinking or opening up, stop traffic and call the road authority immediately.",
    ),
    "large_pothole": _advice(
        "large_pothole",
        "Large Pothole",
        "A deep pothole can suddenly damage tyres or cause drivers to lose control.",
        ["Accidents", "Motorcycle crashes", "Suspension or tyre damage"],
        ["Mark the pothole clearly", "Reduce speed in the area", "Schedule urgent filling and resurfacing", "Share the location with the road team"],
        ["Patch potholes early", "Improve drainage around the road edge", "Inspect after rain", "Use reflective warning markers"],
        "If the pothole is deep enough to trap a wheel, block the lane until repair work is done.",
    ),
    "tree_fallen_on_road": _advice(
        "tree_fallen_on_road",
        "Tree Fallen on Road",
        "The road may be blocked and power lines nearby could also be damaged.",
        ["Vehicle accidents", "Emergency delays", "Traffic congestion", "Electrical hazards"],
        ["Keep vehicles and pedestrians away", "Check for live wires before approaching", "Clear the road with trained crews", "Alert utility services if lines are involved"],
        ["Trim weak branches before storms", "Inspect roadside trees regularly", "Keep emergency saw teams ready", "Avoid parking under unhealthy trees"],
        "Treat any fallen tree as a hazard until utility and road crews confirm it is safe.",
    ),
    "tree_at_risk_of_falling": _advice(
        "tree_at_risk_of_falling",
        "Tree at Risk of Falling",
        "A leaning or weak tree could fall onto a road, building, or power line.",
        ["Vehicle damage", "Property damage", "Injuries", "Power-line damage"],
        ["Fence off the danger zone", "Remove dead limbs early", "Call arboriculture or local maintenance teams", "Keep people out of the drop zone"],
        ["Inspect trees after strong wind and rain", "Prune unstable limbs", "Monitor cracks at the base", "Do not let people gather under the tree"],
        "If the tree is already leaning heavily, evacuate the area before attempting removal.",
    ),
    "building_collapse": _advice(
        "building_collapse",
        "Building Collapse / Structural Damage",
        "Debris, unstable walls, or a partial collapse can block roads and entrances.",
        ["Injuries", "Fatalities", "Blocked access for rescue teams", "Road blockage"],
        ["Keep everyone away from the structure", "Call emergency response teams", "Do not enter until engineers inspect it", "Mark the area as unsafe"],
        ["Inspect old buildings regularly", "Repair cracks before they spread", "Follow construction safety standards", "Remove loose debris after storms"],
        "If the structure is moving, cracking, or leaning, evacuate immediately.",
    ),
    "fire": _advice(
        "fire",
        "Fire",
        "Smoke, heat, and falling debris can make the area unsafe and block access routes.",
        ["Respiratory problems", "Burns and injuries", "Property destruction", "Delayed emergency response"],
        ["Call the fire service immediately", "Move people away from smoke and flames", "Turn off gas and power if safe to do so", "Do not re-enter the building until cleared"],
        ["Install alarms and extinguishers", "Keep exits clear", "Store flammables safely", "Train staff and residents on evacuation"],
        "If the fire is spreading, evacuate first and do not try to fight it alone.",
    ),
    "burst_water_pipe": _advice(
        "burst_water_pipe",
        "Burst Water Pipe",
        "A burst pipe can flood roads, erode soil, and disrupt the water supply.",
        ["Road accidents", "Road collapse", "Water supply disruption"],
        ["Shut off the affected valve if possible", "Mark the flooded section", "Send maintenance crews to isolate the leak", "Check nearby road edges for erosion"],
        ["Inspect pipes regularly", "Replace corroded sections early", "Protect buried infrastructure", "Monitor pressure changes"],
        "If the leak is undermining the road surface, stop traffic until repairs are complete.",
    ),
    "blocked_drainage": _advice(
        "blocked_drainage",
        "Blocked Drainage",
        "Standing water and overflowing drains may quickly create local flooding.",
        ["Disease risk", "Pedestrian problems", "Traffic disruption"],
        ["Clear the obstruction quickly", "Pump out standing water where needed", "Inspect the downstream channel", "Warn pedestrians and drivers"],
        ["Clean drains before the rainy season", "Remove litter and sediment regularly", "Report chronic overflow points", "Keep road inlets free of waste"],
        "Blocked drains can turn into flooding fast, so treat repeat complaints as urgent.",
    ),
    "illegal_waste_dumping": _advice(
        "illegal_waste_dumping",
        "Illegal Waste Dumping",
        "Dumped waste can block drains, create bad smells, and attract pests.",
        ["Disease or vector risk", "Flooding", "Environmental pollution"],
        ["Remove the waste safely", "Identify the dumping point for enforcement", "Disinfect the area if required", "Keep drains clear while cleanup happens"],
        ["Provide proper disposal points", "Increase inspections", "Use signage and penalties", "Educate residents on waste separation"],
        "If hazardous waste is present, use protective gear and escalate to the proper environmental team.",
    ),
    "fallen_power_line": _advice(
        "fallen_power_line",
        "Fallen Power Line",
        "Live wires on the ground can cause electrocution, fire, and major access restrictions.",
        ["Electrocution", "Fire", "Accidents", "Public access restrictions"],
        ["Keep everyone far away", "Do not touch the wire or anything it is touching", "Call the utility company and emergency services", "Secure the road until power is isolated"],
        ["Trim trees away from lines", "Inspect poles after storms", "Report sparking or sagging wires early", "Train staff to stay clear of downed lines"],
        "Treat every downed wire as live until the utility company confirms otherwise.",
    ),
    "damaged_building": _advice(
        "damaged_building",
        "Damaged Building",
        "Cracks, unstable walls, or a weakened roof may lead to falling debris or collapse.",
        ["Injuries", "Structural collapse", "Pedestrian danger"],
        ["Keep the perimeter clear", "Do not allow occupancy until inspected", "Remove loose debris carefully", "Send a structural assessment team"],
        ["Inspect after heavy rain or earthquakes", "Repair cracks early", "Watch for water seepage", "Keep heavy loads away from weak floors"],
        "If the building is shifting or shedding debris, evacuate the area immediately.",
    ),
    "traffic_signal_failure": _advice(
        "traffic_signal_failure",
        "Traffic Signal Failure",
        "Conflicting traffic movements at an intersection can quickly cause collisions.",
        ["Vehicle collisions", "Pedestrian accidents", "Traffic congestion"],
        ["Deploy traffic police or temporary signage", "Switch drivers to manual right-of-way control", "Fix the electrical or controller fault", "Warn pedestrians to cross carefully"],
        ["Inspect signal power and backups regularly", "Maintain controllers and wiring", "Keep a repair contact list ready", "Test failover settings"],
        "If the junction is busy, provide manual control until the signal is repaired.",
    ),
    "smoke_air_pollution": _advice(
        "smoke_air_pollution",
        "Smoke / Severe Air Pollution",
        "Poor air quality and reduced visibility can make outdoor movement unsafe.",
        ["Respiratory problems", "Accidents", "Reduced outdoor safety"],
        ["Limit outdoor exposure", "Use masks if evacuation is unavoidable", "Identify and stop the smoke source where possible", "Help vulnerable people move indoors"],
        ["Monitor air quality alerts", "Control open burning", "Keep indoor ventilation ready", "Protect children and elderly residents"],
        "If breathing becomes difficult, seek medical help and move to cleaner air immediately.",
    ),
    "stray_animals_on_road": _advice(
        "stray_animals_on_road",
        "Stray Animals on Road",
        "Animals moving through traffic lanes can create sudden hazards for drivers and riders.",
        ["Vehicle collisions", "Motorcycle accidents", "Traffic disruption"],
        ["Slow traffic near the animal", "Guide the animal away safely if trained to do so", "Contact animal control or local authorities", "Avoid loud chasing that may panic the animal"],
        ["Fence feeding points where possible", "Use signage in known hotspots", "Work with local animal control teams", "Keep garbage secured"],
        "Do not try to grab or corner a frightened animal without support.",
    ),
    "large_animal_on_road": _advice(
        "large_animal_on_road",
        "Large Animal on Road",
        "A large animal can block the lane and cause severe collisions.",
        ["Serious collisions", "Injuries", "Traffic blockage"],
        ["Stop traffic around the animal", "Contact animal control immediately", "Use barriers to redirect vehicles", "Keep people away from the animal's path"],
        ["Secure roadside grazing areas", "Use reflective warning signs", "Coordinate with animal owners", "Inspect known crossing routes"],
        "Large animals should only be moved by trained responders.",
    ),
    "coastal_flooding": _advice(
        "coastal_flooding",
        "Coastal Flooding / Storm Surge",
        "Coastal roads and buildings can be inundated by seawater and evacuation may become difficult.",
        ["Property damage", "Road accidents", "Water contamination", "Evacuation difficulties"],
        ["Move people inland quickly", "Warn boats and coastal users", "Protect important documents and power equipment", "Monitor tide and storm alerts"],
        ["Prepare coastal evacuation routes", "Use barriers where appropriate", "Keep emergency kits ready", "Avoid low-lying beachfront parking"],
        "If a storm surge warning is issued, evacuate early instead of waiting for flooding.",
    ),
    "landslide": _advice(
        "landslide",
        "Landslide",
        "Soil and rocks can block roads, damage infrastructure, and trap vehicles.",
        ["Vehicle accidents", "Road closure", "Injuries", "Emergency access disruption"],
        ["Close the road immediately", "Keep people away from the slope", "Check for trapped persons and call rescue teams", "Watch for more slope movement"],
        ["Monitor unstable slopes after rain", "Improve drainage on hillsides", "Restrict construction near weak slopes", "Use slope stabilisation where needed"],
        "If the slope is still moving, do not stand beneath it or attempt to clear it alone.",
    ),
    "rockfall": _advice(
        "rockfall",
        "Rockfall",
        "Rocks or debris may fall onto the road without warning.",
        ["Vehicle collisions", "Injuries", "Road blockage"],
        ["Stop traffic near the danger zone", "Clear loose material with trained crews", "Inspect the cliff or embankment", "Warn drivers well before the hazard"],
        ["Check slopes after heavy rain", "Install rockfall nets where required", "Mark dangerous sections clearly", "Monitor cracks and loose stones"],
        "If rocks are still falling, keep everyone away until the slope is stable.",
    ),
    "strong_wind": _advice(
        "strong_wind",
        "Strong Wind",
        "Strong wind can blow down trees, signs, and loose debris.",
        ["Injuries", "Vehicle accidents", "Power disruption"],
        ["Secure loose objects", "Avoid parking under trees or signs", "Keep people away from unsafe structures", "Prepare for temporary power cuts"],
        ["Prune weak branches", "Fasten roof materials", "Remove loose site debris", "Check warnings before outdoor work"],
        "If wind is strong enough to move objects, delay outdoor work and travel when possible.",
    ),
    "high_waves": _advice(
        "high_waves",
        "High Waves",
        "Powerful waves can damage coastal infrastructure and make travel unsafe.",
        ["Infrastructure damage", "Road damage", "Injuries"],
        ["Keep people away from the shoreline", "Close vulnerable coastal access points", "Move equipment above wave reach", "Follow marine safety warnings"],
        ["Respect tide and surf alerts", "Protect sea-facing assets", "Use coastal barriers where available", "Plan alternate routes during storm periods"],
        "Do not stand on exposed coastal roads or rocks when wave warnings are active.",
    ),
    "stagnant_water": _advice(
        "stagnant_water",
        "Stagnant Water",
        "Standing water can become a mosquito breeding site and point to poor drainage.",
        ["Increased vector-borne disease risk", "Bad sanitation", "Slippery walking surfaces"],
        ["Drain or treat the standing water", "Inspect nearby drains for blockage", "Apply mosquito control where needed", "Warn residents about exposure"],
        ["Remove water collection points quickly", "Improve local drainage", "Cover stored water properly", "Check after every rain"],
        "Persistent standing water should be removed quickly to reduce disease risk.",
    ),
    "rodent_infestation": _advice(
        "rodent_infestation",
        "Rodent Infestation",
        "Rodents can contaminate food, damage property, and spread disease.",
        ["Disease transmission", "Sanitation problems", "Infrastructure damage"],
        ["Seal entry points", "Remove food sources and waste", "Use safe pest control measures", "Inspect storage and drains"],
        ["Keep waste bins closed", "Store food securely", "Clean up clutter", "Schedule regular pest inspections"],
        "If the infestation is large, coordinate cleanup and pest control together.",
    ),
    "chemical_spill": _advice(
        "chemical_spill",
        "Chemical Spill",
        "Toxic material may threaten people, water, soil, and nearby buildings.",
        ["Exposure risk", "Water or soil contamination", "Evacuation need"],
        ["Keep people away immediately", "Do not touch or wash the spill without guidance", "Call trained hazmat or emergency responders", "Isolate drains and runoff channels"],
        ["Store chemicals safely", "Label containers clearly", "Train staff on spill response", "Keep spill kits available"],
        "If fumes or burns are present, evacuate and call emergency services immediately.",
    ),
    "road_construction_hazard": _advice(
        "road_construction_hazard",
        "Road Construction Hazard",
        "Open trenches, barriers, and uneven surfaces can create a temporary traffic and pedestrian hazard.",
        ["Vehicle accidents", "Pedestrian injuries", "Traffic congestion"],
        ["Mark the work zone clearly", "Provide alternate routes", "Cover open trenches where required", "Keep night-time lighting visible"],
        ["Follow construction safety plans", "Inspect barriers daily", "Separate pedestrians from traffic", "Post contact numbers for the site team"],
        "If the site has open excavation, do not allow public access without barriers and warning signs.",
    ),
    "sewage_overflow": _advice(
        "sewage_overflow",
        "Sewage Overflow",
        "Overflowing sewage can contaminate roads and nearby homes and quickly become a health hazard.",
        ["Disease spread", "Bad odour", "Water contamination", "Blocked access"],
        ["Isolate the area", "Repair the sewer blockage or break", "Disinfect surfaces after cleanup", "Keep people away from the overflow"],
        ["Inspect sewers regularly", "Clear grease and debris early", "Report recurring overflow points", "Keep stormwater separate where possible"],
        "Use protective equipment and escalate quickly if sewage is reaching homes or wells.",
    ),
    "blocked_drain": _advice(
        "blocked_drain",
        "Blocked Drain",
        "A blocked drain can quickly turn into local flooding and foul water buildup.",
        ["Standing water", "Flooding", "Disease risk", "Traffic disruption"],
        ["Clear the blockage", "Remove waste from the inlet", "Check the connected drain line", "Warn nearby residents"],
        ["Stop litter entering drains", "Clean grates regularly", "Inspect before the rainy season", "Fix repeated blockages early"],
        "If water is already backing up, send cleanup crews before the road surface weakens.",
    ),
}


_ALIASES = {
    "waterlogging": "water_logging",
    "flood": "water_logging",
    "flooding": "water_logging",
    "storm_surge": "coastal_flooding",
    "coastal_flooding_storm_surge": "coastal_flooding",
    "damaged_road": "road_damage",
    "pothole": "large_pothole",
    "large_potholes": "large_pothole",
    "fallen_tree": "tree_fallen_on_road",
    "leaning_tree": "tree_at_risk_of_falling",
    "tree_falling": "tree_at_risk_of_falling",
    "building_damage": "damaged_building",
    "structural_damage": "building_collapse",
    "pipe_burst": "burst_water_pipe",
    "drainage_blocked": "blocked_drainage",
    "garbage_dump": "illegal_waste_dumping",
    "waste_dumping": "illegal_waste_dumping",
    "live_wire": "fallen_power_line",
    "power_line": "fallen_power_line",
    "signal_failure": "traffic_signal_failure",
    "air_pollution": "smoke_air_pollution",
    "smoke": "smoke_air_pollution",
    "animals_on_road": "stray_animals_on_road",
    "landslide_risk": "landslide",
    "wind_damage": "strong_wind",
    "chemical_spill": "chemical_spill",
    "construction_hazard": "road_construction_hazard",
    "blocked_drainage": "blocked_drainage",
    "sewage_overflow": "sewage_overflow",
}


def normalise_hazard_type(hazard_type: str) -> str:
    return hazard_type.strip().lower().replace(" ", "_").replace("-", "_").replace("/", "_")


def get_hazard_advice(hazard_type: str) -> HazardAdvice:
    key = normalise_hazard_type(hazard_type)
    key = _ALIASES.get(key, key)
    return _HAZARD_ADVICE.get(key, DEFAULT_ADVICE)
