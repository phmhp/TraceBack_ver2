// App entry.  The game always renders on a fixed 1600x900 canvas: at the top level we only mount a tiny
// letterbox host that scales an iframe of the game as one piece, so text, boxes, media queries, drag and 3D picking
// behave identically at every window size.  Inside the iframe (or with ?noscale) we load the real app.
const params = new URLSearchParams(location.search);
const standalone = window.self !== window.top || params.has("embed") || params.has("noscale") || params.has("showroom");
if (standalone) void import("./main");
else void import("./ui/ScaledFrame").then(module => module.mountScaledFrame());
