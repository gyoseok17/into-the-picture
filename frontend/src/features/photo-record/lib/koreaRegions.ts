export interface KoreaCity {
  code: string
  label: string
}

export interface KoreaRegion {
  code: string
  label: string
  svgId: string
  cities: KoreaCity[]
}

const city = (code: string, label: string): KoreaCity => ({ code, label })

/**
 * 사진 기록의 지역 선택 기준은 docs/11-city-county-count.md의 161개 시·군이다.
 * 지도는 여섯 권역으로 보이지만, 저장값은 권역 코드 + 시·군 코드로 유지한다.
 */
export const koreaRegions: KoreaRegion[] = [
  {
    code: 'CAPITAL', label: '수도권', svgId: 'region-gyeonggi', cities: [
      city('SEOUL', '서울특별시'), city('INCHEON', '인천광역시'),
      city('SUWON', '수원시'), city('SEONGNAM', '성남시'), city('UIJEONGBU', '의정부시'), city('ANYANG', '안양시'), city('BUCHEON', '부천시'), city('GWANGMYEONG', '광명시'), city('PYEONGTAEK', '평택시'), city('DONGDUCHEON', '동두천시'), city('ANSAN', '안산시'), city('GOYANG', '고양시'), city('GWACHEON', '과천시'), city('GURI', '구리시'), city('NAMYANGJU', '남양주시'), city('OSAN', '오산시'), city('SIHEUNG', '시흥시'), city('GUNPO', '군포시'), city('UIWANG', '의왕시'), city('HANAM', '하남시'), city('YONGIN', '용인시'), city('PAJU', '파주시'), city('ICHEON', '이천시'), city('ANSEONG', '안성시'), city('GIMPO', '김포시'), city('HWASEONG', '화성시'), city('GYEONGGI_GWANGJU', '광주시'), city('YANGJU', '양주시'), city('POCHEON', '포천시'), city('YEOJU', '여주시'), city('GAPYEONG', '가평군'), city('YANGPYEONG', '양평군'), city('YEONCHEON', '연천군'),
    ],
  },
  {
    code: 'GANGWON', label: '강원', svgId: 'region-gangwon', cities: [
      city('CHUNCHEON', '춘천시'), city('WONJU', '원주시'), city('GANGNEUNG', '강릉시'), city('DONGHAE', '동해시'), city('TAEBAEK', '태백시'), city('SOKCHO', '속초시'), city('SAMCHEOK', '삼척시'), city('HONGCHEON', '홍천군'), city('HOENGSEONG', '횡성군'), city('YEONGWOL', '영월군'), city('PYEONGCHANG', '평창군'), city('JEONGSEON', '정선군'), city('CHEORWON', '철원군'), city('HWACHEON', '화천군'), city('YANGGU', '양구군'), city('INJE', '인제군'), city('GANGWON_GOSEONG', '고성군'), city('YANGYANG', '양양군'),
    ],
  },
  {
    code: 'CHUNGCHEONG', label: '충청', svgId: 'region-chungcheong', cities: [
      city('DAEJEON', '대전광역시'), city('SEJONG', '세종특별자치시'),
      city('CHEONGJU', '청주시'), city('CHUNGJU', '충주시'), city('JECHON', '제천시'), city('BOEUN', '보은군'), city('OKCHEON', '옥천군'), city('YEONGDONG', '영동군'), city('JEUNGPYEONG', '증평군'), city('JINCHEON', '진천군'), city('GOESAN', '괴산군'), city('EUMSEONG', '음성군'), city('DANYANG', '단양군'),
      city('CHEONAN', '천안시'), city('GONGJU', '공주시'), city('BORYEONG', '보령시'), city('ASAN', '아산시'), city('SEOSAN', '서산시'), city('NONSAN', '논산시'), city('GYERYONG', '계룡시'), city('DANGJIN', '당진시'), city('GEUMSAN', '금산군'), city('BUYEO', '부여군'), city('SEOCHEON', '서천군'), city('CHEONGYANG', '청양군'), city('HONGSEONG', '홍성군'), city('YESAN', '예산군'), city('TAEAN', '태안군'),
    ],
  },
  {
    code: 'JEOLLA', label: '전라', svgId: 'region-jeolla', cities: [
      city('GWANGJU', '광주광역시'),
      city('JEONJU', '전주시'), city('GUNSAN', '군산시'), city('IKSAN', '익산시'), city('JEONGEUP', '정읍시'), city('NAMWON', '남원시'), city('GIMJE', '김제시'), city('WANJU', '완주군'), city('JINAN', '진안군'), city('MUJU', '무주군'), city('JANGSU', '장수군'), city('IMSIL', '임실군'), city('SUNCHANG', '순창군'), city('GOCHANG', '고창군'), city('BUAN', '부안군'),
      city('MOKPO', '목포시'), city('YEOSU', '여수시'), city('SUNCHEON', '순천시'), city('NAJU', '나주시'), city('GWANGYANG', '광양시'), city('DAMYANG', '담양군'), city('GOKSEONG', '곡성군'), city('GURYE', '구례군'), city('GOHEUNG', '고흥군'), city('BOSEONG', '보성군'), city('HWASUN', '화순군'), city('JANGHEUNG', '장흥군'), city('GANGJIN', '강진군'), city('HAENAM', '해남군'), city('YEONGAM', '영암군'), city('MUAN', '무안군'), city('HAMPYEONG', '함평군'), city('YEONGGWANG', '영광군'), city('JANGSEONG', '장성군'), city('WANDO', '완도군'), city('JINDO', '진도군'), city('SINAN', '신안군'),
    ],
  },
  {
    code: 'GYEONGSANG', label: '경상', svgId: 'region-gyeongsang', cities: [
      city('BUSAN', '부산광역시'), city('DAEGU', '대구광역시'), city('ULSAN', '울산광역시'),
      city('POHANG', '포항시'), city('GYEONGJU', '경주시'), city('GIMCHEON', '김천시'), city('ANDONG', '안동시'), city('GUMI', '구미시'), city('YEONGJU', '영주시'), city('YEONGCHEON', '영천시'), city('SANGJU', '상주시'), city('MUNGYEONG', '문경시'), city('GYEONGSAN', '경산시'), city('UISEONG', '의성군'), city('CHEONGSONG', '청송군'), city('YEONGYANG', '영양군'), city('YEONGDEOK', '영덕군'), city('CHEONGDO', '청도군'), city('GORYEONG', '고령군'), city('SEONGJU', '성주군'), city('CHILGOK', '칠곡군'), city('YECHON', '예천군'), city('BONGHWA', '봉화군'), city('ULJIN', '울진군'), city('ULLEUNG', '울릉군'),
      city('CHANGWON', '창원시'), city('JINJU', '진주시'), city('TONGYEONG', '통영시'), city('SACHEON', '사천시'), city('GIMHAE', '김해시'), city('MIRYANG', '밀양시'), city('GEOJE', '거제시'), city('YANGSAN', '양산시'), city('UIRYEONG', '의령군'), city('HAMAN', '함안군'), city('CHANGNYEONG', '창녕군'), city('GYEONGNAM_GOSEONG', '고성군'), city('NAMHAE', '남해군'), city('HADONG', '하동군'), city('SANCHEONG', '산청군'), city('HAMYANG', '함양군'), city('GEOCHANG', '거창군'), city('HAPCHEON', '합천군'),
    ],
  },
  {
    code: 'JEJU', label: '제주', svgId: 'region-jeju', cities: [
      city('JEJU_CITY', '제주시'), city('SEOGWIPO', '서귀포시'),
    ],
  },
]

export function getKoreaRegion(code?: string | null): KoreaRegion | undefined {
  return koreaRegions.find((region) => region.code === code)
}

export function getKoreaCity(regionCode?: string | null, cityCode?: string | null): KoreaCity | undefined {
  return getKoreaRegion(regionCode)?.cities.find((item) => item.code === cityCode)
}
