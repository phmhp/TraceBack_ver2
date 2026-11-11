# Usage: frames-at.py clipdir mark:+ms ...  -> prints frame paths
import json, sys
d = sys.argv[1]; c = json.load(open(d + "/clip.json"))
m = {e["name"]: e["t"] for e in c["events"] if e["type"] == "mark"}
for spec in sys.argv[2:]:
    name, off = spec.split(":"); T = m[name] + int(off)
    print(d + "/" + min(c["frames"], key=lambda x: abs(x["t"] - T))["f"])
