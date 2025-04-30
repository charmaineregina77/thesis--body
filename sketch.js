let video;
let pose;
let poses = [];
let gridSize = 30;
let previousRightWristY = null;
let lastSaveTime = 0;
let saveCooldown = 300;
let prevPositions = {};
let savedFrames = [];
let sequences = [];
let frameLimit = 6;
let sequenceLimit = 9; // Matches the correct number of black box positions
let scoresheet;
let yPositions = [286, 582, 886, 1194, 1502, 1806, 2114, 2422, 2730];
let progressDisplay;
let currentSequenceSizeRange; // Store current sequence's size range
let container;
let promptSelect;
const prompts = [
  "Select a prompt...",
  "I am feeling...",
  "Today I want to...",
  "My body wants to...",
  "I remember when...",
  "In this moment...",
  "My movement is like...",
  "I am moving through...",
  "This gesture means...",
  "My dance tells a story of..."
];
let isWebcamActive = false;
let terzaFont;
let isFontLoaded = false;

function preload() {
  scoresheet = loadImage("scoresheet-embodiedlogo.png", () => {
    console.log("✅ Scoresheet loaded successfully!");
  }, () => {
    console.error("⚠️ ERROR: Scoresheet not found! Check filename & path.");
  });
  
  // Try to load Terza font with correct filename
  loadFont('terza.otf', 
    // Success callback
    (font) => {
      terzaFont = font;
      isFontLoaded = true;
      console.log("✅ Terza font loaded successfully!");
    }, 
    // Error callback
    () => {
      console.log("⚠️ Terza font not found, using fallback font");
      isFontLoaded = false;
    }
  );
}

