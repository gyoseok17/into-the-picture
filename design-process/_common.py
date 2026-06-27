"""공통 유틸 — 키 로딩 + HTTP 헬퍼. 표준 라이브러리만 사용 (설치 불필요)."""
import json
import ssl
import sys
import urllib.parse
import urllib.request
from pathlib import Path


def project_root() -> Path:
    """design-process/ 의 상위 = 프로젝트 루트."""
    return Path(__file__).resolve().parents[1]


def setup_utf8():
    """윈도우 콘솔에서도 한글이 안 깨지게 stdout을 UTF-8로."""
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def _ctx():
    c = ssl.create_default_context()
    c.check_hostname = False
    c.verify_mode = ssl.CERT_NONE
    return c


def load_keys() -> dict:
    """프로젝트 루트의 .env 에서 키를 읽는다 (DATA_GO_KR_KEY, KAKAO_REST_KEY)."""
    keys = {"data": None, "kakao": None}
    candidates = [project_root() / ".env", Path(__file__).resolve().parent / ".env"]
    f = next((c for c in candidates if c.exists()), None)
    if f is None:
        raise SystemExit(".env 를 찾을 수 없습니다 (프로젝트 루트).")
    for line in f.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k == "DATA_GO_KR_KEY":
            keys["data"] = v
        elif k == "KAKAO_REST_KEY":
            keys["kakao"] = v
    return keys


def get_json(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=40, context=_ctx()) as r:
        return json.load(r)


def data_go_kr(path, params, key):
    """한국관광공사 data.go.kr API 호출. path 예: 'PhokoAwrdService/phokoAwrdList'"""
    base = "https://apis.data.go.kr/B551011/" + path + "?"
    p = {"serviceKey": key, "MobileOS": "ETC", "MobileApp": "IntoThePicture", "_type": "json"}
    p.update(params)
    return get_json(base + urllib.parse.urlencode(p))


def kakao_local(kind, query, key, size=1, extra=None):
    """카카오 로컬 검색. kind: 'keyword' | 'address' | 'category'"""
    p = {"query": query, "size": size}
    if extra:
        p.update(extra)
    url = "https://dapi.kakao.com/v2/local/search/%s.json?" % kind + urllib.parse.urlencode(p)
    return get_json(url, {"Authorization": "KakaoAK " + key})
