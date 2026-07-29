# Data Plan

The project uses public hazard imagery and a small manual curation pass.

Recommended sources:

- Google Images for blocked drains, stagnant water, sewage overflow, road damage, fallen trees
- Kaggle for flood, drainage, and municipal hazard datasets
- Roboflow Universe for similar public safety image sets

Target structure after curation:

```text
data/
  raw/
    blocked_drain/
    sewage_overflow/
    road_damage/
    fallen_tree/
    water_logging/
  processed/
    train/
    val/
    test/
```

Label guide:

- mild: small potholes, minor obstruction, limited standing water
- moderate: visible blockage, drainage backup, partial overflow
- severe: large sewage overflow, extensive stagnant water, major flood or obstruction
