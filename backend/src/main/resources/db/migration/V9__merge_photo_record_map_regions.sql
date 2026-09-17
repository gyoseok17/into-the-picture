UPDATE photo_record
SET map_region_code = 'GYEONGSANG'
WHERE map_region_code IN ('GYEONGBUK', 'GYEONGNAM');

UPDATE photo_record
SET map_region_code = 'JEOLLA'
WHERE map_region_code IN ('JEONBUK', 'JEONNAM');
