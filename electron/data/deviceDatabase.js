// Comprehensive Android Device Database
// Maps OEM model numbers and hardware identifiers to official marketing names and brands.

export const DEVICE_CATALOG = {
  // ==========================================
  // ONEPLUS (Complete Historical & Modern Lineup)
  // ==========================================
  // Legacy OnePlus
  'A0001': { brand: 'OnePlus', model: 'OnePlus One' },
  'A2001': { brand: 'OnePlus', model: 'OnePlus 2' },
  'A2003': { brand: 'OnePlus', model: 'OnePlus 2' },
  'A2005': { brand: 'OnePlus', model: 'OnePlus 2' },
  'E1001': { brand: 'OnePlus', model: 'OnePlus X' },
  'E1003': { brand: 'OnePlus', model: 'OnePlus X' },
  'A3000': { brand: 'OnePlus', model: 'OnePlus 3' },
  'A3003': { brand: 'OnePlus', model: 'OnePlus 3' },
  'A3010': { brand: 'OnePlus', model: 'OnePlus 3T' },
  'A5000': { brand: 'OnePlus', model: 'OnePlus 5' },
  'A5010': { brand: 'OnePlus', model: 'OnePlus 5T' },
  'A6000': { brand: 'OnePlus', model: 'OnePlus 6' },
  'A6003': { brand: 'OnePlus', model: 'OnePlus 6' },
  'A6010': { brand: 'OnePlus', model: 'OnePlus 6T' },
  'A6013': { brand: 'OnePlus', model: 'OnePlus 6T' },
  
  // OnePlus 7 Series
  'GM1900': { brand: 'OnePlus', model: 'OnePlus 7' },
  'GM1901': { brand: 'OnePlus', model: 'OnePlus 7' },
  'GM1903': { brand: 'OnePlus', model: 'OnePlus 7' },
  'GM1905': { brand: 'OnePlus', model: 'OnePlus 7' },
  'GM1910': { brand: 'OnePlus', model: 'OnePlus 7 Pro' },
  'GM1911': { brand: 'OnePlus', model: 'OnePlus 7 Pro' },
  'GM1913': { brand: 'OnePlus', model: 'OnePlus 7 Pro' },
  'GM1917': { brand: 'OnePlus', model: 'OnePlus 7 Pro' },
  'GM1920': { brand: 'OnePlus', model: 'OnePlus 7 Pro 5G' },
  'GM1925': { brand: 'OnePlus', model: 'OnePlus 7 Pro 5G' },
  'HD1900': { brand: 'OnePlus', model: 'OnePlus 7T' },
  'HD1901': { brand: 'OnePlus', model: 'OnePlus 7T' },
  'HD1903': { brand: 'OnePlus', model: 'OnePlus 7T' },
  'HD1905': { brand: 'OnePlus', model: 'OnePlus 7T' },
  'HD1907': { brand: 'OnePlus', model: 'OnePlus 7T' },
  'HD1910': { brand: 'OnePlus', model: 'OnePlus 7T Pro' },
  'HD1911': { brand: 'OnePlus', model: 'OnePlus 7T Pro' },
  'HD1913': { brand: 'OnePlus', model: 'OnePlus 7T Pro' },
  'HD1925': { brand: 'OnePlus', model: 'OnePlus 7T Pro 5G McLaren' },

  // OnePlus 8 Series
  'IN2010': { brand: 'OnePlus', model: 'OnePlus 8' },
  'IN2011': { brand: 'OnePlus', model: 'OnePlus 8' },
  'IN2013': { brand: 'OnePlus', model: 'OnePlus 8' },
  'IN2015': { brand: 'OnePlus', model: 'OnePlus 8' },
  'IN2017': { brand: 'OnePlus', model: 'OnePlus 8 (T-Mobile)' },
  'IN2019': { brand: 'OnePlus', model: 'OnePlus 8 5G UW (Verizon)' },
  'IN2020': { brand: 'OnePlus', model: 'OnePlus 8 Pro' },
  'IN2021': { brand: 'OnePlus', model: 'OnePlus 8 Pro' },
  'IN2023': { brand: 'OnePlus', model: 'OnePlus 8 Pro' },
  'IN2025': { brand: 'OnePlus', model: 'OnePlus 8 Pro' },
  'KB2000': { brand: 'OnePlus', model: 'OnePlus 8T' },
  'KB2001': { brand: 'OnePlus', model: 'OnePlus 8T' },
  'KB2003': { brand: 'OnePlus', model: 'OnePlus 8T' },
  'KB2005': { brand: 'OnePlus', model: 'OnePlus 8T' },
  'KB2007': { brand: 'OnePlus', model: 'OnePlus 8T+ 5G' },

  // OnePlus 9 Series
  'LE2110': { brand: 'OnePlus', model: 'OnePlus 9' },
  'LE2111': { brand: 'OnePlus', model: 'OnePlus 9' },
  'LE2113': { brand: 'OnePlus', model: 'OnePlus 9' },
  'LE2115': { brand: 'OnePlus', model: 'OnePlus 9' },
  'LE2117': { brand: 'OnePlus', model: 'OnePlus 9 (T-Mobile)' },
  'LE2120': { brand: 'OnePlus', model: 'OnePlus 9 Pro' },
  'LE2121': { brand: 'OnePlus', model: 'OnePlus 9 Pro' },
  'LE2123': { brand: 'OnePlus', model: 'OnePlus 9 Pro' },
  'LE2125': { brand: 'OnePlus', model: 'OnePlus 9 Pro' },
  'LE2127': { brand: 'OnePlus', model: 'OnePlus 9 Pro (T-Mobile)' },
  'LE2100': { brand: 'OnePlus', model: 'OnePlus 9R' },
  'LE2101': { brand: 'OnePlus', model: 'OnePlus 9R' },
  'MT2110': { brand: 'OnePlus', model: 'OnePlus 9RT 5G' },
  'MT2111': { brand: 'OnePlus', model: 'OnePlus 9RT 5G' },

  // OnePlus 10 Series
  'NE2210': { brand: 'OnePlus', model: 'OnePlus 10 Pro' },
  'NE2211': { brand: 'OnePlus', model: 'OnePlus 10 Pro' },
  'NE2213': { brand: 'OnePlus', model: 'OnePlus 10 Pro' },
  'NE2215': { brand: 'OnePlus', model: 'OnePlus 10 Pro' },
  'NE2217': { brand: 'OnePlus', model: 'OnePlus 10 Pro (T-Mobile)' },
  'CPH2411': { brand: 'OnePlus', model: 'OnePlus 10R 5G' },
  'CPH2423': { brand: 'OnePlus', model: 'OnePlus 10R 150W' },
  'CPH2413': { brand: 'OnePlus', model: 'OnePlus 10T 5G' },
  'CPH2415': { brand: 'OnePlus', model: 'OnePlus 10T 5G' },
  'CPH2417': { brand: 'OnePlus', model: 'OnePlus 10T 5G' },

  // OnePlus 11, 12, 13 & Open Series
  'PHB110': { brand: 'OnePlus', model: 'OnePlus 11' },
  'CPH2447': { brand: 'OnePlus', model: 'OnePlus 11' },
  'CPH2449': { brand: 'OnePlus', model: 'OnePlus 11' },
  'CPH2451': { brand: 'OnePlus', model: 'OnePlus 11' },
  'CPH2487': { brand: 'OnePlus', model: 'OnePlus 11R 5G' },
  'PJD110': { brand: 'OnePlus', model: 'OnePlus 12' },
  'CPH2573': { brand: 'OnePlus', model: 'OnePlus 12' },
  'CPH2581': { brand: 'OnePlus', model: 'OnePlus 12' },
  'CPH2583': { brand: 'OnePlus', model: 'OnePlus 12' },
  'CPH2609': { brand: 'OnePlus', model: 'OnePlus 12R' },
  'CPH2611': { brand: 'OnePlus', model: 'OnePlus 12R' },
  'CPH2551': { brand: 'OnePlus', model: 'OnePlus Open' },
  'PJG110': { brand: 'OnePlus', model: 'OnePlus 13' },
  'CPH2653': { brand: 'OnePlus', model: 'OnePlus 13' },

  // OnePlus Nord Series
  'AC2001': { brand: 'OnePlus', model: 'OnePlus Nord' },
  'AC2003': { brand: 'OnePlus', model: 'OnePlus Nord' },
  'BE2025': { brand: 'OnePlus', model: 'OnePlus Nord N10 5G' },
  'BE2026': { brand: 'OnePlus', model: 'OnePlus Nord N10 5G' },
  'BE2028': { brand: 'OnePlus', model: 'OnePlus Nord N10 5G' },
  'BE2029': { brand: 'OnePlus', model: 'OnePlus Nord N10 5G' },
  'BE2011': { brand: 'OnePlus', model: 'OnePlus Nord N100' },
  'BE2012': { brand: 'OnePlus', model: 'OnePlus Nord N100' },
  'BE2013': { brand: 'OnePlus', model: 'OnePlus Nord N100' },
  'DE2117': { brand: 'OnePlus', model: 'OnePlus Nord N200 5G' },
  'DE2118': { brand: 'OnePlus', model: 'OnePlus Nord N200 5G' },
  'EB2101': { brand: 'OnePlus', model: 'OnePlus Nord CE 5G' },
  'EB2103': { brand: 'OnePlus', model: 'OnePlus Nord CE 5G' },
  'DN2101': { brand: 'OnePlus', model: 'OnePlus Nord 2 5G' },
  'DN2103': { brand: 'OnePlus', model: 'OnePlus Nord 2 5G' },
  'IV2201': { brand: 'OnePlus', model: 'OnePlus Nord CE 2 5G' },
  'CPH2381': { brand: 'OnePlus', model: 'OnePlus Nord CE 2 Lite 5G' },
  'CPH2399': { brand: 'OnePlus', model: 'OnePlus Nord 2T' },
  'CPH2401': { brand: 'OnePlus', model: 'OnePlus Nord 2T' },
  'CPH2455': { brand: 'OnePlus', model: 'OnePlus Nord N20 5G' },
  'CPH2513': { brand: 'OnePlus', model: 'OnePlus Nord 3 5G' },
  'CPH2491': { brand: 'OnePlus', model: 'OnePlus Nord CE 3 Lite 5G' },
  'CPH2493': { brand: 'OnePlus', model: 'OnePlus Nord CE 3 Lite 5G' },
  'CPH2569': { brand: 'OnePlus', model: 'OnePlus Nord CE 3 5G' },
  'CPH2613': { brand: 'OnePlus', model: 'OnePlus Nord CE 4 5G' },
  'CPH2619': { brand: 'OnePlus', model: 'OnePlus Nord CE 4 Lite 5G' },
  'CPH2621': { brand: 'OnePlus', model: 'OnePlus Nord 4 5G' },

  // ==========================================
  // XIAOMI / REDMI / POCO
  // ==========================================
  // POCO F & X Series
  'POCOPHONE F1': { brand: 'POCO', model: 'POCO F1' },
  'beryllium': { brand: 'POCO', model: 'POCO F1' },
  'M2004J11G': { brand: 'POCO', model: 'POCO F2 Pro' },
  'M2012K11AG': { brand: 'POCO', model: 'POCO F3' },
  '22011211G': { brand: 'POCO', model: 'POCO F4' },
  '22041216G': { brand: 'POCO', model: 'POCO F4 GT' },
  '23049PCD8G': { brand: 'POCO', model: 'POCO F5' },
  '23013PC75G': { brand: 'POCO', model: 'POCO F5 Pro' },
  '24069PC21G': { brand: 'POCO', model: 'POCO F6' },
  '24053PY09G': { brand: 'POCO', model: 'POCO F6 Pro' },
  'M2007J20CG': { brand: 'POCO', model: 'POCO X3 NFC' },
  'M2102J20SG': { brand: 'POCO', model: 'POCO X3 Pro' },
  '21091116UG': { brand: 'POCO', model: 'POCO X3 GT' },
  '2201116PG': { brand: 'POCO', model: 'POCO X4 Pro 5G' },
  '22041216UG': { brand: 'POCO', model: 'POCO X4 GT' },
  '22101320G': { brand: 'POCO', model: 'POCO X5 5G' },
  '22101320I': { brand: 'POCO', model: 'POCO X5 5G' },
  '22101316G': { brand: 'POCO', model: 'POCO X5 Pro 5G' },
  '23122PCD1G': { brand: 'POCO', model: 'POCO X6 5G' },
  '2311DRK48G': { brand: 'POCO', model: 'POCO X6 Pro 5G' },
  'M2010J19CG': { brand: 'POCO', model: 'POCO M3' },
  'M2103K19PG': { brand: 'POCO', model: 'POCO M3 Pro 5G' },
  '21091116AG': { brand: 'POCO', model: 'POCO M4 Pro 5G' },
  '2201117PG': { brand: 'POCO', model: 'POCO M4 Pro' },
  '22071219CG': { brand: 'POCO', model: 'POCO M5' },
  '2207117BPG': { brand: 'POCO', model: 'POCO M5s' },
  '2312CR45AG': { brand: 'POCO', model: 'POCO M6 Pro' },

  // Xiaomi Flagships
  '2203121C': { brand: 'Xiaomi', model: 'Xiaomi 12' },
  '2201123G': { brand: 'Xiaomi', model: 'Xiaomi 12' },
  '2201122G': { brand: 'Xiaomi', model: 'Xiaomi 12 Pro' },
  '2206123SC': { brand: 'Xiaomi', model: 'Xiaomi 12S' },
  '2206122SC': { brand: 'Xiaomi', model: 'Xiaomi 12S Pro' },
  '2203121SC': { brand: 'Xiaomi', model: 'Xiaomi 12S Ultra' },
  '2210132G': { brand: 'Xiaomi', model: 'Xiaomi 12T' },
  '22081212UG-T': { brand: 'Xiaomi', model: 'Xiaomi 12T Pro' },
  '2211133G': { brand: 'Xiaomi', model: 'Xiaomi 13' },
  '2210132C': { brand: 'Xiaomi', model: 'Xiaomi 13 Pro' },
  '2304FPN6DC': { brand: 'Xiaomi', model: 'Xiaomi 13 Ultra' },
  '2306EPN60G': { brand: 'Xiaomi', model: 'Xiaomi 13T' },
  '23078PND5G': { brand: 'Xiaomi', model: 'Xiaomi 13T Pro' },
  '23127PN0CG': { brand: 'Xiaomi', model: 'Xiaomi 14' },
  '23116PN5BC': { brand: 'Xiaomi', model: 'Xiaomi 14 Pro' },
  '24030PN60G': { brand: 'Xiaomi', model: 'Xiaomi 14 Ultra' },
  '24069RA21G': { brand: 'Xiaomi', model: 'Xiaomi 14T' },
  '2407FPN8EG': { brand: 'Xiaomi', model: 'Xiaomi 14T Pro' },

  // Redmi Note Series
  'whyred': { brand: 'Redmi', model: 'Redmi Note 5 Pro' },
  'Redmi_Note_5_Pro': { brand: 'Redmi', model: 'Redmi Note 5 Pro' },
  'Redmi Note 5 Pro': { brand: 'Redmi', model: 'Redmi Note 5 Pro' },
  'MEI7S': { brand: 'Redmi', model: 'Redmi Note 5 Pro' },
  'M2002F4LG': { brand: 'Xiaomi', model: 'Mi Note 10 Lite' },
  'M2101K7BNY': { brand: 'Redmi', model: 'Redmi Note 10 5G' },
  'M2101K7AG': { brand: 'Redmi', model: 'Redmi Note 10' },
  'M2101K6G': { brand: 'Redmi', model: 'Redmi Note 10 Pro' },
  '2201117TY': { brand: 'Redmi', model: 'Redmi Note 11' },
  '2201117PG-R': { brand: 'Redmi', model: 'Redmi Note 11S' },
  '2201116TG': { brand: 'Redmi', model: 'Redmi Note 11 Pro' },
  '2201116SG': { brand: 'Redmi', model: 'Redmi Note 11 Pro 5G' },
  '22101316UG': { brand: 'Redmi', model: 'Redmi Note 12 Pro 5G' },
  '22101316UP': { brand: 'Redmi', model: 'Redmi Note 12 Pro+ 5G' },
  '23021RAAEG': { brand: 'Redmi', model: 'Redmi Note 12 4G' },
  '23076RN4BI': { brand: 'Redmi', model: 'Redmi 12 5G' },
  '23129RAA4G': { brand: 'Redmi', model: 'Redmi Note 13 5G' },
  '23117RA68G': { brand: 'Redmi', model: 'Redmi Note 13 Pro 5G' },
  '23090RA98G': { brand: 'Redmi', model: 'Redmi Note 13 Pro+ 5G' },
  '24090RA29G': { brand: 'Redmi', model: 'Redmi Note 14 Pro 5G' },
  '24115RA8EG': { brand: 'Redmi', model: 'Redmi Note 14 Pro+ 5G' },

  // ==========================================
  // SAMSUNG GALAXY
  // ==========================================
  // S24 Series
  'SM-S921B': { brand: 'Samsung', model: 'Galaxy S24' },
  'SM-S921U': { brand: 'Samsung', model: 'Galaxy S24' },
  'SM-S926B': { brand: 'Samsung', model: 'Galaxy S24+' },
  'SM-S926U': { brand: 'Samsung', model: 'Galaxy S24+' },
  'SM-S928B': { brand: 'Samsung', model: 'Galaxy S24 Ultra' },
  'SM-S928U': { brand: 'Samsung', model: 'Galaxy S24 Ultra' },
  'SM-S9280': { brand: 'Samsung', model: 'Galaxy S24 Ultra' },
  'SM-S721B': { brand: 'Samsung', model: 'Galaxy S24 FE' },

  // S23 Series
  'SM-S911B': { brand: 'Samsung', model: 'Galaxy S23' },
  'SM-S911U': { brand: 'Samsung', model: 'Galaxy S23' },
  'SM-S916B': { brand: 'Samsung', model: 'Galaxy S23+' },
  'SM-S916U': { brand: 'Samsung', model: 'Galaxy S23+' },
  'SM-S918B': { brand: 'Samsung', model: 'Galaxy S23 Ultra' },
  'SM-S918U': { brand: 'Samsung', model: 'Galaxy S23 Ultra' },
  'SM-S711B': { brand: 'Samsung', model: 'Galaxy S23 FE' },

  // S22 Series
  'SM-S901B': { brand: 'Samsung', model: 'Galaxy S22' },
  'SM-S906B': { brand: 'Samsung', model: 'Galaxy S22+' },
  'SM-S908B': { brand: 'Samsung', model: 'Galaxy S22 Ultra' },
  'SM-S908U': { brand: 'Samsung', model: 'Galaxy S22 Ultra' },

  // S21 & S20 Series
  'SM-G991B': { brand: 'Samsung', model: 'Galaxy S21' },
  'SM-G996B': { brand: 'Samsung', model: 'Galaxy S21+' },
  'SM-G998B': { brand: 'Samsung', model: 'Galaxy S21 Ultra' },
  'SM-G990B': { brand: 'Samsung', model: 'Galaxy S21 FE 5G' },
  'SM-G980F': { brand: 'Samsung', model: 'Galaxy S20' },
  'SM-G981B': { brand: 'Samsung', model: 'Galaxy S20 5G' },
  'SM-G985F': { brand: 'Samsung', model: 'Galaxy S20+' },
  'SM-G986B': { brand: 'Samsung', model: 'Galaxy S20+ 5G' },
  'SM-G988B': { brand: 'Samsung', model: 'Galaxy S20 Ultra 5G' },
  'SM-G780F': { brand: 'Samsung', model: 'Galaxy S20 FE' },
  'SM-G781B': { brand: 'Samsung', model: 'Galaxy S20 FE 5G' },

  // Note Series
  'SM-N960F': { brand: 'Samsung', model: 'Galaxy Note 9' },
  'SM-N970F': { brand: 'Samsung', model: 'Galaxy Note 10' },
  'SM-N975F': { brand: 'Samsung', model: 'Galaxy Note 10+' },
  'SM-N770F': { brand: 'Samsung', model: 'Galaxy Note 10 Lite' },
  'SM-N980F': { brand: 'Samsung', model: 'Galaxy Note 20' },
  'SM-N981B': { brand: 'Samsung', model: 'Galaxy Note 20 5G' },
  'SM-N985F': { brand: 'Samsung', model: 'Galaxy Note 20 Ultra' },
  'SM-N986B': { brand: 'Samsung', model: 'Galaxy Note 20 Ultra 5G' },

  // Foldables (Z Fold & Z Flip)
  'SM-F900F': { brand: 'Samsung', model: 'Galaxy Fold' },
  'SM-F916B': { brand: 'Samsung', model: 'Galaxy Z Fold 2' },
  'SM-F926B': { brand: 'Samsung', model: 'Galaxy Z Fold 3' },
  'SM-F936B': { brand: 'Samsung', model: 'Galaxy Z Fold 4' },
  'SM-F946B': { brand: 'Samsung', model: 'Galaxy Z Fold 5' },
  'SM-F956B': { brand: 'Samsung', model: 'Galaxy Z Fold 6' },
  'SM-F700F': { brand: 'Samsung', model: 'Galaxy Z Flip' },
  'SM-F707B': { brand: 'Samsung', model: 'Galaxy Z Flip 5G' },
  'SM-F711B': { brand: 'Samsung', model: 'Galaxy Z Flip 3' },
  'SM-F721B': { brand: 'Samsung', model: 'Galaxy Z Flip 4' },
  'SM-F731B': { brand: 'Samsung', model: 'Galaxy Z Flip 5' },
  'SM-F741B': { brand: 'Samsung', model: 'Galaxy Z Flip 6' },

  // Galaxy A Series
  'SM-A135F': { brand: 'Samsung', model: 'Galaxy A13' },
  'SM-A145F': { brand: 'Samsung', model: 'Galaxy A14' },
  'SM-A146B': { brand: 'Samsung', model: 'Galaxy A14 5G' },
  'SM-A155F': { brand: 'Samsung', model: 'Galaxy A15' },
  'SM-A156B': { brand: 'Samsung', model: 'Galaxy A15 5G' },
  'SM-A235F': { brand: 'Samsung', model: 'Galaxy A23' },
  'SM-A245F': { brand: 'Samsung', model: 'Galaxy A24' },
  'SM-A256B': { brand: 'Samsung', model: 'Galaxy A25 5G' },
  'SM-A336B': { brand: 'Samsung', model: 'Galaxy A33 5G' },
  'SM-A346B': { brand: 'Samsung', model: 'Galaxy A34 5G' },
  'SM-A356B': { brand: 'Samsung', model: 'Galaxy A35 5G' },
  'SM-A525F': { brand: 'Samsung', model: 'Galaxy A52' },
  'SM-A526B': { brand: 'Samsung', model: 'Galaxy A52 5G' },
  'SM-A528B': { brand: 'Samsung', model: 'Galaxy A52s 5G' },
  'SM-A536B': { brand: 'Samsung', model: 'Galaxy A53 5G' },
  'SM-A546B': { brand: 'Samsung', model: 'Galaxy A54 5G' },
  'SM-A556B': { brand: 'Samsung', model: 'Galaxy A55 5G' },
  'SM-A736B': { brand: 'Samsung', model: 'Galaxy A73 5G' },

  // ==========================================
  // GOOGLE PIXEL
  // ==========================================
  'Pixel 4': { brand: 'Google', model: 'Pixel 4' },
  'Pixel 4 XL': { brand: 'Google', model: 'Pixel 4 XL' },
  'Pixel 4a': { brand: 'Google', model: 'Pixel 4a' },
  'Pixel 4a (5G)': { brand: 'Google', model: 'Pixel 4a 5G' },
  'Pixel 5': { brand: 'Google', model: 'Pixel 5' },
  'Pixel 5a': { brand: 'Google', model: 'Pixel 5a' },
  'Pixel 6': { brand: 'Google', model: 'Pixel 6' },
  'Pixel 6 Pro': { brand: 'Google', model: 'Pixel 6 Pro' },
  'Pixel 6a': { brand: 'Google', model: 'Pixel 6a' },
  'Pixel 7': { brand: 'Google', model: 'Pixel 7' },
  'Pixel 7 Pro': { brand: 'Google', model: 'Pixel 7 Pro' },
  'Pixel 7a': { brand: 'Google', model: 'Pixel 7a' },
  'Pixel Fold': { brand: 'Google', model: 'Pixel Fold' },
  'Pixel 8': { brand: 'Google', model: 'Pixel 8' },
  'Pixel 8 Pro': { brand: 'Google', model: 'Pixel 8 Pro' },
  'Pixel 8a': { brand: 'Google', model: 'Pixel 8a' },
  'Pixel 9': { brand: 'Google', model: 'Pixel 9' },
  'Pixel 9 Pro': { brand: 'Google', model: 'Pixel 9 Pro' },
  'Pixel 9 Pro XL': { brand: 'Google', model: 'Pixel 9 Pro XL' },
  'Pixel 9 Pro Fold': { brand: 'Google', model: 'Pixel 9 Pro Fold' },

  // ==========================================
  // REALME
  // ==========================================
  'RMX3363': { brand: 'Realme', model: 'Realme GT Master Edition' },
  'RMX3370': { brand: 'Realme', model: 'Realme GT Neo 2' },
  'RMX3311': { brand: 'Realme', model: 'Realme GT 2' },
  'RMX3301': { brand: 'Realme', model: 'Realme GT 2 Pro' },
  'RMX3561': { brand: 'Realme', model: 'Realme GT Neo 3' },
  'RMX3708': { brand: 'Realme', model: 'Realme GT Neo 5' },
  'RMX3709': { brand: 'Realme', model: 'Realme GT 3' },
  'RMX3851': { brand: 'Realme', model: 'Realme GT 6' },
  'RMX3850': { brand: 'Realme', model: 'Realme GT 6T' },
  'RMX3393': { brand: 'Realme', model: 'Realme 9 Pro+' },
  'RMX3630': { brand: 'Realme', model: 'Realme 10' },
  'RMX3686': { brand: 'Realme', model: 'Realme 10 Pro+' },
  'RMX3740': { brand: 'Realme', model: 'Realme 11 Pro+' },
  'RMX3840': { brand: 'Realme', model: 'Realme 12 Pro+' },
  'RMX3920': { brand: 'Realme', model: 'Realme 13 Pro+' },

  // ==========================================
  // OPPO
  // ==========================================
  'CPH2025': { brand: 'OPPO', model: 'Find X2 Pro' },
  'CPH2173': { brand: 'OPPO', model: 'Find X3 Pro' },
  'CPH2305': { brand: 'OPPO', model: 'Find X5 Pro' },
  'PGEM10': { brand: 'OPPO', model: 'Find X6 Pro' },
  'PHY110': { brand: 'OPPO', model: 'Find X7 Ultra' },
  'PEUM00': { brand: 'OPPO', model: 'Find N' },
  'PGU110': { brand: 'OPPO', model: 'Find N2' },
  'CPH2499': { brand: 'OPPO', model: 'Find N3' },
  'CPH2519': { brand: 'OPPO', model: 'Find N3 Flip' },
  'CPH2251': { brand: 'OPPO', model: 'Reno 6 Pro' },
  'CPH2371': { brand: 'OPPO', model: 'Reno 7 Pro' },
  'CPH2359': { brand: 'OPPO', model: 'Reno 8 Pro' },
  'CPH2505': { brand: 'OPPO', model: 'Reno 10 Pro+' },
  'CPH2607': { brand: 'OPPO', model: 'Reno 11 Pro' },
  'CPH2625': { brand: 'OPPO', model: 'Reno 12 Pro' },

  // ==========================================
  // VIVO & iQOO
  // ==========================================
  'V2045': { brand: 'Vivo', model: 'Vivo X60 Pro' },
  'V2105': { brand: 'Vivo', model: 'Vivo X70 Pro+' },
  'V2145': { brand: 'Vivo', model: 'Vivo X80 Pro' },
  'V2241': { brand: 'Vivo', model: 'Vivo X90' },
  'V2227A': { brand: 'Vivo', model: 'Vivo X90 Pro+' },
  'V2308': { brand: 'Vivo', model: 'Vivo X100' },
  'V2324': { brand: 'Vivo', model: 'Vivo X100 Pro' },
  'V2354A': { brand: 'Vivo', model: 'Vivo X100 Ultra' },
  'V2050': { brand: 'Vivo', model: 'Vivo V21 5G' },
  'V2130': { brand: 'Vivo', model: 'Vivo V23 Pro' },
  'V2201': { brand: 'Vivo', model: 'Vivo V25 Pro' },
  'V2246': { brand: 'Vivo', model: 'Vivo V27 Pro' },
  'V2250': { brand: 'Vivo', model: 'Vivo V29 Pro' },
  'V2318': { brand: 'Vivo', model: 'Vivo V30 Pro' },
  'V2348': { brand: 'Vivo', model: 'Vivo V40 Pro' },
  // iQOO
  'I2011': { brand: 'iQOO', model: 'iQOO 7' },
  'I2019': { brand: 'iQOO', model: 'iQOO 9 Pro' },
  'I2202': { brand: 'iQOO', model: 'iQOO 11' },
  'I2220': { brand: 'iQOO', model: 'iQOO 12' },
  'I2217': { brand: 'iQOO', model: 'iQOO Neo 7 Pro' },
  'I2301': { brand: 'iQOO', model: 'iQOO Neo 9 Pro' },
  'I2208': { brand: 'iQOO', model: 'iQOO Z7 Pro' },

  // ==========================================
  // REDMAGIC & NUBIA
  // ==========================================
  'NX629J': { brand: 'RedMagic', model: 'RedMagic 3' },
  'NX659J': { brand: 'RedMagic', model: 'RedMagic 5G' },
  'NX669J': { brand: 'RedMagic', model: 'RedMagic 6' },
  'NX669J-S': { brand: 'RedMagic', model: 'RedMagic 6S Pro' },
  'NX679J': { brand: 'RedMagic', model: 'RedMagic 7' },
  'NX709J': { brand: 'RedMagic', model: 'RedMagic 7 Pro' },
  'NX729J': { brand: 'RedMagic', model: 'RedMagic 8 Pro' },
  'NX729S': { brand: 'RedMagic', model: 'RedMagic 8S Pro' },
  'NX769J': { brand: 'RedMagic', model: 'RedMagic 9 Pro' },
  'NX769S': { brand: 'RedMagic', model: 'RedMagic 9S Pro' },
  'NX712J': { brand: 'Nubia', model: 'Nubia Z50 Ultra' },
  'NX721J': { brand: 'Nubia', model: 'Nubia Z60 Ultra' },

  // ==========================================
  // NOTHING & CMF
  // ==========================================
  'A063': { brand: 'Nothing', model: 'Nothing Phone (1)' },
  'A065': { brand: 'Nothing', model: 'Nothing Phone (2)' },
  'A142': { brand: 'Nothing', model: 'Nothing Phone (2a)' },
  'A142P': { brand: 'Nothing', model: 'Nothing Phone (2a) Plus' },
  'A015': { brand: 'CMF', model: 'CMF Phone 1' },

  // ==========================================
  // TECNO & INFINIX
  // ==========================================
  'AD8': { brand: 'Tecno', model: 'Tecno Phantom X' },
  'AD9': { brand: 'Tecno', model: 'Tecno Phantom X2' },
  'AD11': { brand: 'Tecno', model: 'Tecno Phantom V Fold' },
  'AD10': { brand: 'Tecno', model: 'Tecno Phantom V Flip' },
  'CI6': { brand: 'Tecno', model: 'Tecno Camon 19 Pro' },
  'CK7n': { brand: 'Tecno', model: 'Tecno Camon 20 Pro 5G' },
  'CK8n': { brand: 'Tecno', model: 'Tecno Camon 20 Premier' },
  'CL7': { brand: 'Tecno', model: 'Tecno Camon 30 Pro 5G' },
  'CL8': { brand: 'Tecno', model: 'Tecno Camon 30 Premier 5G' },
  'LG7n': { brand: 'Tecno', model: 'Tecno Pova 5 Pro' },
  'LI7': { brand: 'Tecno', model: 'Tecno Pova 6 Pro 5G' },
  // Infinix
  'X6711': { brand: 'Infinix', model: 'Infinix GT 10 Pro' },
  'X6871': { brand: 'Infinix', model: 'Infinix GT 20 Pro' },
  'X6833B': { brand: 'Infinix', model: 'Infinix Note 30 Pro' },
  'X6850': { brand: 'Infinix', model: 'Infinix Note 40 Pro' },
  'X6820': { brand: 'Infinix', model: 'Infinix Zero Ultra' },

  // Moto G Series
  'XT2363-1': { brand: 'Motorola', model: 'Moto G34 5G' },
  'XT2363-2': { brand: 'Motorola', model: 'Moto G34 5G' },
  'XT2363-3': { brand: 'Motorola', model: 'Moto G34 5G' },
  'moto g34 5G': { brand: 'Motorola', model: 'Moto G34 5G' },
  'moto_g34_5G': { brand: 'Motorola', model: 'Moto G34 5G' },
  'fogos': { brand: 'Motorola', model: 'Moto G34 5G' },
  'XT2343-1': { brand: 'Motorola', model: 'Moto G54 5G' },
  'XT2433-1': { brand: 'Motorola', model: 'Moto G64 5G' },
  'XT2347-1': { brand: 'Motorola', model: 'Moto G84 5G' },
  'XT2237-1': { brand: 'Motorola', model: 'Moto G73 5G' },
  'XT2225-1': { brand: 'Motorola', model: 'Moto G82 5G' },
  'XT2087-1': { brand: 'Motorola', model: 'Moto G9 Plus' },
  'XT2141-1': { brand: 'Motorola', model: 'Motorola Edge 20' },
  'XT2153-1': { brand: 'Motorola', model: 'Motorola Edge 20 Pro' },
  'XT2201-1': { brand: 'Motorola', model: 'Motorola Edge 30 Pro' },
  'XT2203-1': { brand: 'Motorola', model: 'Motorola Edge 30' },
  'XT2241-1': { brand: 'Motorola', model: 'Motorola Edge 30 Ultra' },
  'XT2301-4': { brand: 'Motorola', model: 'Motorola Edge 40 Pro' },
  'XT2303-2': { brand: 'Motorola', model: 'Motorola Edge 40' },
  'XT2401-1': { brand: 'Motorola', model: 'Motorola Edge 50 Pro' },
  'XT2403-1': { brand: 'Motorola', model: 'Motorola Edge 50 Ultra' },
  'XT2321-3': { brand: 'Motorola', model: 'Motorola Razr 40 Ultra' },
  'XT2453-3': { brand: 'Motorola', model: 'Motorola Razr 50 Ultra' },

  // ==========================================
  // HONOR & HUAWEI
  // ==========================================
  'PGT-N19': { brand: 'Honor', model: 'Honor Magic 5 Pro' },
  'BVL-N49': { brand: 'Honor', model: 'Honor Magic 6 Pro' },
  'FNE-AN00': { brand: 'Honor', model: 'Honor 70' },
  'REA-NX9': { brand: 'Honor', model: 'Honor 90' },
  'ELI-NX9': { brand: 'Honor', model: 'Honor 200 Pro' },
  'VOG-L29': { brand: 'Huawei', model: 'Huawei P30 Pro' },
  'ELS-NX9': { brand: 'Huawei', model: 'Huawei P40 Pro' },
  'JAD-LX9': { brand: 'Huawei', model: 'Huawei P50 Pro' },
  'MNA-AL00': { brand: 'Huawei', model: 'Huawei P60 Pro' },
  'HBP-AL00': { brand: 'Huawei', model: 'Huawei Pura 70 Ultra' },
  'LIO-L29': { brand: 'Huawei', model: 'Huawei Mate 30 Pro' },
  'NOH-NX9': { brand: 'Huawei', model: 'Huawei Mate 40 Pro' },
  'DCO-LX9': { brand: 'Huawei', model: 'Huawei Mate 50 Pro' },
  'ALN-AL00': { brand: 'Huawei', model: 'Huawei Mate 60 Pro' }
};

