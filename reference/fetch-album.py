import json, os, subprocess, sys, time

album = sys.argv[1]; dest = sys.argv[2]
entries = [e for e in json.load(open(album)) if e[0] == 3]
todo = [(u, m) for _, u, m in entries if not os.path.exists(os.path.join(dest, f"flickr_{m['id']}.jpg"))]
print(f"{len(entries)} in album, {len(todo)} to fetch", flush=True)

fails = []
for i, (url, meta) in enumerate(todo, 1):
    path = os.path.join(dest, f"flickr_{meta['id']}.jpg")
    tmp = path + ".part"
    ok = False
    for attempt in range(1, 6):
        r = subprocess.run(["curl", "-s", "-f", "-o", tmp, "-w", "%{http_code}", url], capture_output=True, text=True)
        if r.returncode == 0 and os.path.getsize(tmp) > 10000:
            os.replace(tmp, path)
            json.dump(meta, open(path + ".json", "w"), indent=2, ensure_ascii=False)
            ok = True
            break
        print(f"  retry {attempt} on {meta['id']} (http {r.stdout.strip()})", flush=True)
        time.sleep(float(os.environ.get("BACKOFF", "15")) * attempt)
    if not ok:
        fails.append(meta['id'])
        if os.path.exists(tmp): os.remove(tmp)
    if i % 25 == 0 or i == len(todo):
        print(f"{i}/{len(todo)} done, {len(fails)} failed", flush=True)
    time.sleep(float(os.environ.get("PACE", "1.2")))

print("FAILED:", fails if fails else "none", flush=True)
sys.exit(1 if fails else 0)
