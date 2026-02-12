import math
import numpy as np
from PIL import Image, ImageDraw

# ========= SETTINGS =========
IMG_NAME = "forest floor"
INPUT_PATH = f"{IMG_NAME}.png"
OUTPUT_PATH = f"{IMG_NAME}_pixelated.png"
TRIANGLE_SIZE = 10  # side length of each triangle in pixels
# ============================


def average_color_in_triangle(img_array, vertices):
    h, w, _ = img_array.shape

    min_x = max(int(min(v[0] for v in vertices)), 0)
    max_x = min(int(max(v[0] for v in vertices)) + 1, w)
    min_y = max(int(min(v[1] for v in vertices)), 0)
    max_y = min(int(max(v[1] for v in vertices)) + 1, h)

    def point_in_triangle(px, py, v1, v2, v3):
        denom = ((v2[1] - v3[1]) * (v1[0] - v3[0]) +
                 (v3[0] - v2[0]) * (v1[1] - v3[1]))
        if denom == 0:
            return False
        a = ((v2[1] - v3[1]) * (px - v3[0]) +
             (v3[0] - v2[0]) * (py - v3[1])) / denom
        b = ((v3[1] - v1[1]) * (px - v3[0]) +
             (v1[0] - v3[0]) * (py - v3[1])) / denom
        c = 1 - a - b
        return 0 <= a <= 1 and 0 <= b <= 1 and 0 <= c <= 1

    pixels = []
    for y in range(min_y, max_y):
        for x in range(min_x, max_x):
            if point_in_triangle(x + 0.5, y + 0.5, *vertices):
                pixels.append(img_array[y, x])

    if not pixels:
        return (0, 0, 0)

    avg = np.mean(pixels, axis=0)
    return tuple(int(v) for v in avg)


def main():
    img = Image.open(INPUT_PATH).convert("RGB")
    img_array = np.array(img)
    width, height = img.size

    output = Image.new("RGB", (width, height), (0, 0, 0))
    draw = ImageDraw.Draw(output)

    s = TRIANGLE_SIZE
    tri_height = s * math.sqrt(3) / 2

    # Rotated grid spacing
    col_step_x = tri_height
    col_step_y = 0
    row_step_x = 0
    row_step_y = s / 2

    cols = int(width / tri_height) + 3
    rows = int(height / (s / 2)) + 3

    for row in range(rows):
        for col in range(cols):
            x = col * col_step_x + row * row_step_x
            y = col * col_step_y + row * row_step_y

            if (row + col) % 2 == 0:
                # Right-pointing triangle ▶
                v1 = (x, y)
                v2 = (x, y + s)
                v3 = (x + tri_height, y + s / 2)
            else:
                # Left-pointing triangle ◀
                v1 = (x + tri_height, y)
                v2 = (x + tri_height, y + s)
                v3 = (x, y + s / 2)

            color = average_color_in_triangle(img_array, (v1, v2, v3))
            draw.polygon([v1, v2, v3], fill=color)

    output.save(OUTPUT_PATH)
    print("Done! Saved to", OUTPUT_PATH)


if __name__ == "__main__":
    main()