function setup() {
  // Create a wrapper div for the entire content
  let wrapper = createDiv('');
  wrapper.style('display', 'flex');
  wrapper.style('flex-direction', 'column');
  wrapper.style('align-items', 'center');
  wrapper.style('width', '100%');
  wrapper.style('min-height', '100vh');
  wrapper.style('background-color', '#FFFFCC');
  wrapper.style('padding-top', '20px');
  
  // Create the main container for canvas and prompt
  container = createDiv('');
  container.style('display', 'flex');
  container.style('flex-direction', 'column');
  container.style('align-items', 'center');
  container.style('justify-content', 'center');
  container.style('width', '100%');
  container.style('flex-grow', '1');
  container.style('gap', '15px');
  container.parent(wrapper);
  
  // Create name input container
  let nameContainer = createDiv('');
  nameContainer.style('position', 'relative');
  nameContainer.style('width', '400px');
  nameContainer.style('margin-bottom', '8px');
  nameContainer.style('display', 'flex');
  nameContainer.style('align-items', 'center');
  nameContainer.style('gap', '10px');
  nameContainer.parent(container);

  // Create name label
  let nameLabel = createDiv('Your Name:');
  nameLabel.style('color', '#663300');
  nameLabel.style('font-family', isFontLoaded ? 'Terza' : 'monospace');
  nameLabel.style('font-size', '15px');
  nameLabel.style('white-space', 'nowrap');
  nameLabel.parent(nameContainer);

  // Create name input
  let nameInput = createInput('');
  nameInput.attribute('placeholder', '');
  nameInput.style('flex-grow', '1'); // Allow input to take remaining space
  nameInput.style('background-color', '#FAF2F6');
  nameInput.style('color', '#663300');
  nameInput.style('font-family', isFontLoaded ? 'Terza' : 'monospace');
  nameInput.style('font-size', '15px');
  nameInput.style('padding', '10px 20px');
  nameInput.style('border', '2px solid #663300');
  nameInput.style('border-radius', '50px');
  nameInput.style('outline', 'none');
  nameInput.style('box-sizing', 'border-box');
  nameInput.style('-webkit-appearance', 'none');
  nameInput.style('-moz-appearance', 'none');
  nameInput.style('appearance', 'none');
  nameInput.parent(nameContainer);

  // Add focus effects
  nameInput.elt.addEventListener('focus', () => {
    nameInput.style('background-color', '#FFF0F5');
  });
  nameInput.elt.addEventListener('blur', () => {
    nameInput.style('background-color', '#FAF2F6');
  });
  
  // Store name input for access in other functions
  window.nameInput = nameInput;
  
  // Create custom dropdown container
  let dropdownContainer = createDiv('');
  dropdownContainer.style('position', 'relative');
  dropdownContainer.style('width', '400px'); // Match name input width
  dropdownContainer.style('display', 'flex');
  dropdownContainer.style('align-items', 'center');
  dropdownContainer.style('gap', '10px');
  dropdownContainer.parent(container);

  // Create prompt label
  let promptLabel = createDiv('Your Poem:');
  promptLabel.style('color', '#663300');
  promptLabel.style('font-family', isFontLoaded ? 'Terza' : 'monospace');
  promptLabel.style('font-size', '15px');
  promptLabel.style('white-space', 'nowrap');
  promptLabel.parent(dropdownContainer);

  // Create dropdown wrapper to take remaining space
  let dropdownWrapper = createDiv('');
  dropdownWrapper.style('flex-grow', '1');
  dropdownWrapper.style('position', 'relative');
  dropdownWrapper.parent(dropdownContainer);

  // Create custom select button
  let customSelect = createDiv('');
  customSelect.style('background-color', '#FAF2F6');
  customSelect.style('color', '#663300');
  customSelect.style('font-family', isFontLoaded ? 'Terza' : 'monospace');
  customSelect.style('font-size', '15px');
  customSelect.style('padding', '10px 20px');
  customSelect.style('border', '2px solid #663300');
  customSelect.style('border-radius', '50px');
  customSelect.style('cursor', 'pointer');
  customSelect.style('user-select', 'none');
  customSelect.style('position', 'relative');
  customSelect.style('display', 'flex');
  customSelect.style('align-items', 'center');
  customSelect.style('justify-content', 'space-between');
  customSelect.parent(dropdownWrapper);

  // Create text container
  let textContainer = createDiv('Select a prompt...');
  textContainer.style('flex-grow', '1');
  textContainer.style('margin-right', '30px');
  textContainer.style('overflow', 'hidden');
  textContainer.style('text-overflow', 'ellipsis');
  textContainer.style('white-space', 'nowrap');
  textContainer.style('font-size', '15px');
  textContainer.parent(customSelect);

  // Add arrow to custom select
  const arrowSVG = `
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1L6 6L11 1" stroke="#663300" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  let arrow = createDiv(arrowSVG);
  arrow.style('position', 'absolute');
  arrow.style('right', '20px');
  arrow.style('top', '50%');
  arrow.style('transform', 'translateY(-50%)');
  arrow.style('pointer-events', 'none');
  arrow.parent(customSelect);

  // Create dropdown list container
  let dropdownList = createDiv('');
  dropdownList.style('display', 'none');
  dropdownList.style('position', 'absolute');
  dropdownList.style('top', '100%');
  dropdownList.style('left', '0');
  dropdownList.style('right', '0');
  dropdownList.style('margin-top', '5px');
  dropdownList.style('background-color', '#FAF2F6');
  dropdownList.style('border', '2px solid #663300');
  dropdownList.style('border-radius', '25px');
  dropdownList.style('padding', '10px 0');
  dropdownList.style('z-index', '1000');
  dropdownList.style('overflow', 'hidden');
  dropdownList.parent(dropdownWrapper);

  // Add prompt options
  let selectedPrompt = "Select a prompt...";
  prompts.forEach((prompt, index) => {
    if (prompt !== "Select a prompt...") {
      let option = createDiv(prompt);
      option.style('padding', '8px 20px');
      option.style('color', '#663300');
      option.style('font-family', isFontLoaded ? 'Terza' : 'monospace');
      option.style('font-size', '15px');
      option.style('cursor', 'pointer');
      option.style('transition', 'background-color 0.2s');
      option.style('white-space', 'nowrap');
      option.style('overflow', 'hidden');
      option.style('text-overflow', 'ellipsis');
      
      // Add special radius to first and last options
      if (index === 1) { // First actual option
        option.style('border-radius', '15px 15px 0 0');
      } else if (index === prompts.length - 1) { // Last option
        option.style('border-radius', '0 0 15px 15px');
      }
      
      option.parent(dropdownList);

      // Hover effect
      option.mouseOver(() => {
        option.style('background-color', '#FFFFCC');
      });
      option.mouseOut(() => {
        option.style('background-color', '#FAF2F6');
      });

      // Click handler
      option.mousePressed(() => {
        selectedPrompt = prompt;
        textContainer.html(prompt); // Update only the text container
        dropdownList.style('display', 'none'); // Hide dropdown
        if (!isWebcamActive) {
          startWebcam();
        }
      });
    }
  });

  // Toggle dropdown on button click
  customSelect.mousePressed(() => {
    let isVisible = dropdownList.style('display') !== 'none';
    dropdownList.style('display', isVisible ? 'none' : 'block');
  });

  // Close dropdown when clicking outside
  window.addEventListener('click', (e) => {
    if (!dropdownContainer.elt.contains(e.target)) {
      dropdownList.style('display', 'none');
    }
  });

  // Function to get selected prompt (for use in other parts of the code)
  window.getSelectedPrompt = () => selectedPrompt;

  // Remove the original select element
  if (promptSelect) {
    promptSelect.remove();
  }
  promptSelect = {
    value: () => selectedPrompt
  };
  
  let cnv = createCanvas(640, 480);
  cnv.style('border-radius', '50px');
  cnv.parent(container);
  
  // Create progress display below canvas
  progressDisplay = createDiv('');
  progressDisplay.parent(container);
  progressDisplay.style('font-family', isFontLoaded ? 'Terza' : 'monospace');
  progressDisplay.style('margin-top', '10px');
  progressDisplay.style('text-align', 'center');
  progressDisplay.style('width', '640px');
  progressDisplay.style('color', '#663300');
  progressDisplay.style('font-size', '15px');
  
  // Display initial message
  progressDisplay.html('Please select a prompt to begin...');
}

function onPromptSelected() {
  let selectedPrompt = promptSelect.value();
  if (selectedPrompt && selectedPrompt !== "Select a prompt...") {
    if (!isWebcamActive) {
      startWebcam();
    }
  }
}

function startWebcam() {
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  pose.onResults(onPoseResults);

  const camera = new Camera(video.elt, {
    onFrame: async () => {
      await pose.send({ image: video.elt });
    },
    width: 640,
    height: 480
  });

  camera.start();
  isWebcamActive = true;
}

function onPoseResults(results) {
  if (results.poseLandmarks) {
    poses = results.poseLandmarks;
  }
}

function draw() {
  clear();
  
  // Draw rounded rectangle background
  fill('#FAF2F6');
  noStroke();
  rect(0, 0, width, height, 50);

  if (!isWebcamActive) {
    return;  // Just return without drawing the message on canvas
  }

  if (poses.length > 0) {
    let points = poses.map((lm, index) => {
      let x = lm.x * width + width/6;
      let y = lm.y * height;

      let prev = prevPositions[index] || { x, y };
      let movement = dist(x, y, prev.x, prev.y);
      prevPositions[index] = { x, y };

      return { x, y, movement };
    });

    drawThickLines(points);
    drawDottedBezierArmsAndLegs(points);
    drawLandmarks(points);
    detectRightHandWave(points);
  }

  // Update progress display with instructions
  if (isWebcamActive) {
    let progressText = `Frames: ${savedFrames.length}/${frameLimit} | Sequences: ${sequences.length}/${sequenceLimit}<br><span style="font-size: 14px; color: #663300; margin-top: 8px; display: block;">When you complete the sequence, it exports as a scoresheet.</span>`;
    progressDisplay.html(progressText);
  }
}

function generateRandomSizeRange() {
  // Adjusted size ranges to be larger
  let patterns = [
    { min: 2.0, max: 4.0 },    // Large
    { min: 2.5, max: 4.5 },    // Extra large
    { min: 3.0, max: 5.0 },    // Huge
    { min: 2.0, max: 5.0 },    // Full large range
    { min: 3.5, max: 5.5 }     // Maximum size
  ];
  
  return random(patterns);
}

function detectRightHandWave(points) {
  let rightWrist = points[16];
  if (!rightWrist) return;

  let currentTime = millis();
  if (previousRightWristY !== null) {
    let movement = previousRightWristY - rightWrist.y;

    if (movement > 10 && (currentTime - lastSaveTime) > saveCooldown) {
      if (savedFrames.length === 0) {
        currentSequenceSizeRange = generateRandomSizeRange();
        console.log(`✨ New sequence with size range: ${currentSequenceSizeRange.min.toFixed(1)} to ${currentSequenceSizeRange.max.toFixed(1)}`);
      }

      console.log("✅ Wave detected! Capturing sequence...");

      let sizeVariation = random(currentSequenceSizeRange.min, currentSequenceSizeRange.max);
      let frameWidth = 640 * sizeVariation;
      let frameHeight = 480 * sizeVariation;
      let frameCanvas = createGraphics(frameWidth, frameHeight);
      
      // Set up the frame canvas with transparency
      frameCanvas.clear();
      
      if (poses.length > 0) {
        let scaledPoints = poses.map(lm => ({
          x: lm.x * frameWidth + frameWidth/6,
          y: lm.y * frameHeight
        }));
        
        let strokeScale = map(sizeVariation, 0.3, 2.5, 0.3, 2.0);
        
        // Draw thick lines
        frameCanvas.stroke('#663300');
        frameCanvas.strokeCap(SQUARE);
        frameCanvas.strokeWeight(30 * strokeScale);
        let connections = [
          [11, 23], [12, 24], [23, 24],
          [23, 25], [25, 27], [24, 26], [26, 28]
        ];
        for (let c of connections) {
          let p1 = scaledPoints[c[0]];
          let p2 = scaledPoints[c[1]];
          if (p1 && p2) {
            frameCanvas.line(p1.x, p1.y, p2.x, p2.y);
          }
        }
        
        // Draw dotted bezier arms and legs
        frameCanvas.stroke('#663300');
        frameCanvas.strokeWeight(1.2 * strokeScale);
        frameCanvas.noFill();
        let limbConnections = [
          [11, 13, 15], [12, 14, 16],
          [23, 25, 27], [24, 26, 28]
        ];
        for (let c of limbConnections) {
          let p1 = scaledPoints[c[0]];
          let p2 = scaledPoints[c[1]];
          let p3 = scaledPoints[c[2]];
          if (p1 && p2 && p3) {
            drawDottedBezierOnCanvas(frameCanvas, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
          }
        }
        
        // Draw landmarks
        frameCanvas.fill('#FFFFCC');
        frameCanvas.stroke('#663300');
        frameCanvas.strokeWeight(0.8 * strokeScale);
        for (let i = 0; i < scaledPoints.length; i += 2) {
          let p = scaledPoints[i];
          if (p) {
            frameCanvas.ellipse(p.x, p.y, 15 * strokeScale, 15 * strokeScale);
          }
        }
      }
      
      savedFrames.push({
        canvas: frameCanvas,
        sizeVariation: sizeVariation
      });

      if (savedFrames.length === frameLimit) {
        storeSequence();
        savedFrames = [];
      }

      lastSaveTime = currentTime;
    }
  }
  previousRightWristY = rightWrist.y;
}

function drawDottedBezierOnCanvas(canvas, x1, y1, x2, y2, x3, y3) {
  let d = dist(x1, y1, x3, y3);
  let step = 10;
  let draw = true;

  for (let t = 0; t <= 1; t += step / d) {
    let px1 = bezierPoint(x1, x2, x2, x3, t);
    let py1 = bezierPoint(y1, y2, y2, y3, t);
    let tNext = t + (step / d);
    let px2 = bezierPoint(x1, x2, x2, x3, tNext);
    let py2 = bezierPoint(y1, y2, y2, y3, tNext);

    if (tNext <= 1 && draw) {
      canvas.line(px1, py1, px2, py2);
    }
    draw = !draw;
  }
}

function storeSequence() {
  if (savedFrames.length !== frameLimit) {
    console.log("⚠️ Incorrect number of frames, skipping sequence");
    return;
  }

  let availableWidth = 2150;  // Increased width for better visibility
  let spacing = availableWidth / 6;  // More spacing between frames
  
  let sequenceCanvas = createGraphics(availableWidth, 800); // Increased height
  sequenceCanvas.clear();

  // Place frames with better visibility
  for (let i = 0; i < savedFrames.length; i++) {
    let frame = savedFrames[i];
    let baseX = (i * spacing);
    
    // More subtle position variations
    let xOffset = random(-20, 20);
    let yOffset = random(-10, 10);
    
    // Larger base size
    let frameWidth = spacing * 0.9 * frame.sizeVariation;
    let frameHeight = (frameWidth * 3) / 4;
    
    // Center vertically
    let yPos = (800 - frameHeight) / 2 + yOffset;
    
    // Add slight rotation
    sequenceCanvas.push();
    sequenceCanvas.translate(baseX + xOffset + frameWidth/2, yPos + frameHeight/2);
    sequenceCanvas.rotate(random(-0.05, 0.05));
    sequenceCanvas.image(frame.canvas, -frameWidth/2, -frameHeight/2, frameWidth, frameHeight);
    sequenceCanvas.pop();
  }

  sequences.push({
    canvas: sequenceCanvas,
    frames: savedFrames.map(f => ({ width: f.canvas.width, height: f.canvas.height }))
  });
  
  console.log(`📸 Stored sequence ${sequences.length}/${sequenceLimit}`);

  if (sequences.length === sequenceLimit) {
    saveSequencesOnScoresheet();
    sequences = [];
  }
}

function saveSequencesOnScoresheet() {
  let finalCanvas = createGraphics(2550, 3300);
  finalCanvas.clear();
  finalCanvas.image(scoresheet, 0, 0);

  // Set up text properties once for both texts
  finalCanvas.fill('#663300');
  finalCanvas.noStroke();
  if (isFontLoaded) {
    finalCanvas.textFont(terzaFont);
  } else {
    finalCanvas.textFont('monospace');
  }
  finalCanvas.textSize(36);

  // Add the selected prompt text (left-aligned)
  let selectedPrompt = promptSelect.value();
  if (selectedPrompt && selectedPrompt !== "Select a prompt...") {
    finalCanvas.textAlign(LEFT, TOP);
    finalCanvas.text(selectedPrompt, 244, 50);
  }

  // Add the name (right-aligned)
  let userName = window.nameInput.value();
  if (userName) {
    finalCanvas.textAlign(RIGHT, TOP);
    finalCanvas.text('Your Name: ' + userName, 2306, 50);
  }

  // Define line positions and spacing
  const linePositions = [286, 594, 902, 1210, 1518, 1826, 2134, 2442, 2750];
  const horizontalMargin = 244;
  const availableWidth = 2062;

  // Place sequences on lines with larger sizes
  for (let i = 0; i < sequences.length; i++) {
    let sequence = sequences[i];
    if (!sequence || !sequence.canvas) {
      console.log(`⚠️ Warning: Invalid sequence at index ${i}`);
      continue;
    }
    
    // Calculate base size for this sequence - increased size
    let baseWidth = random(400, 600); // Increased from 250-350 to 400-600
    let scaleFactor = baseWidth / sequence.canvas.width;
    let baseHeight = sequence.canvas.height * scaleFactor;
    
    // Calculate position
    let yPos = linePositions[i] - baseHeight/2;
    let xPos = horizontalMargin + random(0, availableWidth - baseWidth);
    
    // Add slight rotation for organic feel
    let rotation = random(-0.05, 0.05);
    
    // Apply the transformation
    finalCanvas.push();
    finalCanvas.translate(xPos + baseWidth/2, yPos + baseHeight/2);
    finalCanvas.rotate(rotation);
    finalCanvas.image(sequence.canvas, -baseWidth/2, -baseHeight/2, baseWidth, baseHeight);
    finalCanvas.pop();
  }

  console.log("✅ Saving final scoresheet...");
  finalCanvas.save("wave_sequences_tobeplotted.png");
}

function drawThickLines(points) {
  let connections = [
    [11, 23], [12, 24], [23, 24],
    [23, 25], [25, 27], [24, 26], [26, 28]
  ];
  stroke('#663300');
  strokeCap(SQUARE);
  strokeWeight(40);
  for (let c of connections) {
    let p1 = points[c[0]];
    let p2 = points[c[1]];
    if (p1 && p2) {
      line(p1.x, p1.y, p2.x, p2.y);
    }
  }
}

function drawDottedBezier(x1, y1, x2, y2, x3, y3) {
  let d = dist(x1, y1, x3, y3);
  let step = 10;
  let draw = true;

  for (let t = 0; t <= 1; t += step / d) {
    let px1 = bezierPoint(x1, x2, x2, x3, t);
    let py1 = bezierPoint(y1, y2, y2, y3, t);
    let tNext = t + (step / d);
    let px2 = bezierPoint(x1, x2, x2, x3, tNext);
    let py2 = bezierPoint(y1, y2, y2, y3, tNext);

    if (tNext <= 1 && draw) {
      line(px1, py1, px2, py2);
    }

    draw = !draw; // Toggle between drawing and skipping to create dashes
  }
}

function drawDottedBezierArmsAndLegs(points) {
  stroke('#663300');
  strokeWeight(1.5);
  noFill();
  let limbConnections = [
    [11, 13, 15], [12, 14, 16],
    [23, 25, 27], [24, 26, 28]
  ];
  for (let c of limbConnections) {
    let p1 = points[c[0]];
    let p2 = points[c[1]];
    let p3 = points[c[2]];
    if (p1 && p2 && p3) {
      drawDottedBezier(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    }
  }
}

function drawLandmarks(points) {
  fill('#FFFFCC');
  stroke('#663300');
  strokeWeight(1);
  for (let i = 0; i < points.length; i += 2) {
    let p = points[i];
    let dotSize = map(p.movement, 0, 50, 20, 60, true);
    ellipse(p.x, p.y, dotSize, dotSize);
  }
}
