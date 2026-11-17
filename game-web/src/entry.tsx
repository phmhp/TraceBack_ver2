// Render the game in the current document. The previous outer iframe made
// annotation/accessibility tools resolve inner DOMRects in a different
// coordinate space from the painted screen. GameStage owns the fixed
// 1600×900 canvas and applies the letterbox scale without introducing a
// second document coordinate system.
void import("./main");
