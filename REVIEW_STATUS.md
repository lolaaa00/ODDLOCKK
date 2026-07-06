# OddLock Review Status

Date: 2026-07-06

## Reviewer summary

The main review concern was the missing source-evidence path in settlement. That has been addressed:

- Settlement now requires concrete evidence findings tied to the locked primary/fallback source URLs.
- The contract attempts to fetch the locked sources with supported GenLayer nondeterministic web helpers when available.
- Fetched source records are stored on the settlement/dispute report and rendered in the UI.
- The frontend no longer sends a generic evidence packet.

## Additional checks

- The contract address and `.env` guidance are present.
- The timestamp usage is documented as a Studionet runtime limitation for lifecycle windows only.
- I did not find any bare `Exception` catches in the contract; the remaining catches are narrow and specific.

## Recommendation

This looks ready to resubmit. The original blocker is fixed, and the remaining issues are polish-level rather than acceptance blockers.

