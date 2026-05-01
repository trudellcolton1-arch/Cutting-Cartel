# Catalog photos

Drop Brian's actual portfolio shots in this folder, named exactly:

- `low-fade-textured.jpg`
- `mid-fade-pompadour.jpg`
- `high-skin-fade.jpg`
- `taper-classic.jpg`
- `buzz-2.jpg`
- `edge-up-design.jpg`

Then in `src/app/api/admin/init-db/route.ts`, swap each `thumbnailUrl`
from the Unsplash URL to `/styles/<slug>.jpg`. Hit `/api/admin/init-db`
once and the catalog refreshes with the real photos.

JPEG / PNG / WebP all work. Any aspect ratio is fine — the catalog grid
crops to 4:3.
