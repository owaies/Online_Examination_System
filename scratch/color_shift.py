import cv2
import numpy as np
import os
import sys

input_path = "public/media.mp4"
output_path = "public/media_teal.mp4"

if not os.path.exists(input_path):
    print(f"Error: Input video '{input_path}' not found.")
    sys.exit(1)

cap = cv2.VideoCapture(input_path)
if not cap.isOpened():
    print("Error: Could not open video file.")
    sys.exit(1)

width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)
fourcc = cv2.VideoWriter_fourcc(*'mp4v') # we will output standard MP4 format

out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

print(f"Processing video: {width}x{height} @ {fps} FPS")

frame_count = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Convert frame to HSV color space
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    # Extract H, S, V channels
    h, s, v = cv2.split(hsv)
    
    # We want to shift orangish/reddish flames to teal/cyan.
    # In OpenCV HSV, Hue ranges from 0 to 180.
    # Red is around 0-10 and 170-180. Orange/Yellow is around 10-30.
    # Teal/Cyan is around 80-100 in OpenCV HSV.
    # Let's shift all hues in the range [0, 35] and [165, 180] (which is red/orange/yellow) to teal (approx 90).
    
    # Create mask for red/orange/yellow
    mask1 = (h >= 0) & (h <= 35)
    mask2 = (h >= 165) & (h <= 180)
    red_orange_mask = mask1 | mask2
    
    # We only shift if saturation and value are relatively high (to avoid changing dark/gray background elements)
    valid_mask = red_orange_mask & (s > 40) & (v > 40)
    
    # Shift hue of valid pixels to teal (approx 90)
    # Let's shift it to 90 (which is 180 degrees in OpenCV HSV space, corresponding to 180 degrees color hue, i.e., Cyan/Teal)
    h[valid_mask] = 90
    
    # Boost saturation and brightness slightly to make the teal pop
    s[valid_mask] = np.clip(s[valid_mask] * 1.2, 0, 255).astype(np.uint8)
    
    # Merge channels back
    shifted_hsv = cv2.merge([h, s, v])
    
    # Convert back to BGR
    out_frame = cv2.cvtColor(shifted_hsv, cv2.COLOR_HSV2BGR)
    
    out.write(out_frame)
    frame_count += 1
    if frame_count % 30 == 0:
        print(f"Processed {frame_count} frames...")

cap.release()
out.release()
print("Successfully created 'public/media_teal.mp4' with teal flames!")
