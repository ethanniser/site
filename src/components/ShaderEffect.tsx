import { useEffect, useRef } from "react";

interface ShaderEffectProps {
  imageSrc: string;
  className?: string;
  width?: number;
  height?: number;
}

// Vertex shader source code
const vertexShaderSource = `
precision mediump float;

attribute vec4 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

uniform float u_mouseActive;
uniform float u_mouseActivation;
uniform vec2 u_laggedMouse;
uniform float u_time;

void main() {
  vec4 position = a_position;

  if (u_mouseActive > 0.5) {
    vec2 screenPos = position.xy;
    vec2 mouseScreenPos = vec2(
      (u_laggedMouse.x - 0.5) * 2.0,
      (0.5 - u_laggedMouse.y) * 2.0
    );

    float distanceToMouse = length(screenPos - mouseScreenPos);
    float displacementRadius = 1.0;
    float displacementStrength = 0.03;

    float influence = 0.5 / (1.0 + distanceToMouse * distanceToMouse * 2.0);
    float radiusFalloff = 1.0 - smoothstep(displacementRadius * 0.6, displacementRadius, distanceToMouse);

    float edgeDistanceX = min(abs(screenPos.x), 1.0 - abs(screenPos.x));
    float edgeDistanceY = min(abs(screenPos.y), 1.0 - abs(screenPos.y));
    float edgeDistance = min(edgeDistanceX, edgeDistanceY);

    float edgeFalloff = edgeDistance > 0.05 ? smoothstep(0.05, 0.2, edgeDistance) : 0.0;

    influence = influence * displacementStrength * radiusFalloff * edgeFalloff * u_mouseActivation;

    if (influence > 0.001) {
      vec2 pushDirection = distanceToMouse > 0.01 ? normalize(screenPos - mouseScreenPos) : vec2(0.0);
      float timeVariation = sin(u_time * 3.0 + distanceToMouse * 10.0) * 0.1 + 1.0;
      position.xy += pushDirection * influence * timeVariation;
    }
  }

  gl_Position = position;
  v_texCoord = a_texCoord;
}
`;

