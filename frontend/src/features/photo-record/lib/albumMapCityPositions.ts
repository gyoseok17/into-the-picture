/**
 * Coordinates are percentage positions on album-map-korea-six-regions.svg.
 * The artwork is illustrative rather than a geographic projection, so these
 * are deliberately calibrated to its six region paths (not raw latitude and
 * longitude). Keep this catalog beside the map asset contract when redrawing
 * the artwork.
 */
export interface AlbumMapPosition {
  left: number
  top: number
}

const point = (left: number, top: number): AlbumMapPosition => ({ left, top })

export const albumMapCityPositions: Readonly<Record<string, AlbumMapPosition>> = {
  // 수도권
  SEOUL: point(36, 29), INCHEON: point(25, 31), SUWON: point(35, 38), SEONGNAM: point(39, 34), UIJEONGBU: point(37, 24), ANYANG: point(33, 35), BUCHEON: point(29, 32), GWANGMYEONG: point(31, 34), PYEONGTAEK: point(34, 45), DONGDUCHEON: point(37, 20), ANSAN: point(29, 39), GOYANG: point(31, 26), GWACHEON: point(35, 33), GURI: point(40, 28), NAMYANGJU: point(43, 26), OSAN: point(35, 41), SIHEUNG: point(28, 36), GUNPO: point(33, 38), UIWANG: point(35, 37), HANAM: point(42, 31), YONGIN: point(40, 39), PAJU: point(32, 21), ICHEON: point(45, 39), ANSEONG: point(40, 44), GIMPO: point(26, 27), HWASEONG: point(30, 42), GYEONGGI_GWANGJU: point(43, 35), YANGJU: point(38, 22), POCHEON: point(43, 19), YEOJU: point(48, 42), GAPYEONG: point(48, 23), YANGPYEONG: point(48, 32), YEONCHEON: point(35, 15),

  // 강원
  CHUNCHEON: point(51, 26), WONJU: point(60, 33), GANGNEUNG: point(73, 30), DONGHAE: point(75, 37), TAEBAEK: point(66, 32), SOKCHO: point(67, 17), SAMCHEOK: point(76, 43), HONGCHEON: point(57, 29), HOENGSEONG: point(59, 33), YEONGWOL: point(68, 35), PYEONGCHANG: point(68, 34), JEONGSEON: point(71, 37), CHEORWON: point(44, 14), HWACHEON: point(51, 17), YANGGU: point(58, 17), INJE: point(61, 20), GANGWON_GOSEONG: point(64, 12), YANGYANG: point(68, 22),

  // 충청
  DAEJEON: point(48, 51), SEJONG: point(43, 46), CHEONGJU: point(50, 43), CHUNGJU: point(58, 43), JECHON: point(63, 42), BOEUN: point(52, 49), OKCHEON: point(54, 51), YEONGDONG: point(57, 54), JEUNGPYEONG: point(50, 44), JINCHEON: point(46, 43), GOESAN: point(56, 46), EUMSEONG: point(53, 43), DANYANG: point(66, 40), CHEONAN: point(37, 43), GONGJU: point(40, 47), BORYEONG: point(29, 50), ASAN: point(32, 44), SEOSAN: point(24, 47), NONSAN: point(43, 52), GYERYONG: point(43, 50), DANGJIN: point(27, 41), GEUMSAN: point(48, 53), BUYEO: point(32, 50), SEOCHEON: point(28, 50), CHEONGYANG: point(36, 48), HONGSEONG: point(32, 46), YESAN: point(31, 44), TAEAN: point(22, 43),

  // 전라
  GWANGJU: point(32, 71), JEONJU: point(36, 63), GUNSAN: point(25, 60), IKSAN: point(30, 61), JEONGEUP: point(29, 68), NAMWON: point(40, 70), GIMJE: point(31, 66), WANJU: point(38, 60), JINAN: point(43, 64), MUJU: point(44, 59), JANGSU: point(44, 68), IMSIL: point(38, 68), SUNCHANG: point(34, 72), GOCHANG: point(24, 70), BUAN: point(22, 65), MOKPO: point(20, 75), YEOSU: point(44, 75), SUNCHEON: point(38, 75), NAJU: point(29, 74), GWANGYANG: point(43, 74), DAMYANG: point(35, 70), GOKSEONG: point(39, 72), GURYE: point(45, 75), GOHEUNG: point(38, 76), BOSEONG: point(35, 78), HWASUN: point(32, 74), JANGHEUNG: point(30, 75), GANGJIN: point(27, 75), HAENAM: point(25, 77), YEONGAM: point(23, 78), MUAN: point(21, 75), HAMPYEONG: point(23, 72), YEONGGWANG: point(20, 68), JANGSEONG: point(29, 70), WANDO: point(32, 89), JINDO: point(16, 75), SINAN: point(19, 72),

  // 경상
  BUSAN: point(72, 68), DAEGU: point(63, 65), ULSAN: point(75, 66), POHANG: point(76, 59), GYEONGJU: point(72, 63), GIMCHEON: point(55, 63), ANDONG: point(64, 51), GUMI: point(60, 62), YEONGJU: point(62, 46), YEONGCHEON: point(67, 67), SANGJU: point(55, 55), MUNGYEONG: point(54, 48), GYEONGSAN: point(65, 67), UISEONG: point(63, 56), CHEONGSONG: point(69, 55), YEONGYANG: point(70, 50), YEONGDEOK: point(75, 54), CHEONGDO: point(64, 70), GORYEONG: point(58, 67), SEONGJU: point(58, 64), CHILGOK: point(60, 63), YECHON: point(59, 51), BONGHWA: point(67, 44), ULJIN: point(77, 47), ULLEUNG: point(78, 51), CHANGWON: point(61, 71), JINJU: point(54, 72), TONGYEONG: point(60, 72), SACHEON: point(54, 74), GIMHAE: point(66, 71), MIRYANG: point(65, 70), GEOJE: point(69, 74), YANGSAN: point(69, 67), UIRYEONG: point(59, 70), HAMAN: point(59, 73), CHANGNYEONG: point(62, 70), GYEONGNAM_GOSEONG: point(60, 71), NAMHAE: point(52, 74), HADONG: point(51, 73), SANCHEONG: point(49, 71), HAMYANG: point(47, 69), GEOCHANG: point(51, 66), HAPCHEON: point(55, 68),

  // 제주
  JEJU_CITY: point(33, 87), SEOGWIPO: point(35, 90),
}

export function getAlbumMapCityPosition(cityCode?: string | null): AlbumMapPosition | undefined {
  return cityCode ? albumMapCityPositions[cityCode] : undefined
}
