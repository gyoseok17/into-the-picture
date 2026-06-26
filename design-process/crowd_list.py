"""특정 시군구의 집중률 대상 관광지 목록 조회.

시군구 코드는 design-process/data/sigungu-codes.json 참고.

실행:  python design-process/crowd_list.py [areaCd] [sigunguCd]
기본:  48 48890  (경상남도 합천군)
"""
import os
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import load_keys, data_go_kr, setup_utf8

setup_utf8()


def main():
    area = sys.argv[1] if len(sys.argv) > 1 else "48"
    sigungu = sys.argv[2] if len(sys.argv) > 2 else "48890"
    key = load_keys()["data"]
    if not key:
        raise SystemExit("data.go.kr 인증키를 secrets.local.txt 에서 못 찾음")

    resp = data_go_kr("TatsCnctrRateService/tatsCnctrRatedList",
                      {"numOfRows": 2000, "pageNo": 1, "areaCd": area, "signguCd": sigungu}, key)
    items = resp["response"]["body"]["items"]["item"]
    names = Counter(i["tAtsNm"] for i in items)
    region = items[0]["areaNm"] + " " + items[0]["signguNm"] if items else "%s/%s" % (area, sigungu)
    print("[%s] 집중률 대상 관광지 %d곳 (총 레코드 %d = 관광지 x 30일)\n" % (region, len(names), len(items)))
    for nm in sorted(names):
        print("  -", nm)


if __name__ == "__main__":
    main()
