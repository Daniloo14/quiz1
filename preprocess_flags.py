import os
import json
from PIL import Image

FLAGS_DIR = 'state_flags_png_1024/state_flags_png'
THUMBNAILS_DIR = 'state_flags_png_1024/thumbnails'
OUTPUT_FILE = 'flags_data.json'

def get_average_rgb(image_path):
    with Image.open(image_path) as img:
        img = img.convert('RGB')
        pixels = list(img.getdata())
        n = len(pixels)
        avg = [sum(c[i] for c in pixels) / n for i in range(3)]
        return [round(v / 255, 4) for v in avg]

def main():
    data = []
    for fname in os.listdir(FLAGS_DIR):
        if fname.endswith('.png'):
            state = fname.replace('.png', '').replace('_', ' ')
            rgb = get_average_rgb(os.path.join(FLAGS_DIR, fname))
            thumb_path = os.path.join(THUMBNAILS_DIR, fname)
            data.append({
                'state': state,
                'rgb': rgb,
                'thumbnail': thumb_path
            })
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)

if __name__ == '__main__':
    main()
