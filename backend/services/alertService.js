function analyzeData(fluid, drip, bubble) {
    let status = "NORMAL";
    let clamp = false;
    
    if (bubble == 1 || fluid<15) {
        status = "CRITICAL";
        clamp = true;
    } else if (drip < 10) {
        status = "WARNING";
    }
    return { status, clamp };
}
export default analyzeData;