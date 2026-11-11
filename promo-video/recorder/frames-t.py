# Usage: frames-t.py clipdir ms ms ... -> frame paths at absolute clip times
import json, sys
d = sys.argv[1]; c = json.load(open(d + "/clip.json"))
for t in sys.argv[2:]: print(d + "/" + min(c["frames"], key=lambda x: abs(x["t"] - int(t)))["f"])
