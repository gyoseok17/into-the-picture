"""관광지 시군구 코드 엑셀 → JSON 변환 + 요약 출력.

실행:  python design-process/parse_sigungu.py
입력:  design-process/data/한국관광공사_OpenAPI_관광지_시군구_코드정보_v1.0.xlsx
출력:  design-process/data/sigungu-codes.json
"""
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
import json
from collections import OrderedDict
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import setup_utf8

setup_utf8()
HERE = Path(__file__).resolve().parent
XLSX = HERE / "data" / "한국관광공사_OpenAPI_관광지_시군구_코드정보_v1.0.xlsx"
OUT = HERE / "data" / "sigungu-codes.json"
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


def main():
    if not XLSX.exists():
        raise SystemExit("엑셀 파일이 없습니다: %s" % XLSX)
    z = zipfile.ZipFile(XLSX)
    shared = [
        "".join(t.text or "" for t in si.iter(NS + "t"))
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall(NS + "si")
    ]
    root = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows = []
    for r in root.iter(NS + "row"):
        cells = {}
        for c in r.findall(NS + "c"):
            v = c.find(NS + "v")
            if v is None:
                continue
            col = re.match(r"[A-Z]+", c.get("r")).group()
            cells[col] = shared[int(v.text)] if c.get("t") == "s" else v.text
        rows.append(cells)

    data = [
        {"areaCd": r.get("A"), "areaNm": r.get("B"),
         "sigunguCd": r.get("C"), "sigunguNm": r.get("D")}
        for r in rows[1:] if r.get("A")
    ]
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    cnt = OrderedDict()
    for d in data:
        cnt[(d["areaCd"], d["areaNm"])] = cnt.get((d["areaCd"], d["areaNm"]), 0) + 1
    print("총 %d개 시군구 / 시도 %d개  →  저장: %s" % (len(data), len(cnt), OUT))
    print("\n[시도별 시군구 수]")
    for (cd, nm), n in cnt.items():
        print("  %s %s: %d개" % (cd, nm, n))


if __name__ == "__main__":
    main()
