# Battle depth redesign QA

## Visual target

- Motion and composition reference: `E:\예시.zip`
- Primary comparison frame: `PS21112700215.jpg`
- Combined comparison: `work/design-comparison-battle.jpg`

## Verified states

- Desktop battle at 1280 × 720 in the deployed Sites environment
- Mobile battle at 390 × 844
- Narrow mobile layout at 320 × 844
- Six fighter-specific rear three-quarter battle sprites
- Distant centered enemy, foreground fighter, target reticle, arena depth, and bottom typing deck
- Keyboard focus remains on the battle textarea
- Existing battle health, combo, typing, stage navigation, and scoring state remain connected

## Responsive checks

- 390px: `scrollWidth === clientWidth` (390px)
- 320px: `scrollWidth === clientWidth` (320px)
- Input command bar remains visible at the bottom
- Boss health, player health, target, fighter, word queue, and action button remain within the viewport

## Motion checks

- Idle fighter breathing/sway loop
- Idle enemy hover loop
- Rotating target reticle
- Correct-input recoil sequence on the fighter wrapper
- Projectile streak from foreground toward the distant target
- Muzzle burst and target impact burst
- Enemy hit reaction and camera kick
- Reduced-motion override disables decorative and combat animations

## Findings

- P1: none
- P2: none
- P3: the local Cloudflare worker preview could not remain running in this Windows host, so visual QA was performed against the deployed Sites version. Build, focused lint, and rendered integration tests passed before deployment.

## Result

PASS — the battle now follows the reference's foreground shooter / distant target composition and keeps the typing game controls usable on desktop and mobile.
