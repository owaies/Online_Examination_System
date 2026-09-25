# Exam builder QA plan

The repository's current feature set includes question banks, pools, blueprints, bulk imports, and randomized exam construction.

## Question bank
Verify creating, editing, importing, and removing questions preserves the intended answer and option structure.

## Pools and blueprints
Confirm only eligible questions can enter a pool and blueprint rules produce the configured exam shape.

## Randomization
Run the same blueprint multiple times and verify question selection can vary without producing duplicates when uniqueness is required.

## Boundary cases
Test empty pools, too-small pools, invalid imports, and incomplete blueprint definitions.
