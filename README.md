# polibook2D-webgl

Cormac Lynch-Collier

This program was built with WebGL. There are two modes; file mode: a user 
can upload one of the .dat files in the repo which are then drawn on the screen by connecting the points, and draw mode:
a user can draw points and lines connect those points on the screen. 

Additional Notes:
- Press "f" to enter File mode and "d" to enter draw mode.
- If the user presses "c", the color of the drawing on the screen cycles between black, red, green, and blue. 
For instance, if the current drawing color is black, hitting "c" redraws everything in red. 
Hitting "c" again redraws it in green, etc.
- If the "b" key is held down while clicking (in draw mode), the current click point is NOT joined to the previous click point and 
instead a fresh polyline is started and drawn in addition to whatever previous polyline had been drawn
- Optimal performance is on Google Chrome
