function analyzeData(fluid, drip, bubble) {
  const level = Number(fluid);
  const drops = Number(drip);
  const bubbleDetected = Number(bubble) === 1;

  let status = "NORMAL";
  let clamp = false;

  // =====================================================
  // CRITICAL CONDITIONS
  // =====================================================

  // Bubble detected
  if (bubbleDetected) {
    status = "CRITICAL";
    clamp = true;
  }

  // Fluid 10% or below
  else if (level <= 10) {
    status = "CRITICAL";
    clamp = true;
  }

  // =====================================================
  // WARNING CONDITION
  // =====================================================

  // Fluid between 11% and 20%
  else if (level <= 20) {
    status = "WARNING";
    clamp = false;
  }

  // Optional drip warning
  else if (drops < 10) {
    status = "WARNING";
    clamp = false;
  }

  // =====================================================
  // NORMAL
  // =====================================================

  else {
    status = "NORMAL";
    clamp = false;
  }

  return {
    status,
    clamp
  };
}

export default analyzeData;