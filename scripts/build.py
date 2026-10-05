from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import argparse
import hashlib
import json

root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument("--platform",choices=["browser","yandex"],default="browser")
args=parser.parse_args()
files=[root/"index.html",root/"scripts/bootstrap.js"]
if args.platform=="browser":
    files.extend(root/name for name in ("launcher.py","run.bat","README.md"))
    files.extend(p for p in (root/"docs").glob("*.md") if p.is_file())
for folder in ("css","js","vendor","assets"):
    files.extend(p for p in (root/folder).rglob("*") if p.is_file())
assert all(p.exists() for p in files)
assert sum(p.stat().st_size for p in files)<100*1024*1024
out=root/"artifacts"
out.mkdir(exist_ok=True)
archive=out/f"revenge-of-the-king-{args.platform}.zip"
with ZipFile(archive,"w",ZIP_DEFLATED) as z:
    for p in sorted(files):
        name=p.relative_to(root).as_posix()
        assert name.isascii() and " " not in name
        data=p.read_bytes()
        if name=="index.html" and args.platform=="yandex":
            data=data.replace(b'<html lang="ru">',b'<html lang="ru" data-platform="yandex">')
        z.writestr(name,data)
print(json.dumps({"archive":str(archive),"files":len(files),"uncompressedBytes":sum(p.stat().st_size for p in files),"compressedBytes":archive.stat().st_size,"sha256":hashlib.sha256(archive.read_bytes()).hexdigest()},ensure_ascii=False))
