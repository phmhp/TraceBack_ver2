// Lists which generated images are still missing for the EV additions (or all parts with --all).
// Run: npm run assets:check
import { existsSync } from "node:fs";
import { PARTS } from "./image-prompt-data.mjs";

const all = process.argv.includes("--all");
const root = new URL("../public/assets/intake/images/", import.meta.url);
const DOMAIN_FOLDER = {
  "01-driver-input": "HMI", "02-sensors": "sensors", "03-ecu": "ecu", "04-power-battery": "power-battery", "05-drivetrain": "drivetrain",
  "06-brake": "brake", "07-steering-suspension": "steering-suspension", "08-thermal": "thermal", "09-charging": "charging",
  "10-network-diagnostics": "network-diagnostics", "13-garage-additions": "garage-additions",
};
const files = part => part.styles.flatMap(style => style === "EVID" ? [`${part.id}__EVID-ok.png`, `${part.id}__EVID-fault.png`] : [`${part.id}__${style}.png`]);

let missing = 0, total = 0;
for (const part of PARTS) {
  const folder = part.folder ?? DOMAIN_FOLDER[part.domain];
  if (!folder || (!all && part.domain !== "14-ev-additions")) continue;
  for (const file of files(part)) {
    total++;
    if (!existsSync(new URL(`${folder}/${file}`, root))) { missing++; console.log(`MISSING  ${folder}/${file}`); }
  }
}
console.log(`\n${total - missing}/${total} present, ${missing} missing`);
process.exitCode = missing ? 1 : 0;