// Fragment shader source code
const fragmentShaderSource = `
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_darkMode;
uniform vec2 u_mouseVelocity;
uniform float u_mouseActive;
uniform vec2 u_laggedMouse;

varying vec2 v_texCoord;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 83758.5453123);
}

void main() {
  vec2 pixelCoord = v_texCoord * u_resolution;
  vec2 mousePixel = u_laggedMouse * u_resolution;

  float lightDotSizePixels = 4.0;
  float lightSpacingPixels = 10.0;
  float darkDotSizePixels = 3.0;
  float darkSpacingPixels = 6.0;
  float dotSizePixels = mix(lightDotSizePixels, darkDotSizePixels, u_darkMode);
  float spacingPixels = mix(lightSpacingPixels, darkSpacingPixels, u_darkMode);

  vec2 gridCount = floor(u_resolution / spacingPixels);
  vec2 gridOffset = (u_resolution - gridCount * spacingPixels) * 0.5;
  vec2 adjustedPixelCoord = pixelCoord - gridOffset;

  vec2 originalGridPos = floor(adjustedPixelCoord / spacingPixels) * spacingPixels + spacingPixels * 0.5;
  vec2 gridPos = originalGridPos;
  vec2 offset = adjustedPixelCoord - gridPos;
  float dist = length(offset);

  vec2 originalGridUV = (originalGridPos + gridOffset) / u_resolution;

  vec4 gridColor = vec4(0.95, 0.95, 0.95, 1.0);
  if (originalGridUV.x >= 0.0 && originalGridUV.x <= 1.0 && originalGridUV.y >= 0.0 && originalGridUV.y <= 1.0) {
    gridColor = texture2D(u_texture, originalGridUV);
  }

  float brightness = (gridColor.r + gridColor.g + gridColor.b) / 3.0;

  float lightAdjustedDotSize = dotSizePixels * smoothstep(0.2, 0.8, (1.0 - brightness));
  float darkAdjustedDotSize = dotSizePixels * smoothstep(0.15, 1.0, (1.0 - brightness));
  float baseDotSize = mix(lightAdjustedDotSize, darkAdjustedDotSize, u_darkMode);

  float adjustedDotSize = baseDotSize;

  float circle = 0.0;

  vec2 originalDotCenter = originalGridPos;
  vec2 adjustedOriginalDotCenter = originalDotCenter - gridOffset;
  if (adjustedOriginalDotCenter.x >= 0.0 && adjustedOriginalDotCenter.x < gridCount.x * spacingPixels &&
      adjustedOriginalDotCenter.y >= 0.0 && adjustedOriginalDotCenter.y < gridCount.y * spacingPixels) {
    circle = 1.0 - smoothstep(adjustedDotSize - 0.5, adjustedDotSize + 0.5, dist);

    float distFromLeftEdge = pixelCoord.x;
    float distFromRightEdge = u_resolution.x - pixelCoord.x;
    float distFromTopEdge = pixelCoord.y;
    float distFromBottomEdge = u_resolution.y - pixelCoord.y;

    float distFromEdge = min(min(distFromLeftEdge, distFromRightEdge),
                            min(distFromTopEdge, distFromBottomEdge));

    vec2 gridCoord = floor((originalGridPos + gridOffset) / spacingPixels);
    float fadeZoneSize = random(gridCoord + vec2(123.45, 678.90)) * u_resolution.y * 0.2;
    float edgeFactor = clamp(distFromEdge / fadeZoneSize, 0.0, 1.0);
    float edgeNoise = random(gridCoord);
    float showProbability = edgeFactor * 0.8 + 0.2;

    vec2 dotCenter = originalGridPos + gridOffset;
    vec2 laggedMousePixel = u_laggedMouse * u_resolution;
    float mouseDistance = length(dotCenter - laggedMousePixel);

    float velocityMagnitude = length(u_mouseVelocity);
    float baseRadius = 400.0;
    float velocityRadius = velocityMagnitude * 20.0;
    float totalRadius = baseRadius + velocityRadius;

    float mouseInfluence = 0.0;
    if (mouseDistance < totalRadius && u_mouseActive > 0.5) {
      mouseInfluence = 0.75 - (mouseDistance / totalRadius);
    }

    vec2 mouseHideCoord = floor((originalGridPos + gridOffset) / spacingPixels);
    float mouseHideNoise = random(mouseHideCoord + vec2(9.87, 6.54));

    float baseHideProbability = mouseInfluence * 0.8 * u_mouseActive;
    float velocityBoost = min(velocityMagnitude * 2.0, 1.0);

    float impactSeed = random(mouseHideCoord + vec2(2.34, 7.89));
    float recoveryTime = 0.1 + impactSeed * 1.0;
    float recoveryWave = sin(u_time / recoveryTime + impactSeed * 6.28) * 0.5 + 0.5;

    float hideProbability = baseHideProbability * (1.0 + velocityBoost) * (1.0 - recoveryWave * 0.7);

    if (edgeNoise > showProbability) {
      circle = 0.0;
    } else {
      float mouseFadeOut = 1.0;
      if (mouseHideNoise < 0.5) {
        float sizeFactor = adjustedDotSize / dotSizePixels;
        float baseFadeDuration = 0.5;
        float sizeFadeDuration = baseFadeDuration + sizeFactor * 1.0;

        float fadeSpeed = mouseInfluence * 3.0;
        float fadeProgress = clamp(fadeSpeed - recoveryWave * 2.0, 0.0, 1.0);

        mouseFadeOut = 1.0 - smoothstep(0.0, sizeFadeDuration, fadeProgress * sizeFadeDuration);
      }

      circle *= mouseFadeOut;

      float sizeBasedDelay = (adjustedDotSize / dotSizePixels) * 1.5;
      float randomOffset = random(gridCoord + vec2(456.78, 901.23)) * 0.75;
      float animationDelay = sizeBasedDelay + randomOffset;
      float animationDuration = 0.1;
      float animationStart = animationDelay;
      float animationEnd = animationDelay + animationDuration;

      float fadeIn = smoothstep(animationStart, animationEnd, u_time);

      circle *= fadeIn;
    }
  }

  vec4 backgroundColor = vec4(0.0, 0.0, 0.0, 0.0);

  vec4 lightModeColor = vec4(1.0, 1.0, 1.0, 1.0);
  vec4 darkModeColor = vec4(0.0, 0.0, 0.0, 1.0);
  vec4 dotColor = mix(lightModeColor, darkModeColor, u_darkMode);

  vec4 finalColor = vec4(dotColor.rgb * circle, circle);

  gl_FragColor = finalColor;
}
`;

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Error compiling shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Error linking program:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function loadTexture(
  gl: WebGLRenderingContext,
  url: string,
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) return null;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };

  image.onerror = () => {
    console.error("Failed to load image:", url);
  };

  image.src = url;

  return texture;
}

