// Entry point. The game itself always runs inside a fixed 1600×900 iframe (see ui/FixedStageShell.tsx);
// the iframe document (and ?noframe / dev showrooms) loads the game directly.
const params = new URLSearchParams(location.search);
const bare = window.self !== window.top || params.has("noframe") || params.has("showroom");
if (bare) {
  void import("./main");
} else {
  void import("./ui/FixedStageShell").then(module => module.mountShell(document.getElementById("root")!));
}
