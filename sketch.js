// Modify these variables to account for full screen
let video;
let pose;
let poses = [];
let faceMesh;
let faceResults = null;
let bodyScale = 1.0; // Global body scale factor
let faceBodyRatio = 0.7; // Ratio to maintain face-to-body proportion
let overallScale = 0.7; // Overall scale for both face and body
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
  "This is my story of..."
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
  burgerMenu.style('border', 'none');
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
  video.size(windowWidth, windowHeight);
  video.hide();

  // Initialize Pose for body tracking
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

  // Initialize Face Mesh for facial features
  faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  faceMesh.onResults(onFaceResults);

  const camera = new Camera(video.elt, {
    onFrame: async () => {
      await pose.send({ image: video.elt });
      await faceMesh.send({ image: video.elt });
    },
    width: windowWidth,
    height: windowHeight
  });

  camera.start();
  isWebcamActive = true;
}

function onPoseResults(results) {
  if (results.poseLandmarks) {
    poses = results.poseLandmarks;
  }
}

function onFaceResults(results) {
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    faceResults = results.multiFaceLandmarks[0];
  }
}

function draw() {
  clear();
  
  // Draw webcam feed
  if (video && isWebcamActive) {
    push();
    translate(width, 0);
    scale(-1, 1);
    
    let vidRatio = video.width / video.height;
    let screenRatio = width / height;
    
    if (vidRatio > screenRatio) {
      let newWidth = height * vidRatio;
      image(video, -(newWidth), 0, newWidth, height);
    } else {
      let newHeight = width / vidRatio;
      image(video, -width, (height - newHeight) / 2, width, newHeight);
    }
    
    pop();
    
    fill(255, 255, 204, 30);
    noStroke();
    rect(0, 0, width, height);
  } else {
    fill('#FAF2F6');
    noStroke();
    rect(0, 0, width, height);
  }

  if (poses.length > 0 && isWebcamActive) {
    // Calculate body scale based on face size
    calculateBodyScale();
    
    push();
    translate(width, 0);
    scale(-1, 1);
    
    // Get scaled body points
    let points = getScaledBodyPoints(poses);

    drawThickLines(points);
    drawDottedBezierArmsAndLegs(points);
    drawLandmarks(points);
    detectRightHandWave(points);
    
    pop();
  }

  // Update progress display
  if (isWebcamActive) {
    let progressText = `Frames: ${savedFrames.length}/${frameLimit} | Sequences: ${sequences.length}/${sequenceLimit}<br><span style="font-size: ${currentFontSize}px; color: #663300; margin-top: 8px; display: block;">Wave your right hand to capture frames. When you complete the sequence, it exports as a scoresheet.</span>`;
    progressDisplay.html(progressText);
  }
}

// New function to calculate body scale based on face size
function calculateBodyScale() {
  if (!faceResults || !poses) return;
  
  // Get face bounds
  let faceMinX = 1, faceMaxX = 0, faceMinY = 1, faceMaxY = 0;
  for (let landmark of faceResults) {
    faceMinX = Math.min(faceMinX, landmark.x);
    faceMaxX = Math.max(faceMaxX, landmark.x);
    faceMinY = Math.min(faceMinY, landmark.y);
    faceMaxY = Math.max(faceMaxY, landmark.y);
  }
  
  let faceWidth = (faceMaxX - faceMinX) * width;
  let faceHeight = (faceMaxY - faceMinY) * height;
  let faceSize = (faceWidth + faceHeight) / 2;
  
  // Get shoulder width for body reference
  let leftShoulder = poses[11];
  let rightShoulder = poses[12];
  if (leftShoulder && rightShoulder) {
    let shoulderWidth = dist(leftShoulder.x * width, leftShoulder.y * height, 
                             rightShoulder.x * width, rightShoulder.y * height);
    
    // Calculate ideal shoulder width based on face size
    // Face is typically 1/3 to 1/4 of shoulder width
    let idealShoulderWidth = faceSize * 3.5;
    
    // Calculate scale factor
    bodyScale = idealShoulderWidth / shoulderWidth;
    
    // Limit scale to reasonable bounds
    bodyScale = constrain(bodyScale, 0.5, 1.5);
  }
}

