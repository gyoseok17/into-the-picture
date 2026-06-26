"""한국관광공사 3개 API 샘플 응답 출력 (공모전 수상작 / 관광사진 / 집중률).

실행:  python design-process/call_tour_apis.py
"""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import load_keys, data_go_kr, setup_utf8

setup_utf8()


def show(title, resp, n=2):
    print("\n" + "=" * 12 + " " + title + " " + "=" * 12)
    body = resp.get("response", {}).get("body", {})
    items = body.get("items", {})
    items = items.get("item", []) if isinstance(items, dict) else []
    print("totalCount:", body.get("totalCount"))
    for it in items[:n]:
        print(json.dumps(it, ensure_ascii=False, indent=2))


def main():
    key = load_keys()["data"]
    if not key:
        raise SystemExit("data.go.kr 인증키를 secrets.local.txt 에서 못 찾음")

    show("공모전 수상작 phokoAwrdList",
         data_go_kr("PhokoAwrdService/phokoAwrdList", {"numOfRows": 2, "pageNo": 1}, key))
    show("관광사진 galleryList1",
         data_go_kr("PhotoGalleryService1/galleryList1", {"numOfRows": 2, "pageNo": 1, "arrange": "A"}, key))
    show("집중률 tatsCnctrRatedList (합천 48/48890)",
         data_go_kr("TatsCnctrRateService/tatsCnctrRatedList",
                    {"numOfRows": 3, "pageNo": 1, "areaCd": "48", "signguCd": "48890"}, key), n=3)


if __name__ == "__main__":
    main()
