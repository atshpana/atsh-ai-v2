# ATSH AI — Visual Direction and Reference Assets

## 1. Supplied visual references

The owner supplied three image references in the project conversation:
- `atsh-hero.jpg`: a dark hero concept showing a brushed-silver ATSH plaque, a red illuminated AI mark and a dark wood base.
- `atsh-logo.jpg`: a circular brushed-metal ATSH monogram badge shown against a checkerboard-like background.
- `زز.jpg`: the same circular metal monogram against a dark textured surface.

These are visual references available in the project context; they have not yet been copied into this Git repository as binary assets. Do not claim the web application currently uses these exact image files.

## 2. Visual language inferred from the references

- Primary atmosphere: premium, technical, dark and restrained.
- Surfaces: graphite/near-black backgrounds, brushed silver/steel, subtle texture and controlled depth.
- Brand mark: interwoven ATSH monogram as the dominant symbol; AI can use a restrained warm-red illuminated accent.
- Accent: red/coral used selectively for calls to action, focus states and key active indicators.
- Typography: clear Arabic and Latin families with intentional baseline/weight matching.
- Layout: generous negative space, strong editorial hierarchy, restrained borders and purposeful motion.
- Avoid: generic neon overload, excessive gradients, arbitrary glass cards and red used as a large background field.

## 3. Provisional design tokens

The following tokens are starter values, not measured values extracted from the supplied images. Replace/adjust only after a deliberate design review and visual measurement.

| Token | Provisional value | Use |
|---|---|---|
| Background | #080A0D | Main dark canvas |
| Surface | #101419 | Panels |
| Raised surface | #151B21 | Elevated sections |
| Primary text | #F2F4F5 | High contrast text |
| Muted text | #929CA5 | Secondary text |
| Border | rgba(255,255,255,0.11) | Quiet separators |
| Accent | #F15B55 | CTA and active states |
| Accent highlight | #FF8B70 | Hover/secondary glow |
| Metal light | #D6D8D8 | Silver highlights |
| Metal shadow | #4B5359 | Metallic depth |

## 4. Asset handling

- Keep original source files unchanged.
- Before publishing a logo asset, prepare a clean transparent SVG/PNG or a properly cropped production export; the supplied JPG checkerboard must not be mistaken for transparency.
- Maintain light/dark logo variants only if the brand review approves them.
- Use the circular ATSH monogram consistently in favicon, app icon and compact navigation where the production asset supports it.
- Use the hero plaque concept as art direction, not as a requirement to place a heavy raster hero image on every page.
- Store production assets in the repository only after the owner approves the exact files and licensing/ownership is clear.

## 5. Visual acceptance procedure

1. Capture reference screenshots at known viewport sizes.
2. Measure container widths, spacing, typography, colors, radii, borders, shadows and image crops.
3. Record tokens in the shared UI package.
4. Implement reusable components and their interactive states.
5. Compare implementation screenshots to references at matching dimensions.
6. Classify differences as critical, medium or minor; fix agreed issues.
7. Verify mobile/tablet/desktop, keyboard navigation, focus visibility and Arabic RTL/English LTR.
8. Do not declare full visual match based on a visual impression alone; keep measurement and test evidence.
