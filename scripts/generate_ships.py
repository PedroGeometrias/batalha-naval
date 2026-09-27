"""Generate 16 directional frames per ship as four-by-four transparent PNG atlases.

Requires Pillow only when regenerating artwork: python3 scripts/generate_ships.py
Frame zero faces screen-right; subsequent frames rotate clockwise by 22.5 degrees.
"""
from pathlib import Path
from PIL import Image, ImageDraw

SIZE = 96
SCALE = 4
CENTER = SIZE * SCALE // 2
OUT = Path(__file__).resolve().parents[1] / 'src/assets/ships'
OUT.mkdir(parents=True, exist_ok=True)

SHIPS = {
    'player': {'wood': '#bb8150', 'rim': '#f2d08b', 'deck': '#754b38', 'sail': '#ffead3', 'trim': '#3caab8', 'flag': '#5be3d4'},
    'chaser': {'wood': '#774142', 'rim': '#e4a27d', 'deck': '#432f39', 'sail': '#e89b83', 'trim': '#bf544a', 'flag': '#ff6a59'},
    'shooter': {'wood': '#65527b', 'rim': '#c5acd9', 'deck': '#3f3453', 'sail': '#d8c5e4', 'trim': '#9f87c7', 'flag': '#dba7ee'},
}


def make_ship(name, colors):
    img = Image.new('RGBA', (SIZE * SCALE, SIZE * SCALE))
    draw = ImageDraw.Draw(img, 'RGBA')

    def xy(points):
        return [((x + SIZE / 2) * SCALE, (y + SIZE / 2) * SCALE) for x, y in points]

    def poly(points, color, outline=None, width=1):
        vertices = xy(points)
        draw.polygon(vertices, fill=color)
        if outline:
            draw.line(vertices + vertices[:1], fill=outline, width=width * SCALE, joint='curve')

    def ellipse(bounds, color):
        x1, y1, x2, y2 = bounds
        draw.ellipse(((x1+SIZE/2)*SCALE, (y1+SIZE/2)*SCALE,
                      (x2+SIZE/2)*SCALE, (y2+SIZE/2)*SCALE), fill=color)

    # Soft grounding shadow and offset hull wall give the deck an elevated look.
    ellipse((-19, -29, 23, 34), (4, 17, 28, 100))
    poly([(0,-31),(18,-15),(20,20),(11,32),(-11,32),(-20,20),(-18,-15)], '#263642')
    poly([(0,-36),(21,-17),(20,16),(12,28),(-12,28),(-20,16),(-21,-17)], colors['rim'])
    poly([(0,-31),(16,-15),(15,15),(9,23),(-9,23),(-15,15),(-16,-15)], colors['wood'])
    poly([(0,-27),(12,-12),(11,12),(7,18),(-7,18),(-11,12),(-12,-12)], colors['deck'])
    if name == 'chaser':
        # A narrow reinforced ram makes the fast enemy distinct.
        poly([(-5,-28),(0,-43),(5,-28)], '#e4a27d')
        poly([(-2,-29),(0,-39),(2,-29)], '#432f39')
        for side in (-1, 1):
            poly([(side*18,-7),(side*25,-2),(side*18,2)], colors['trim'])
    elif name == 'shooter':
        # Four protruding cannon barrels signal its ranged attack.
        for side in (-1, 1):
            for y in (-7, 9):
                poly([(side*16,y-3),(side*26,y-3),(side*26,y+3),(side*16,y+3)], '#282538')
                ellipse((side*25-2,y-2,side*25+2,y+2), '#f5cb8f')
    poly([(-3,-25),(0,-30),(3,-25),(2,-16),(-2,-16)], colors['trim'])
    # Stern planks, brass bolts, narrow bulwarks, and broadside cannons.
    for y in (-13, -5, 3, 11, 18):
        draw.line(xy([(-9,y),(9,y)]), fill='#e2ae73', width=1*SCALE)
    for x in (-18, 18):
        ellipse((x-2, -5, x+2, -1), '#25343c')
        ellipse((x-2, 9, x+2, 13), '#25343c')
    for x in (-13, 13):
        ellipse((x-1, -13, x+1, -11), '#f8d792')
        ellipse((x-1, 16, x+1, 18), '#f8d792')
    # Sail cast diagonally above the deck: tapered cloth, shaded hem, and mast.
    poly([(2,-20),(8,-17),(15,10),(4,13)], '#473743')
    poly([(0,-24),(8,-19),(15,8),(2,10)], colors['sail'])
    poly([(0,-24),(4,-21),(6,8),(2,10)], '#fff7df')
    draw.line(xy([(0,-25),(2,15)]), fill='#553e37', width=2*SCALE)
    poly([(1,-25),(10,-23),(2,-19)], colors['flag'])
    ellipse((-3,12,4,18), colors['trim'])
    return img


for name, colors in SHIPS.items():
    base = make_ship(name, colors)
    atlas = Image.new('RGBA', (SIZE*4, SIZE*4))
    for index in range(16):
        # PIL rotation uses math coordinates; screen angles grow clockwise.
        frame = base.rotate(-90-index*22.5, Image.Resampling.BICUBIC)
        frame = frame.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
        atlas.alpha_composite(frame, ((index % 4)*SIZE, (index // 4)*SIZE))
    atlas.save(OUT / f'{name}.png', optimize=True)
