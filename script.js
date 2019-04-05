let file;
let gl;
let program;
let canvas;

let mode = 0; // 0 = file, 1 = draw
let drawn = 0; //0 = blank canvas, 1 = drawn

let points = [];
let colors;

let color = 0;
let colorArray = [0.0, 0.0, 0.0];

let newPolyline = false;
let totalPoints = [];

function main() {
    canvas = document.getElementById('webgl');

    gl = WebGLUtils.setupWebGL(canvas, undefined);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    program = initShaders(gl, "vshader", "fshader");

    gl.useProgram(program);

    //when a file gets uploaded
    document.getElementById("file").onchange = function () {
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        file = this.files[0];
        openfile();
    };

    //handles color change, and mode change
    handleKeyPress();

    // handle new polyline when b is pressed down
    window.onkeydown = function(e) {
        if(e.key === "b") {
            newPolyline = true;
        }
    };

    // if you let go of b then the next line should not be a new polyline
    window.onkeyup = function(e) {
        if(e.key === "b") {
            newPolyline = false;
        }
    }

}

//onclick function for the canvas to draw polylines
drawMode = (event) => {
    //if in draw mode
    if(mode === 1) {
        //get coords for click
        let x = event.offsetX;
        let y = canvas.height - event.offsetY;

        //if you need to start a new polyline
        if(newPolyline || points.length === 100) {
            totalPoints.push(points);
            points = [];
            newPolyline = false;
        }

        //add point to array
        points.push(vec4(x, y, 0.0, 1.0));

        renderDrawMode();
    }
};

//handles the uploaded file
openfile = () => {
    var reader = new FileReader();
    reader.onload = function () {

        // By lines
        var lines = this.result.split('\n');
        let x = 0;

        //searches for * at the start of file
        while(x < lines.length && lines[x].charAt(0) !== "*") {
            x++;
        }
        x++;

        //extents
        let ext;
        if(x > lines.length) {
            ext = [0, 480, 640, 0];
            x = 0;
        } else {
            if(lines[x].length === 0) {
                x++;
            }
            let split = lines[x].split(' '); //extents, splits by double space
            ext = [];
            split.filter(x => {
                if(x !== " " && x.length !== 0) {
                    ext.push(x)
                }
            });
            x++;
        }

        //for aspect ration, find if width or height is larger
        let h = parseFloat(ext[1]) - parseFloat(ext[3]);
        let w = parseFloat(ext[2] ) - parseFloat(ext[0]);

        let larger, smaller;
        if(h > w) {
            larger = h;
            smaller = w;
        } else {
            larger = w;
            smaller = h;
        }

        //set viewport to maintain aspect ration
        gl.viewport(0,0, canvas.width, ((canvas.width * smaller)/larger));

        //get points for polylines
        for (let line = x; line < lines.length; line++) {

            let split = lines[line].split(" ");
            let toPush = [];
            split.filter(x => {
                if(x !== " " && x.length !== 0) {
                    toPush.push(x);
                }
            });
            if(toPush.length === 2) {
                points.push(vec4(toPush[0], toPush[1], 0.0, 1.0));
            } else {
                if(points.length !== 0 && (lines[line].length !== 0 || line === lines.length - 1)) { // logic to check if points has something in it and the line isn't blank, unless it is the last line of the file
                    render(ext);
                    points = [];
                }
            }
        }
    };
    reader.readAsText(file);
};

//renders the points to the screen
render = (ext) => {
    drawn = 1;

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    colors = [];
    for(let i = 0; i < points.length; i++) {
        colors.push(vec4(colorArray[0], colorArray[1], colorArray[2], 1.0));
    }

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var offsetLoc = gl.getUniformLocation(program, "vPointSize");
    gl.uniform1f(offsetLoc, 10.0);

    let thisProj = ortho(parseFloat(ext[0]), parseFloat(ext[2]), parseFloat(ext[3]), parseFloat(ext[1]), -1, 1); // handle extents
    var projMatrix = gl.getUniformLocation(program, 'projMatrix');
    gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));

    gl.drawArrays(gl.LINE_STRIP, 0, points.length);
};

//handles the key presses to change mode and change color
handleKeyPress = () => {
    window.onkeypress = function(e) {
        let key = e.key;
        let title = document.getElementById("title");
        let file = document.getElementById("file");
        switch(key) {
            case 'd':
                if(mode === 0) {
                    gl.viewport(0, 0, 400, 400);
                    title.innerText = "Draw Mode";
                    file.style.display = "none";
                    drawn = 0;
                    gl.clearColor(1.0, 1.0, 1.0, 1.0);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    mode = 1;
                    document.getElementById("file").value = "";
                }
                break;
            case 'f':
                title.innerText = "File Mode";
                file.style.display = "block";
                gl.clearColor(1.0, 1.0, 1.0, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                mode = 0;
                drawn = 0;
                break;
            case 'c':
                if(drawn === 1) {
                    switch(color) {
                        case 0:
                            colorArray = [1.0, 0.0, 0.0];
                            break;
                        case 1:
                            colorArray = [0.0, 1.0, 0.0];
                            break;
                        case 2:
                            colorArray = [0.0, 0.0, 1.0];
                            break;
                        default:
                            colorArray = [0.0, 0.0, 0.0];
                            color = -1;
                            break;
                    }
                    color++;
                    mode === 0 ? openfile() : renderDrawMode(); // depending on mode, rerender
                }
                break;
            default:
                break;
        }
    }
};

//render current polyline and all previous polylines
renderDrawMode = () => {
    //render previous polylines before you render the line you are working on currently
    let temp = points;
    for (let i = 0; i < totalPoints.length; i++) {
        points = totalPoints[i];
        render([0, 400, 400, 0]);
    }
    points = temp;

    //render current polyline
    render([0, 400, 400, 0]);
};