/**
 * Smart lookup function to resolve brand and friendly model name.
 * Supports exact matching, regex prefix matching, and fuzzy fallback.
 */
export function resolveDevice(rawModel, detectedBrand) {
  if (!rawModel && !detectedBrand) {
    return { brand: 'Android', model: 'Android Device' };
  }

  const clean = (rawModel || '').trim();

  // 1. Direct dictionary match
  if (DEVICE_CATALOG[clean]) {
    return DEVICE_CATALOG[clean];
  }

  // 2. Case-insensitive dictionary match
  const upper = clean.toUpperCase();
  for (const [key, data] of Object.entries(DEVICE_CATALOG)) {
    if (key.toUpperCase() === upper) {
      return data;
    }
  }

  // 3. Samsung Prefix Rule Matching (e.g. SM-S928U1, SM-S9280, SM-A546E)
  if (upper.startsWith('SM-S928')) return { brand: 'Samsung', model: 'Galaxy S24 Ultra' };
  if (upper.startsWith('SM-S926')) return { brand: 'Samsung', model: 'Galaxy S24+' };
  if (upper.startsWith('SM-S921')) return { brand: 'Samsung', model: 'Galaxy S24' };
  if (upper.startsWith('SM-S918')) return { brand: 'Samsung', model: 'Galaxy S23 Ultra' };
  if (upper.startsWith('SM-S916')) return { brand: 'Samsung', model: 'Galaxy S23+' };
  if (upper.startsWith('SM-S911')) return { brand: 'Samsung', model: 'Galaxy S23' };
  if (upper.startsWith('SM-S908')) return { brand: 'Samsung', model: 'Galaxy S22 Ultra' };
  if (upper.startsWith('SM-S906')) return { brand: 'Samsung', model: 'Galaxy S22+' };
  if (upper.startsWith('SM-S901')) return { brand: 'Samsung', model: 'Galaxy S22' };
  if (upper.startsWith('SM-F956')) return { brand: 'Samsung', model: 'Galaxy Z Fold 6' };
  if (upper.startsWith('SM-F741')) return { brand: 'Samsung', model: 'Galaxy Z Flip 6' };
  if (upper.startsWith('SM-F946')) return { brand: 'Samsung', model: 'Galaxy Z Fold 5' };
  if (upper.startsWith('SM-F731')) return { brand: 'Samsung', model: 'Galaxy Z Flip 5' };
  if (upper.startsWith('SM-A556')) return { brand: 'Samsung', model: 'Galaxy A55 5G' };
  if (upper.startsWith('SM-A546')) return { brand: 'Samsung', model: 'Galaxy A54 5G' };
  if (upper.startsWith('SM-A356')) return { brand: 'Samsung', model: 'Galaxy A35 5G' };
  if (upper.startsWith('SM-A346')) return { brand: 'Samsung', model: 'Galaxy A34 5G' };
  if (upper.startsWith('SM-A156')) return { brand: 'Samsung', model: 'Galaxy A15 5G' };
  if (upper.startsWith('SM-A146')) return { brand: 'Samsung', model: 'Galaxy A14 5G' };

  // 4. Pixel Substring Matching
  if (upper.includes('PIXEL 9 PRO XL')) return { brand: 'Google', model: 'Pixel 9 Pro XL' };
  if (upper.includes('PIXEL 9 PRO')) return { brand: 'Google', model: 'Pixel 9 Pro' };
  if (upper.includes('PIXEL 9')) return { brand: 'Google', model: 'Pixel 9' };
  if (upper.includes('PIXEL 8 PRO')) return { brand: 'Google', model: 'Pixel 8 Pro' };
  if (upper.includes('PIXEL 8A')) return { brand: 'Google', model: 'Pixel 8a' };
  if (upper.includes('PIXEL 8')) return { brand: 'Google', model: 'Pixel 8' };
  if (upper.includes('PIXEL 7 PRO')) return { brand: 'Google', model: 'Pixel 7 Pro' };
  if (upper.includes('PIXEL 7A')) return { brand: 'Google', model: 'Pixel 7a' };
  if (upper.includes('PIXEL 7')) return { brand: 'Google', model: 'Pixel 7' };
  if (upper.includes('PIXEL 6A')) return { brand: 'Google', model: 'Pixel 6a' };
  if (upper.includes('PIXEL 6 PRO')) return { brand: 'Google', model: 'Pixel 6 Pro' };
  if (upper.includes('PIXEL 6')) return { brand: 'Google', model: 'Pixel 6' };

  // 5. Intelligent Fallback with Brand
  let brand = detectedBrand || 'Android';
  let model = clean;

  if (clean) {
    const lowerClean = clean.toLowerCase();
    const lowerBrand = brand.toLowerCase();

    if (lowerClean.includes('rndis')) {
      model = `${brand} (USB Tethering)`;
    } else if (lowerClean.startsWith('moto')) {
      brand = 'Motorola';
      model = clean.replace(/^moto\b/i, 'Moto');
    } else if (lowerClean.startsWith(lowerBrand)) {
      model = clean;
    } else {
      model = `${brand} ${clean}`;
    }
  } else {
    model = `${brand} Device`;
  }

  return { brand, model };
}
