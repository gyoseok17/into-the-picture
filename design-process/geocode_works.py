"""공모전 수상작 촬영지 → 카카오 지오코딩(좌표) 변환 테스트.

촬영지 텍스트(예: "경상남도 합천군, 가야산국립공원")를
콤마 뒤 장소명으로 키워드 검색 → 실패 시 행정구역 주소 검색 폴백.

실행:  python design-process/geocode_works.py [건수]   (기본 8)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import load_keys, data_go_kr, kakao_local, setup_utf8

setup_utf8()


def geocode(loc, kakao_key):
    parts = [p.strip() for p in loc.replace("/", ",").split(",") if p.strip()]
    place = parts[-1] if parts else loc
    region = parts[0] if parts else loc
    for q in (place, loc):
        docs = kakao_local("keyword", q, kakao_key, size=1).get("documents", [])
        if docs:
            d = docs[0]
            return "키워드", d.get("place_name"), d["y"], d["x"]
    docs = kakao_local("address", region, kakao_key, size=1).get("documents", [])
    if docs:
        d = docs[0]
        return "주소폴백", d.get("address_name"), d["y"], d["x"]
    return None


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 8
    keys = load_keys()
    if not keys["data"] or not keys["kakao"]:
        raise SystemExit("data.go.kr 인증키 또는 kakao 키가 secrets.local.txt 에 없음")

    resp = data_go_kr("PhokoAwrdService/phokoAwrdList", {"numOfRows": n, "pageNo": 1}, keys["data"])
    items = resp["response"]["body"]["items"]["item"]

    ok = 0
    for it in items:
        loc = it.get("koFilmst", "")
        title = it.get("koTitle", "")
        r = geocode(loc, keys["kakao"])
        if r:
            ok += 1
            src, name, lat, lng = r
            print("[OK/%s] '%s' | %s\n        → '%s' (위도 %s, 경도 %s)" % (src, title, loc, name, lat, lng))
        else:
            print("[실패] '%s' | %s" % (title, loc))
    print("\n=== 지오코딩 성공 %d/%d ===" % (ok, len(items)))


if __name__ == "__main__":
    main()