// New function to get scaled body points
function getScaledBodyPoints(originalPoses) {
  // Find body center (between hips)
  let leftHip = originalPoses[23];
  let rightHip = originalPoses[24];
  let centerX = (leftHip.x + rightHip.x) / 2;
  let centerY = (leftHip.y + rightHip.y) / 2;
  
  // Scale points around body center
  return originalPoses.map((lm, index) => {
    // Scale face-related landmarks too (0-10 are face outline in pose)
    if (index <= 10) {
      let scaledX = centerX + (lm.x - centerX) * overallScale;
      let scaledY = centerY + (lm.y - centerY) * overallScale;
      return {
        x: scaledX * width,
        y: scaledY * height,
        movement: 0
      };
    }
    
    // Scale body landmarks
    let scaledX = centerX + (lm.x - centerX) * bodyScale * faceBodyRatio * overallScale;
    let scaledY = centerY + (lm.y - centerY) * bodyScale * faceBodyRatio * overallScale;
    
    let x = scaledX * width;
    let y = scaledY * height;
    
    let prev = prevPositions[index] || { x, y };
    let movement = dist(x, y, prev.x, prev.y);
    prevPositions[index] = { x, y };
    
    return { x, y, movement };
  });
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
      let frameWidth = windowWidth * sizeVariation;
      let frameHeight = (windowHeight * sizeVariation) * 0.5;
      let frameCanvas = createGraphics(frameWidth, frameHeight);
      
      frameCanvas.clear();
      
      if (poses.length > 0) {
        // Store current body scale for this frame
        let frameBodyScale = bodyScale;
        let strokeScale = map(sizeVariation, 0.3, 2.5, 0.3, 2.0);
        
        // Calculate center point for scaling
        let leftHip = poses[23];
        let rightHip = poses[24];
        let centerX = (leftHip.x + rightHip.x) / 2;
        let centerY = (leftHip.y + rightHip.y) / 2;
        
        // Scale all points including face for frames
        let scaledPoints = poses.map((lm, index) => {
          if (index <= 10) {
            // Face points
            let scaledX = centerX + (lm.x - centerX) * overallScale;
            let scaledY = centerY + (lm.y - centerY) * overallScale;
            return {
              x: scaledX * frameWidth + frameWidth/6,
              y: scaledY * frameHeight
            };
          }
          
          // Body points
          let scaledX = centerX + (lm.x - centerX) * frameBodyScale * faceBodyRatio * overallScale;
          let scaledY = centerY + (lm.y - centerY) * frameBodyScale * faceBodyRatio * overallScale;
          
          return {
            x: scaledX * frameWidth + frameWidth/6,
            y: scaledY * frameHeight
          };
        });
        
        // Draw thick lines with scaled points
        frameCanvas.stroke('#663300');
        frameCanvas.strokeCap(SQUARE);
        frameCanvas.strokeWeight(100 * strokeScale * faceBodyRatio * overallScale);
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
        frameCanvas.strokeWeight(2 * strokeScale);
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
        
        // Draw body landmarks
        frameCanvas.fill('#FFFFCC');
        frameCanvas.stroke('#663300');
        frameCanvas.strokeWeight(1.5 * strokeScale);
        const bodyLandmarks = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
        for (let i of bodyLandmarks) {
          let p = scaledPoints[i];
          if (p) {
            frameCanvas.ellipse(p.x, p.y, 15 * strokeScale * faceBodyRatio, 15 * strokeScale * faceBodyRatio);
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
  let spacing = availableWidth / 6; // Adjusted spacing for 6 frames
  
  // Calculate the maximum height needed
  let maxHeight = 0;
  for (let frame of savedFrames) {
    let frameHeight = (spacing * 0.9 * frame.sizeVariation) * 0.5; // Adjusted aspect ratio
    maxHeight = Math.max(maxHeight, frameHeight);
  }
  
  // Create canvas with dynamic height based on content
  let sequenceCanvas = createGraphics(availableWidth, maxHeight * 1.2);
  sequenceCanvas.clear();

  // Place frames with proper spacing
  for (let i = 0; i < savedFrames.length; i++) {
    let frame = savedFrames[i];
    let baseX = i * spacing + spacing/2; // Center each frame in its space
    
    let xOffset = random(-10, 10);
    let yOffset = random(-5, 5);
    
    // Calculate frame dimensions
    let frameWidth = spacing * 0.8 * frame.sizeVariation;
    let frameHeight = frameWidth * 0.5; // Maintain aspect ratio
    
    let xPos = baseX - frameWidth/2 + xOffset;
    let yPos = (sequenceCanvas.height - frameHeight) / 2 + yOffset;
    
    sequenceCanvas.push();
    sequenceCanvas.translate(xPos + frameWidth/2, yPos + frameHeight/2);
    sequenceCanvas.rotate(random(-0.02, 0.02)); // Reduced rotation
    sequenceCanvas.image(frame.canvas, -frameWidth/2, -frameHeight/2, frameWidth, frameHeight);
    sequenceCanvas.pop();
  }

  sequences.push({
    canvas: sequenceCanvas,
    height: sequenceCanvas.height
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
  const horizontalMargin = 244;
  const availableWidth = 2062;
  const linePositions = [286, 594, 902, 1210, 1518, 1826, 2134, 2442];

  for (let i = 0; i < sequences.length; i++) {
    let sequence = sequences[i];
    if (!sequence || !sequence.canvas) continue;

    let sequenceHeight = sequence.canvas.height;
    let xPos = horizontalMargin;
    let yPos = linePositions[i] - sequenceHeight / 2;

    finalCanvas.push();
    finalCanvas.translate(xPos, yPos);
    finalCanvas.image(sequence.canvas, 0, 0, availableWidth, sequenceHeight);
    finalCanvas.pop();
  }

  console.log("✅ Saving final scoresheet...");
  
  // Create a unique filename with timestamp
  let timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  let filename = `wave_sequences_${timestamp}.png`;
  
  // Get the canvas element
  let canvas = finalCanvas.canvas;
  
  // Convert canvas to blob
  canvas.toBlob(function(blob) {
    // Create a download link
    let link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(link.href);
    console.log(`✅ Scoresheet saved as ${filename}`);
  }, 'image/png');
}

function drawThickLines(points) {
  let connections = [
    [11, 23], [12, 24], [23, 24],
    [23, 25], [25, 27], [24, 26], [26, 28]
  ];
  stroke('#663300');
  strokeCap(SQUARE);
  strokeWeight(105 * faceBodyRatio * overallScale); // Increased to 105
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
  // Draw body landmarks
  fill('#FFFFCC');
  stroke('#663300');
  strokeWeight(1);
  
  // Draw specific body points with scaled size
  const bodyLandmarks = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  for (let i of bodyLandmarks) {
    let p = points[i];
    if (p) {
      let dotSize = p.movement ? map(p.movement, 0, 50, 20, 48, true) : 20;
      circle(p.x, p.y, dotSize * faceBodyRatio); // Scale dots with body
    }
  }

  // Draw facial features if face mesh data is available
  if (faceResults) {
    drawFacialFeatures();
  }
}

function drawFacialFeatures() {
  if (!poses || poses.length === 0) return;
  
  // Face Mesh landmark indices for different facial features
  const faceFeatures = {
    leftEyebrow: [46, 53, 52, 65, 55, 70, 63, 105, 66, 107],
    rightEyebrow: [276, 283, 282, 295, 285, 300, 293, 334, 296, 336],
    leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
    rightEye: [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382],
    nose: [1, 2, 5, 4, 6, 19, 20, 94, 125, 235, 236, 3],
    outerLips: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308]
  };

  push();
  translate(width, 0);
  scale(-1, 1);

  // Get body center for scaling reference
  let leftHip = poses[23];
  let rightHip = poses[24];
  let centerX = (leftHip.x + rightHip.x) / 2 * width;
  let centerY = (leftHip.y + rightHip.y) / 2 * height;

  // Draw eyebrows with dotted lines
  stroke('#663300');
  strokeWeight(2 * overallScale);
  noFill();
  
  drawDottedPath(faceFeatures.leftEyebrow, centerX, centerY);
  drawDottedPath(faceFeatures.rightEyebrow, centerX, centerY);

  // Draw eyes as circles
  fill('#FFFF99');
  stroke('#663300');
  strokeWeight(1.5 * overallScale);
  
  let leftEyeCenter = getFeatureCenter(faceFeatures.leftEye, centerX, centerY);
  if (leftEyeCenter) {
    circle(leftEyeCenter.x, leftEyeCenter.y, 30 * overallScale);
  }
  
  let rightEyeCenter = getFeatureCenter(faceFeatures.rightEye, centerX, centerY);
  if (rightEyeCenter) {
    circle(rightEyeCenter.x, rightEyeCenter.y, 30 * overallScale);
  }

  // Draw nose as circle
  fill('#FFFF99');
  stroke('#663300');
  strokeWeight(1.5 * overallScale);
  let noseCenter = getFeatureCenter(faceFeatures.nose.slice(0, 4), centerX, centerY);
  if (noseCenter) {
    circle(noseCenter.x, noseCenter.y, 25 * overallScale);
  }

  // Draw mouth with dotted lines
  stroke('#663300');
  strokeWeight(2 * overallScale);
  noFill();
  drawDottedPath(faceFeatures.outerLips, centerX, centerY);

  pop();
}

function drawDottedPath(indices, centerX, centerY) {
  if (!faceResults) return;
  
  let points = [];
  for (let i of indices) {
    let landmark = faceResults[i];
    if (landmark) {
      // Scale face points around body center
      let scaledX = centerX + ((1 - landmark.x) * width - centerX) * overallScale;
      let scaledY = centerY + (landmark.y * height - centerY) * overallScale;
      points.push({
        x: scaledX,
        y: scaledY
      });
    }
  }
  
  if (points.length < 2) return;
  
  for (let i = 0; i < points.length - 1; i++) {
    drawDottedLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
  }
}

function drawDottedLine(x1, y1, x2, y2) {
  let d = dist(x1, y1, x2, y2);
  let step = 8;
  let draw = true;
  
  for (let i = 0; i <= d; i += step) {
    let t = i / d;
    let x = lerp(x1, x2, t);
    let y = lerp(y1, y2, t);
    
    if (draw && i + step <= d) {
      let nextT = (i + step) / d;
      let nextX = lerp(x1, x2, nextT);
      let nextY = lerp(y1, y2, nextT);
      line(x, y, nextX, nextY);
    }
    draw = !draw;
  }
}

function getFeatureCenter(indices, centerX, centerY) {
  if (!faceResults) return null;
  
  let sumX = 0, sumY = 0, count = 0;
  
  for (let i of indices) {
    let landmark = faceResults[i];
    if (landmark) {
      let scaledX = centerX + ((1 - landmark.x) * width - centerX) * overallScale;
      let scaledY = centerY + (landmark.y * height - centerY) * overallScale;
      sumX += scaledX;
      sumY += scaledY;
      count++;
    }
  }
  
  if (count === 0) return null;
  
  return {
    x: sumX / count,
    y: sumY / count
  };
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

function drawFacialFeaturesOnCanvas(canvas, scaledFaceResults, strokeScale) {
  if (!scaledFaceResults) return;
  
  const faceFeatures = {
    leftEyebrow: [46, 53, 52, 65, 55, 70, 63, 105, 66, 107],
    rightEyebrow: [276, 283, 282, 295, 285, 300, 293, 334, 296, 336],
    leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
    rightEye: [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382],
    nose: [1, 2, 5, 4, 6],
    outerLips: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87]
  };
  
  // Draw eyebrows
  canvas.stroke('#663300');
  canvas.strokeWeight(1.5 * strokeScale);
  canvas.noFill();
  
  drawDottedPathOnCanvas(canvas, scaledFaceResults, faceFeatures.leftEyebrow);
  drawDottedPathOnCanvas(canvas, scaledFaceResults, faceFeatures.rightEyebrow);
  
  // Draw eyes
  canvas.fill('#FFFF99');
  canvas.stroke('#663300');
  canvas.strokeWeight(1 * strokeScale);
  
  let leftEyeCenter = getFeatureCenterScaled(scaledFaceResults, faceFeatures.leftEye);
  if (leftEyeCenter) {
    canvas.circle(leftEyeCenter.x, leftEyeCenter.y, 20 * strokeScale);
  }
  
  let rightEyeCenter = getFeatureCenterScaled(scaledFaceResults, faceFeatures.rightEye);
  if (rightEyeCenter) {
    canvas.circle(rightEyeCenter.x, rightEyeCenter.y, 20 * strokeScale);
  }
  
  // Draw nose
  let noseCenter = getFeatureCenterScaled(scaledFaceResults, faceFeatures.nose);
  if (noseCenter) {
    canvas.circle(noseCenter.x, noseCenter.y, 18 * strokeScale);
  }
  
  // Draw mouth
  canvas.stroke('#663300');
  canvas.strokeWeight(1.5 * strokeScale);
  canvas.noFill();
  drawDottedPathOnCanvas(canvas, scaledFaceResults, faceFeatures.outerLips);
}

function drawDottedPathOnCanvas(canvas, scaledResults, indices) {
  let points = [];
  for (let i of indices) {
    if (scaledResults[i]) {
      points.push(scaledResults[i]);
    }
  }
  
  if (points.length < 2) return;
  
  for (let i = 0; i < points.length - 1; i++) {
    drawDottedLineOnCanvas(canvas, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
  }
}

function drawDottedLineOnCanvas(canvas, x1, y1, x2, y2) {
  let d = dist(x1, y1, x2, y2);
  let step = 6;
  let draw = true;
  
  for (let i = 0; i <= d; i += step) {
    let t = i / d;
    let x = lerp(x1, x2, t);
    let y = lerp(y1, y2, t);
    
    if (draw && i + step <= d) {
      let nextT = (i + step) / d;
      let nextX = lerp(x1, x2, nextT);
      let nextY = lerp(y1, y2, nextT);
      canvas.line(x, y, nextX, nextY);
    }
    draw = !draw;
  }
}

function getFeatureCenterScaled(scaledResults, indices) {
  let sumX = 0, sumY = 0, count = 0;
  
  for (let i of indices) {
    if (scaledResults[i]) {
      sumX += scaledResults[i].x;
      sumY += scaledResults[i].y;
      count++;
    }
  }
  
  if (count === 0) return null;
  
  return {
    x: sumX / count,
    y: sumY / count
  };
}