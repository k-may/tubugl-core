/**
 * test for vao(webgl2)
 */

import {Program2, ArrayBuffer, IndexArrayBuffer, FrameBuffer, VAO, TransformFeedback} from 'tubuGL';
import {UNSIGNED_SHORT, FLOAT, TRANSFORM_FEEDBACK_BUFFER, TRANSFORM_FEEDBACK} from "tubugl-constants";

const TweenLite = require('gsap');
const dat = require('../../vendors/dat.gui/dat.gui');
const Stats = require('../../vendors/stats.js/stats');


const vertexShaderSrc = `#version 300 es
  precision mediump float;
#define POSITION_LOCATION 0
#define PI 3.141592

layout(location = POSITION_LOCATION) in vec4 position;

// all shaders have a main function
void main() {
    float theta = -1.0/180. *  PI;
    float COS = cos(theta);
    float SIN = sin(theta);
    mat2 rotation = mat2( COS, SIN,
                         -SIN, COS);
    vec2 pos = rotation * position.xy;
    gl_Position = vec4(pos.xy, 0.0, 1.0);
}`;

const fragmentShaderSrc = `#version 300 es
  precision mediump float;
  
  out vec4 outColor;

  void main() {
    float colorR = gl_FrontFacing ? 1.0 : 0.0;
    float colorG = gl_FrontFacing ? 0.0 : 1.0;
    
    outColor = vec4(colorR, colorG, 0.0, 1.0);
  }
`;

const vertexShaderSrc2 = `#version 300 es
  precision mediump float;
#define POSITION_LOCATION 0
#define PI 3.141592

layout(location = POSITION_LOCATION) in vec4 position;

// all shaders have a main function
void main() {
    float theta = 1.0/180. *  PI;
    float COS = cos(theta);
    float SIN = sin(theta);
    mat2 rotation = mat2( COS, SIN,
                         -SIN, COS);
    vec2 pos = rotation * position.xy;
    gl_Position = vec4(pos.xy, 0.0, 1.0);
}`;

const fragmentShaderSrc2 = `#version 300 es
  precision mediump float;
  
  out vec4 outColor;

  void main() {
    outColor = vec4(1.0);
  }
`;



export default class App {
    constructor(params){
        this.updateAttribute = this.updateAttribute.bind(this);
        this._playAndStop = this._playAndStop.bind(this);

        this._isPlay = false;
        this._width = params.width ? params.width : window.innerWidth;
        this._height = params.height ? params.height : window.innerHeight;

        this.canvas = params.canvas;
        this.gl = this.canvas.getContext('webgl2');
        this._description = params.description;

        this.createFrameBuffer();
        this.createProgram();
        this.resize();
        // this._setDebug();
    }

    _playAndStop(){
        if(this._isPlay){
            this.stop();
            this._playAndStopGUI.name('play');
        }else{
            this.start();
            this._playAndStopGUI.name('pause');
        }
    }

    _setDebug(){
        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);
        let descriptionDom = document.createElement('div');
        descriptionDom.style.color = '#ffffff';
        descriptionDom.style.fontSize = '12px';
        descriptionDom.style.marginTop = '5px';
        descriptionDom.style.marginLeft = '4px';
        this.stats.dom.appendChild(descriptionDom);
        descriptionDom.innerHTML = this._description;

        this.gui = new dat.GUI();
        this.gui.add(this, 'updateAttribute');
        this._playAndStopGUI = this.gui.add(this, '_playAndStop').name('pause');
    }

    createFrameBuffer(){
        this._frambuffer = new FrameBuffer(this.gl, window.innerWidth, window.innerHeight);
        this._frambuffer.unbind();
    }

    createProgram(){
        this._program = new Program2(this.gl, vertexShaderSrc.trim(), fragmentShaderSrc.trim(), {transformFeedback: ['gl_Position']});

        let side = 0.1;
        let xPos = 0.5;
        let positions = new Float32Array([
            -side + xPos, -side, 0.0, 1.0,
             side + xPos, -side, 0.0, 1.0,
             side + xPos,  side, 0.0, 1.0
        ]);

        /** ====================================== **/

        let _positionBufferA = new ArrayBuffer(this.gl, positions, {usage: this.gl.DYNAMIC_COPY});
        _positionBufferA.bind().setAttribs('position', 4);
        let _positionBufferB = new ArrayBuffer(this.gl, positions, {usage: this.gl.DYNAMIC_COPY});
        _positionBufferB.bind().setAttribs('position', 4);

        this._positionAttribLocation2 = this._program.getAttrib('position').location;
        let transformFeedback = new TransformFeedback(this.gl);
        transformFeedback.addArrayBufer(0, {read: _positionBufferA, write: _positionBufferB, name: 'position'});

        this._obj = {
            program: this._program,
            positionAttribLocation: this._positionAttribLocation2,
            transformFeedback: transformFeedback,
            count: 6
        };


        let program2 = new Program2(this.gl, vertexShaderSrc2.trim(), fragmentShaderSrc2.trim(), {transformFeedback: ['gl_Position']});

        let _positionBufferA2 = new ArrayBuffer(this.gl, positions, {usage: this.gl.DYNAMIC_COPY});
        _positionBufferA2.bind().setAttribs('position', 4);
        let _positionBufferB2 = new ArrayBuffer(this.gl, positions, {usage: this.gl.DYNAMIC_COPY});
        _positionBufferB2.bind().setAttribs('position', 4);

        let positionAttribLocation2 = this._program.getAttrib('position').location;
        let transformFeedback2 = new TransformFeedback(this.gl);
        transformFeedback2.addArrayBufer(0, {read: _positionBufferA2, write: _positionBufferB2, name: 'position'});

        this._obj2 = {
            program: program2,
            positionAttribLocation: positionAttribLocation2,
            transformFeedback: transformFeedback2,
            count: 6
        };

    }

    updateAttribute(){
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._positionBuffer1);
        let positions2 = [
            Math.random() - 0.5, Math.random() - 0.5,
            Math.random() - 0.5, Math.random() - 0.5,
            Math.random() - 0.5, Math.random() - 0.5,
        ];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions2), this.gl.STATIC_DRAW);
    }

    start(){
        this._isPlay = true;
        TweenMax.ticker.addEventListener('tick', this.update, this);
    }

    stop(){
        this._isPlay = false;
        TweenMax.ticker.removeEventListener('tick', this.update, this);
    }

    update(){
        if(this.stats) this.stats.update();

        let gl = this.gl;

        /**
         * =====================================
         *            draw obj
         * =====================================
         */

        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this._obj.program.bind();
        this._obj.transformFeedback.bind().updateBufferBase(this._program);

        gl.beginTransformFeedback(gl.TRIANGLES)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        gl.endTransformFeedback();

        this._obj.transformFeedback.unbindBufferBase().swapArrayBuffers();

        /**
         * =====================================
         *           draw obj2
         * =====================================
         */

        this._obj2.program.bind();
        this._obj2.transformFeedback.bind().updateBufferBase(this._obj2.program);

        gl.beginTransformFeedback(gl.TRIANGLES)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        gl.endTransformFeedback()

        this._obj2.transformFeedback.unbindBufferBase().swapArrayBuffers();

    }

    resize(width, height){
        if(width) this._width = width;
        if(height) this._height = height;

        this.canvas.width = this._width;
        this.canvas.height = this._height;
        this.gl.viewport(0, 0, this._width, this._height);
    }
}