export default function ShaderEffect({
  imageSrc,
  className = "",
  width = 300,
  height = 300,
}: ShaderEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const mouseActiveRef = useRef(0);
  const mouseActivationRef = useRef(0);
  const laggedMouseRef = useRef({ x: 0.5, y: 0.5 });
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = (window.devicePixelRatio || 1) * 2;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    gl.clearColor(0, 0, 0, 0);

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );

    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const darkModeLocation = gl.getUniformLocation(program, "u_darkMode");
    const textureLocation = gl.getUniformLocation(program, "u_texture");
    const mouseVelocityLocation = gl.getUniformLocation(
      program,
      "u_mouseVelocity",
    );
    const mouseActiveLocation = gl.getUniformLocation(program, "u_mouseActive");
    const mouseActivationLocation = gl.getUniformLocation(
      program,
      "u_mouseActivation",
    );
    const laggedMouseLocation = gl.getUniformLocation(program, "u_laggedMouse");

    // Create mesh grid (50x50 grid)
    const positions: number[] = [];
    const texCoords: number[] = [];
    const indices: number[] = [];

    for (let y = 0; y <= 50; y++) {
      for (let x = 0; x <= 50; x++) {
        const posX = (x / 50) * 2 - 1;
        const posY = (y / 50) * 2 - 1;
        positions.push(posX, posY);

        const texX = x / 50;
        const texY = 1 - y / 50;
        texCoords.push(texX, texY);
      }
    }

    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        const topLeft = y * 51 + x;
        indices.push(topLeft, topLeft + 1, topLeft + 50 + 1);
        indices.push(topLeft + 1, topLeft + 50 + 2, topLeft + 50 + 1);
      }
    }

    // Create buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW,
    );

    const indexCount = indices.length;

    // Load texture
    const texture = loadTexture(gl, imageSrc);

    // Mouse event handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const newMouse = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };

      const now = performance.now();
      const dt = Math.max(now - lastTimeRef.current, 1);

      const dx = newMouse.x - mouseRef.current.x;
      const dy = newMouse.y - mouseRef.current.y;

      velocityRef.current = {
        x: velocityRef.current.x * 0.9 + (dx / dt) * 100,
        y: velocityRef.current.y * 0.9 + (dy / dt) * 100,
      };

      if (mouseActiveRef.current === 0) {
        laggedMouseRef.current = { ...newMouse };
      }

      mouseRef.current = newMouse;
      mouseActiveRef.current = 1;
      lastTimeRef.current = now;
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: 0.5, y: 0.5 };
      velocityRef.current = { x: 0, y: 0 };
      mouseActiveRef.current = 0;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // Animation loop
    function render(time: number) {
      if (!gl || !canvas) return;

      // Update lagged mouse position
      laggedMouseRef.current = {
        x:
          laggedMouseRef.current.x +
          (mouseRef.current.x - laggedMouseRef.current.x) * 0.15,
        y:
          laggedMouseRef.current.y +
          (mouseRef.current.y - laggedMouseRef.current.y) * 0.15,
      };

      // Update mouse activation smoothly
      const targetActivation = mouseActiveRef.current;
      mouseActivationRef.current +=
        (targetActivation - mouseActivationRef.current) * 0.06;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      // Bind position attribute
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Bind texture coordinate attribute
      gl.enableVertexAttribArray(texCoordLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      // Set uniforms
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time * 0.001);
      gl.uniform1f(darkModeLocation, 1);
      gl.uniform2f(
        mouseVelocityLocation,
        velocityRef.current.x,
        velocityRef.current.y,
      );
      gl.uniform1f(mouseActiveLocation, mouseActiveRef.current);
      gl.uniform1f(mouseActivationLocation, mouseActivationRef.current);
      gl.uniform2f(
        laggedMouseLocation,
        laggedMouseRef.current.x,
        laggedMouseRef.current.y,
      );

      // Bind texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(textureLocation, 0);

      // Draw
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

      animationFrameRef.current = requestAnimationFrame(render);
    }

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [imageSrc, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        backgroundColor: "transparent",
        width: `${width}px`,
        height: `${height}px`,
        imageRendering: "crisp-edges",
      }}
    />
  );
}
