// Modify these variables to account for full screen
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
let sequenceLimit = 8;
let scoresheet;
let embodiedLogo; // Add variable for the logo
let yPositions = [286, 594, 902, 1210, 1518, 1826, 2134, 2442];
let progressDisplay;
let currentSequenceSizeRange;
let container;
let promptSelect;
let windowWidth, windowHeight; // Add variables to track window dimensions
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
let controlsOverlay; // New variable for the controls overlay
let baseFontSize = 16;
let currentFontSize = baseFontSize;

function preload() {
  scoresheet = loadImage("scoresheet-embodiedlogo.png", () => {
    console.log("✅ Scoresheet loaded successfully!");
  }, () => {
    console.error("⚠️ ERROR: Scoresheet not found! Check filename & path.");
  });
  
  embodiedLogo = loadImage("EmbodiedLogo.png", () => {
    console.log("✅ Embodied logo loaded successfully!");
  }, () => {
    console.error("⚠️ ERROR: Embodied logo not found! Check filename & path.");
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
  // Get window dimensions
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  
  // Calculate initial font size based on screen width
  updateFontSize();
  
  // Create a wrapper div for the entire content
  let wrapper = createDiv('');
  wrapper.style('display', 'flex');
  wrapper.style('flex-direction', 'column');
  wrapper.style('align-items', 'center');
  wrapper.style('width', '100%');
  wrapper.style('height', '100vh');
  wrapper.style('background-color', '#FAF2F6');
  wrapper.style('padding', '0');
  wrapper.style('margin', '0');
  wrapper.style('overflow', 'hidden');
  wrapper.position(0, 0);
  
  // Create embodied logo
  let logoImg = createImg('EmbodiedLogo.png', 'Embodied Logo', () => {
    console.log("✅ Logo image element created successfully!");
  }, () => {
    console.error("⚠️ ERROR: Failed to create logo image element!");
  });
  logoImg.id('embodied-logo');
  logoImg.style('position', 'fixed');
  logoImg.style('top', '24px');
  logoImg.style('left', '32px');
  logoImg.style('right', 'unset');
  logoImg.style('height', '60px');
  logoImg.style('width', 'auto');
  logoImg.style('z-index', '10002');
  logoImg.style('cursor', 'pointer');
  logoImg.parent(wrapper);
  
  // Create the main container that will hold the canvas and controls
  container = createDiv('');
  container.style('display', 'flex');
  container.style('flex-direction', 'column');
  container.style('align-items', 'center');
  container.style('justify-content', 'center');
  container.style('width', '100%');
  container.style('height', '100%');
  container.style('position', 'relative'); // Important for absolute positioning of children
  container.parent(wrapper);
  
  // Create a full-screen canvas
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  cnv.parent(container);
  
  // Create the overlay for controls that will float above the canvas
  controlsOverlay = createDiv('');
  controlsOverlay.style('position', 'absolute');
  controlsOverlay.style('top', '20px');
  controlsOverlay.style('left', '50%');
  controlsOverlay.style('transform', 'translateX(-50%)');
  controlsOverlay.style('width', '400px');
  controlsOverlay.style('z-index', '100');
  controlsOverlay.style('display', 'flex');
  controlsOverlay.style('flex-direction', 'column');
  controlsOverlay.style('gap', '15px');
  controlsOverlay.style('background-color', 'rgba(255, 255, 204, 0.8)'); // Semi-transparent background
  controlsOverlay.style('padding', '15px');
  controlsOverlay.style('border-radius', '25px');
  controlsOverlay.style('box-shadow', '0 4px 8px rgba(0, 0, 0, 0.1)');
  controlsOverlay.parent(container);
  
  // Create burger menu
  let burgerMenu = createDiv('');
  burgerMenu.id('burger-menu');
  burgerMenu.style('position', 'fixed');
  burgerMenu.style('top', '24px');
  burgerMenu.style('right', '32px');
  burgerMenu.style('width', '45px');
  burgerMenu.style('height', '45px');
  burgerMenu.style('background', '#FFFFCC');
  burgerMenu.style('border', '3px solid #663300');
  burgerMenu.style('border-radius', '50%');
  burgerMenu.style('display', 'flex');
  burgerMenu.style('align-items', 'center');
  burgerMenu.style('justify-content', 'center');
  burgerMenu.style('z-index', '10001');
  burgerMenu.style('cursor', 'pointer');
  burgerMenu.style('box-shadow', '0 4px 16px 0 rgba(102, 51, 0, 0.13)');
  burgerMenu.style('transition', 'box-shadow 0.2s, background 0.2s');
  burgerMenu.mouseOver(() => {
    burgerMenu.style('background', '#FFF9B2');
    burgerMenu.style('box-shadow', '0 8px 24px 0 rgba(102, 51, 0, 0.18)');
  });
  burgerMenu.mouseOut(() => {
    burgerMenu.style('background', '#FFFFCC');
    burgerMenu.style('box-shadow', '0 4px 16px 0 rgba(102, 51, 0, 0.13)');
  });
  burgerMenu.mousePressed(() => {
    window.location.href = 'https://readymag.website/u3988029614/embodied/select/';
  });
  burgerMenu.parent(container);

  // Create burger icon
  let burgerIcon = createDiv('');
  burgerIcon.class('burger-icon');
  burgerIcon.style('display', 'flex');
  burgerIcon.style('flex-direction', 'column');
  burgerIcon.style('justify-content', 'center');
  burgerIcon.style('align-items', 'center');
  burgerIcon.style('width', '22px');
  burgerIcon.style('height', '22px');
  burgerIcon.style('gap', '5px');
  burgerIcon.parent(burgerMenu);

  // Create burger lines
  for (let i = 0; i < 3; i++) {
    let line = createDiv('');
    line.style('display', 'block');
    line.style('width', '22px');
    line.style('height', '3px');
    line.style('background', '#663300');
    line.style('border-radius', '2px');
    line.style('transition', 'background 0.2s');
    line.parent(burgerIcon);
  }
  
  // Create name input container
  let nameContainer = createDiv('');
  nameContainer.style('width', '100%');
  nameContainer.style('display', 'flex');
  nameContainer.style('align-items', 'center');
  nameContainer.style('gap', '10px');
  nameContainer.parent(controlsOverlay);

  // Create name label
  let nameLabel = createDiv('Your Name:');
  nameLabel.style('color', '#663300');
  nameLabel.style('font-family', isFontLoaded ? 'Terza' : 'monospace');
  nameLabel.style('font-size', currentFontSize + 'px');
  nameLabel.style('white-space', 'nowrap');
  nameLabel.parent(nameContainer);

  // Create name input wrapper to take remaining space
  let nameInputWrapper = createDiv('');
  nameInputWrapper.style('flex-grow', '1');
  nameInputWrapper.style('position', 'relative');
  nameInputWrapper.parent(nameContainer);

  // Create name input
  let nameInput = createInput('');
  nameInput.attribute('placeholder', '');
  nameInput.style('width', '100%');
  nameInput.style('background-color', '#FAF2F6');
  nameInput.style('color', '#663300');
  nameInput.style('font-family', isFontLoaded ? 'Terza' : 'monospace');
  nameInput.style('font-size', currentFontSize + 'px');
  nameInput.style('padding', '10px 20px');
  nameInput.style('border', '2px solid #663300');
  nameInput.style('border-radius', '50px');
  nameInput.style('outline', 'none');
  nameInput.style('box-sizing', 'border-box');
  nameInput.style('-webkit-appearance', 'none');
  nameInput.style('-moz-appearance', 'none');
  nameInput.style('appearance', 'none');
  nameInput.parent(nameInputWrapper);

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
  dropdownContainer.style('width', '100%');
  dropdownContainer.style('display', 'flex');
  dropdownContainer.style('align-items', 'center');
  dropdownContainer.style('gap', '10px');
  dropdownContainer.parent(controlsOverlay);

  // Create prompt label
  let promptLabel = createDiv('Your Poem:');
  promptLabel.style('color', '#663300');
  promptLabel.style('font-family', isFontLoaded ? 'Terza' : 'monospace');
  promptLabel.style('font-size', currentFontSize + 'px');
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
  customSelect.style('font-size', currentFontSize + 'px');
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
  textContainer.style('font-size', currentFontSize + 'px');
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
      option.style('font-size', currentFontSize + 'px');
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
  
  // Create progress display at bottom of screen
  progressDisplay = createDiv('');
  progressDisplay.style('position', 'absolute');
  progressDisplay.style('bottom', '30px');
  progressDisplay.style('left', '50%');
  progressDisplay.style('transform', 'translateX(-50%)');
  progressDisplay.style('font-family', isFontLoaded ? 'Terza' : 'monospace');
  progressDisplay.style('text-align', 'center');
  progressDisplay.style('color', '#663300');
  progressDisplay.style('font-size', currentFontSize + 'px');
  progressDisplay.style('background-color', 'rgba(255, 255, 204, 0.8)');
  progressDisplay.style('padding', '10px 20px');
  progressDisplay.style('border-radius', '25px');
  progressDisplay.style('box-shadow', '0 4px 8px rgba(0, 0, 0, 0.1)');
  progressDisplay.style('z-index', '100');
  progressDisplay.parent(container);
  
  // Display initial message
  progressDisplay.html('Please select a prompt to begin...');
  
  // Add window resize event listener
  window.addEventListener('resize', windowResized);
}

function windowResized() {
  // Update window dimensions
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  
  // Update font sizes
  updateFontSize();
  
  // Resize canvas to fill window
  resizeCanvas(windowWidth, windowHeight);
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
  video.size(windowWidth, windowHeight); // Set video to window size
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
    width: windowWidth,  // Use window width
    height: windowHeight // Use window height
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
  
  // Draw webcam feed
  if (video && isWebcamActive) {
    // Save current transformation state
    push();
    
    // Flip the canvas horizontally for mirror effect
    translate(width, 0);
    scale(-1, 1);
    
    // Draw the video to fill the screen while maintaining aspect ratio
    let vidRatio = video.width / video.height;
    let screenRatio = width / height;
    
    if (vidRatio > screenRatio) {
      // Video is wider than screen
      let newWidth = height * vidRatio;
      image(video, -(newWidth), 0, newWidth, height);
    } else {
      // Video is taller than screen
      let newHeight = width / vidRatio;
      image(video, -width, (height - newHeight) / 2, width, newHeight);
    }
    
    // Restore transformation state
    pop();
    
    // Draw a semi-transparent overlay for better visibility of the controls
    fill(255, 255, 204, 30); // Very light yellow with low opacity
    noStroke();
    rect(0, 0, width, height);
  } else {
    // If webcam not active, draw a background
    fill('#FAF2F6');
    noStroke();
    rect(0, 0, width, height);
  }

  if (poses.length > 0 && isWebcamActive) {
    // Save current transformation state for pose drawing
    push();
    
    // Flip the canvas horizontally
    translate(width, 0);
    scale(-1, 1);
    
    let points = poses.map((lm, index) => {
      // Scale coordinates to full screen
      let x = lm.x * width;
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
    
    // Restore transformation state
    pop();
  }

  // Update progress display with instructions
  if (isWebcamActive) {
    let progressText = `Frames: ${savedFrames.length}/${frameLimit} | Sequences: ${sequences.length}/${sequenceLimit}<br><span style="font-size: ${currentFontSize}px; color: #663300; margin-top: 8px; display: block;">Wave your right hand to capture frames. When you complete the sequence, it exports as a scoresheet.</span>`;
    progressDisplay.html(progressText);
  }
}

// The rest of the functions remain largely unchanged but will work with the full-screen canvas

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
      let frameWidth = windowWidth * sizeVariation;
      let frameHeight = (windowHeight * sizeVariation) * 0.5;
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

  let availableWidth = 2500;  
  let spacing = availableWidth / 5;  
  
  // Reduce canvas height by 30%
  let sequenceCanvas = createGraphics(availableWidth, 560);
  sequenceCanvas.clear();

  // Place frames with reduced height
  for (let i = 0; i < savedFrames.length; i++) {
    let frame = savedFrames[i];
    let baseX = (i * spacing);
    
    let xOffset = random(-20, 20);
    let yOffset = random(-10, 10);
    
    // Calculate frame dimensions with 30% height reduction
    let frameWidth = (spacing * 0.9 * frame.sizeVariation) * 0.85;
    let frameHeight = (frameWidth * 3 / 4) * 0.7;
    
    let yPos = (560 - frameHeight) / 2 + yOffset;
    
    sequenceCanvas.push();
    sequenceCanvas.translate(baseX + xOffset + frameWidth/2, yPos + frameHeight/2);
    sequenceCanvas.rotate(random(-0.05, 0.05));
    sequenceCanvas.image(frame.canvas, -frameWidth/2, -frameHeight/2, frameWidth, frameHeight);
    sequenceCanvas.pop();
  }

  sequences.push({
    canvas: sequenceCanvas,
    frames: savedFrames.map(f => ({ 
      width: f.canvas.width, 
      height: f.canvas.height * 0.7
    }))
  });
  
  console.log(`📸 Stored sequence ${sequences.length}/${sequenceLimit}`);

  if (sequences.length === sequenceLimit) {
    saveSequencesOnScoresheet();
    sequences = [];
  }
}

function saveSequencesOnScoresheet() {
  let finalCanvas = createGraphics(2750, 3300);
  finalCanvas.clear();
  finalCanvas.image(scoresheet, 0, 0);

  // Set up text properties
  finalCanvas.fill('#663300');
  finalCanvas.noStroke();
  if (isFontLoaded) {
    finalCanvas.textFont(terzaFont);
  }
  finalCanvas.textSize(36);

  // Add header texts
  let selectedPrompt = promptSelect.value();
  if (selectedPrompt && selectedPrompt !== "Select a prompt...") {
    finalCanvas.textAlign(LEFT, TOP);
    finalCanvas.text(selectedPrompt, 244, 50);
  }

  let userName = window.nameInput.value();
  if (userName) {
    finalCanvas.textAlign(RIGHT, TOP);
    finalCanvas.text('Your Name: ' + userName, 2306, 50);
  }

  // Define layout parameters
  const horizontalMargin = 244 - (2062 * 0.15);
  const availableWidth = 2062;
  const linePositions = [286, 594, 902, 1210, 1518, 1826, 2134, 2442];
  const sequenceWidth = availableWidth * 1.15;

  for (let i = 0; i < sequences.length; i++) {
    let sequence = sequences[i];
    if (!sequence || !sequence.canvas) continue;

    let sequenceHeight = sequence.canvas.height;
    let xPos = horizontalMargin + (availableWidth - sequenceWidth) / 2;
    let yPos = linePositions[i] - sequenceHeight / 2;

    finalCanvas.push();
    finalCanvas.translate(xPos, yPos);
    finalCanvas.image(sequence.canvas, 0, 0, sequenceWidth, sequenceHeight);
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

    draw = !draw;
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
  // Face landmarks configuration
  const faceLandmarks = {
    eyes: [33, 133],
    mouth: [168],
    faceOutline: [10, 338, 297, 332, 284, 251, 389, 356]
  };

  const handLandmarks = [
    [16, 18, 20],  // Right hand
    [15, 17, 19]   // Left hand
  ];

  // Enable smooth circles
  smooth();

  // Draw face outline points
  fill('#FFFFCC');
  stroke('#663300');
  strokeWeight(1);
  for (let i of faceLandmarks.faceOutline) {
    let p = points[i];
    if (p) {
      circle(p.x, p.y, 30); // Perfect circles for face outline
    }
  }

  // Draw eyes and mouth with brighter yellow fill
  fill('#FFFF99');
  stroke('#663300');
  strokeWeight(1);

  // Draw eyes
  for (let i of faceLandmarks.eyes) {
    let p = points[i];
    if (p) {
      circle(p.x, p.y, 25); // Perfect circles for eyes
    }
  }

  // Draw mouth
  for (let i of faceLandmarks.mouth) {
    let p = points[i];
    if (p) {
      circle(p.x, p.y, 45); // Perfect circle for mouth
    }
  }

  // Draw hand landmarks
  fill('#FFFFCC');
  for (let hand of handLandmarks) {
    for (let i of hand) {
      let p = points[i];
      if (p) {
        let dotSize = map(p.movement, 0, 50, 16, 48, true);
        circle(p.x, p.y, dotSize); // Perfect circles for hand dots
      }
    }
  }
}

// Add this new function for responsive font sizing
function updateFontSize() {
  // Base size on screen width, with minimum and maximum bounds
  let scale = windowWidth / 1920; // 1920px as reference width
  currentFontSize = Math.min(Math.max(baseFontSize * scale, 14), 20); // Min 14px, max 20px
  
  // Update all text elements
  selectAll('div, input').forEach(element => {
    if (element.style('font-size')) {
      element.style('font-size', currentFontSize + 'px');
    }
  });
}