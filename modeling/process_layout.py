import cv2
import numpy as np

EXTRUDE_HEIGHT = 3.0
SCALE = 0.05

img = cv2.imread('Kresge/Reference_Kresge.png', 0)
height, width = img.shape[:2] # type: ignore
half_height = int(height * 0.46)
half_height2 = int(height * 0.52)
half_width2 = int(width * 0.72)


def get_contours(section, min_area=120, C=6, max_vertices=30, min_solidity=0.0):
    blurred = cv2.GaussianBlur(section, (3, 3), 0)
    _, otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    adaptive = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                     cv2.THRESH_BINARY_INV, blockSize=21, C=C)
    binary = cv2.bitwise_or(otsu, adaptive)
    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    filtered = [cnt for cnt in contours if cv2.contourArea(cnt) > min_area]
    simplified = [cv2.approxPolyDP(cnt, 0.02 * cv2.arcLength(cnt, True), True) for cnt in filtered]
    pairs = []
    for f, s in zip(filtered, simplified):
        if len(s) > max_vertices:
            continue
        if min_solidity > 0.0:
            hull_area = cv2.contourArea(cv2.convexHull(f))
            if hull_area > 0 and cv2.contourArea(f) / hull_area < min_solidity:
                continue
        pairs.append((f, s))
    return [p[0] for p in pairs], [p[1] for p in pairs]


def get_contours_bottom(section, min_area=350, min_solidity=0.5):
    blurred = cv2.GaussianBlur(section, (5, 5), 0)
    _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    # Close small gaps in wall lines
    kernel = np.ones((3, 3), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)
    # RETR_EXTERNAL: only outermost contours, skips nested text characters
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filtered, simplified = [], []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue
        hull_area = cv2.contourArea(cv2.convexHull(cnt))
        if hull_area == 0 or area / hull_area < min_solidity:
            continue
        filtered.append(cnt)
        simplified.append(cv2.approxPolyDP(cnt, 0.02 * cv2.arcLength(cnt, True), True))
    return filtered, simplified

top = img[:half_height, :] # type: ignore
bottom = img[half_height2:, :half_width2] # type: ignore

top_filtered, top_simplified = get_contours(top)
bottom_filtered, bottom_simplified = get_contours(bottom)

# Build OBJ mesh by extruding each contour upward
vertices = []
faces = []
vertex_offset = 1

for cnt in top_simplified + bottom_simplified:
    pts = cnt[:, 0, :]
    n = len(pts)
    if n < 3:
        continue

    bottom_ring = [(x * SCALE, 0.0,           y * SCALE) for x, y in pts]
    top_ring    = [(x * SCALE, EXTRUDE_HEIGHT, y * SCALE) for x, y in pts]

    b_start = vertex_offset
    for v in bottom_ring:
        vertices.append(v)
        vertex_offset += 1

    t_start = vertex_offset
    for v in top_ring:
        vertices.append(v)
        vertex_offset += 1

    for i in range(n):
        ni = (i + 1) % n
        b0, b1 = b_start + i, b_start + ni
        t0, t1 = t_start + i, t_start + ni
        faces.append((b0, b1, t1))
        faces.append((b0, t1, t0))

    for i in range(1, n - 1):
        faces.append((b_start, b_start + i, b_start + i + 1))

    for i in range(1, n - 1):
        faces.append((t_start, t_start + i + 1, t_start + i))

output_path = 'Kresge/layout_mesh.obj'
with open(output_path, 'w') as f:
    f.write('# rough floor plan mesh\n')
    for vx, vy, vz in vertices:
        f.write(f'v {vx:.4f} {vy:.4f} {vz:.4f}\n')
    for face in faces:
        f.write(f'f {face[0]} {face[1]} {face[2]}\n')

print(f'Exported {len(vertices)} vertices, {len(faces)} faces -> {output_path}')

top_color = cv2.cvtColor(top, cv2.COLOR_GRAY2BGR)
cv2.drawContours(top_color, top_filtered, -1, (0, 255, 0), 2)
cv2.imshow('Top Floor', top_color)

bottom_color = cv2.cvtColor(bottom, cv2.COLOR_GRAY2BGR)
cv2.drawContours(bottom_color, bottom_filtered, -1, (0, 255, 0), 2)
cv2.imshow('Bottom Floor', bottom_color)

cv2.waitKey(0)
cv2.destroyAllWindows()
