// Historical gazetteer: town name variants → present-day country and the state it belonged to in a given year.
// General guidance for research; borders moved within years (e.g. 1918–1920, 1938–1939) — confirm the exact date for a legal file.
const I = 9999, O = 0;
const AH = 'Kingdom of Hungary (Austria-Hungary)';
const AA = 'Austria (Austria-Hungary)';
const R = {
  HU: { now: 'Hungary', p: [[O, 1918, AH], [1918, I, 'Hungary']] },
  SUBCARP: { now: 'Ukraine', region: 'Subcarpathian Rus / Kárpátalja', p: [[O, 1919, AH], [1919, 1938, 'Czechoslovakia'], [1939, 1944, 'Hungary'], [1945, 1991, 'USSR (Ukrainian SSR)'], [1991, I, 'Ukraine']] },
  NTRANS: { now: 'Romania', region: 'Northern Transylvania / Máramaros / Szatmár', p: [[O, 1919, AH], [1920, 1940, 'Romania'], [1940, 1944, 'Hungary'], [1945, I, 'Romania']] },
  STRANS: { now: 'Romania', region: 'Transylvania / Banat', p: [[O, 1919, AH], [1920, I, 'Romania']] },
  SSLOV: { now: 'Slovakia', region: 'Southern Slovakia (Felvidék)', p: [[O, 1918, AH], [1919, 1938, 'Czechoslovakia'], [1938, 1945, 'Hungary'], [1945, 1992, 'Czechoslovakia'], [1993, I, 'Slovakia']] },
  SLOV: { now: 'Slovakia', region: 'Upper Hungary / Slovakia', p: [[O, 1918, AH], [1919, 1939, 'Czechoslovakia'], [1939, 1945, 'Slovak Republic (1939–45)'], [1945, 1992, 'Czechoslovakia'], [1993, I, 'Slovakia']] },
  BURG: { now: 'Austria', region: 'Burgenland', p: [[O, 1921, AH], [1921, 1938, 'Austria'], [1938, 1945, 'Germany (annexed Austria)'], [1945, I, 'Austria']] },
  AT: { now: 'Austria', p: [[O, 1918, AA], [1918, 1938, 'Austria'], [1938, 1945, 'Germany (annexed Austria)'], [1945, I, 'Austria']] },
  BOHMOR: { now: 'Czech Republic', region: 'Bohemia / Moravia', p: [[O, 1918, AA], [1918, 1939, 'Czechoslovakia'], [1939, 1945, 'Protectorate of Bohemia and Moravia (German occupation)'], [1945, 1992, 'Czechoslovakia'], [1993, I, 'Czech Republic']] },
  SUDET: { now: 'Czech Republic', region: 'Bohemia / Moravia (Sudetenland)', p: [[O, 1918, AA], [1918, 1938, 'Czechoslovakia'], [1938, 1945, 'Germany (annexed Sudetenland)'], [1945, 1992, 'Czechoslovakia'], [1993, I, 'Czech Republic']] },
  WGAL: { now: 'Poland', region: 'Western Galicia', p: [[O, 1918, AA + ' — Galicia'], [1918, 1939, 'Poland'], [1939, 1945, 'German occupation (General Government)'], [1945, I, 'Poland']] },
  EGAL: { now: 'Ukraine', region: 'Eastern Galicia', p: [[O, 1918, AA + ' — Galicia'], [1919, 1939, 'Poland'], [1939, 1941, 'USSR'], [1941, 1944, 'German occupation'], [1944, 1991, 'USSR (Ukrainian SSR)'], [1991, I, 'Ukraine']] },
  NBUK: { now: 'Ukraine', region: 'Northern Bukovina', p: [[O, 1918, AA + ' — Bukovina'], [1918, 1940, 'Romania'], [1940, 1941, 'USSR'], [1941, 1944, 'Romania'], [1944, 1991, 'USSR (Ukrainian SSR)'], [1991, I, 'Ukraine']] },
  SBUK: { now: 'Romania', region: 'Southern Bukovina', p: [[O, 1918, AA + ' — Bukovina'], [1918, I, 'Romania']] },
  CPOL: { now: 'Poland', region: 'Congress Poland', p: [[O, 1915, 'Russian Empire (Kingdom of Poland)'], [1915, 1918, 'German / Austrian occupation (WWI)'], [1918, 1939, 'Poland'], [1939, 1945, 'German occupation'], [1945, I, 'Poland']] },
  BIALY: { now: 'Poland', region: 'Białystok / Łomża region', p: [[O, 1915, 'Russian Empire'], [1919, 1939, 'Poland'], [1939, 1941, 'USSR'], [1941, 1944, 'German occupation'], [1944, I, 'Poland']] },
  KRESBY: { now: 'Belarus', region: 'Western Belarus (interwar Poland)', p: [[O, 1915, 'Russian Empire'], [1921, 1939, 'Poland'], [1939, 1941, 'USSR'], [1941, 1944, 'German occupation'], [1944, 1991, 'USSR (Byelorussian SSR)'], [1991, I, 'Belarus']] },
  VOLH: { now: 'Ukraine', region: 'Volhynia (interwar Poland)', p: [[O, 1917, 'Russian Empire'], [1921, 1939, 'Poland'], [1939, 1941, 'USSR'], [1941, 1944, 'German occupation'], [1944, 1991, 'USSR (Ukrainian SSR)'], [1991, I, 'Ukraine']] },
  VILNA: { now: 'Lithuania', region: 'Vilnius region', p: [[O, 1915, 'Russian Empire'], [1920, 1939, 'Poland'], [1939, 1940, 'Lithuania'], [1940, 1941, 'USSR'], [1941, 1944, 'German occupation'], [1944, 1990, 'USSR (Lithuanian SSR)'], [1990, I, 'Lithuania']] },
  LT: { now: 'Lithuania', p: [[O, 1915, 'Russian Empire'], [1918, 1940, 'Lithuania'], [1940, 1941, 'USSR'], [1941, 1944, 'German occupation'], [1944, 1990, 'USSR (Lithuanian SSR)'], [1990, I, 'Lithuania']] },
  LV: { now: 'Latvia', p: [[O, 1918, 'Russian Empire'], [1918, 1940, 'Latvia'], [1940, 1941, 'USSR'], [1941, 1944, 'German occupation'], [1944, 1991, 'USSR (Latvian SSR)'], [1991, I, 'Latvia']] },
  EUKR: { now: 'Ukraine', p: [[O, 1917, 'Russian Empire'], [1917, 1922, 'Ukraine (civil-war period)'], [1922, 1991, 'USSR (Ukrainian SSR)'], [1991, I, 'Ukraine']] },
  EBY: { now: 'Belarus', p: [[O, 1917, 'Russian Empire'], [1919, 1991, 'USSR (Byelorussian SSR)'], [1991, I, 'Belarus']] },
  RUS: { now: 'Russia', p: [[O, 1917, 'Russian Empire'], [1922, 1991, 'USSR (Russian SFSR)'], [1991, I, 'Russia']] },
  BESS: { now: 'Moldova', region: 'Bessarabia', p: [[O, 1918, 'Russian Empire'], [1918, 1940, 'Romania'], [1940, 1941, 'USSR'], [1941, 1944, 'Romania'], [1944, 1991, 'USSR (Moldavian SSR)'], [1991, I, 'Moldova']] },
  ROOLD: { now: 'Romania', region: 'Moldavia / Wallachia', p: [[O, I, 'Romania']] },
  DE: { now: 'Germany', p: [[O, 1918, 'German Empire'], [1918, 1933, 'Germany (Weimar Republic)'], [1933, 1945, 'Germany (Nazi period)'], [1945, 1990, 'Germany (West/East)'], [1990, I, 'Germany']] },
  DEPL: { now: 'Poland', region: 'Former eastern Germany (Silesia / Pomerania)', p: [[O, 1918, 'German Empire (Prussia)'], [1918, 1945, 'Germany'], [1945, I, 'Poland']] },
  KATO: { now: 'Poland', region: 'East Upper Silesia', p: [[O, 1922, 'Germany (Prussia)'], [1922, 1939, 'Poland'], [1939, 1945, 'Germany (annexed)'], [1945, I, 'Poland']] },
  POSEN: { now: 'Poland', region: 'Greater Poland / West Prussia', p: [[O, 1919, 'German Empire (Prussia)'], [1919, 1939, 'Poland'], [1939, 1945, 'Germany (annexed)'], [1945, I, 'Poland']] },
  DANZIG: { now: 'Poland', p: [[O, 1920, 'Germany (Prussia)'], [1920, 1939, 'Free City of Danzig'], [1939, 1945, 'Germany'], [1945, I, 'Poland']] },
  KBERG: { now: 'Russia', region: 'East Prussia', p: [[O, 1945, 'Germany (East Prussia)'], [1945, 1991, 'USSR (Russian SFSR)'], [1991, I, 'Russia']] },
  VOJV: { now: 'Serbia', region: 'Bácska / Vojvodina', p: [[O, 1918, AH], [1918, 1941, 'Yugoslavia'], [1941, 1944, 'Hungary'], [1944, 1992, 'Yugoslavia'], [2006, I, 'Serbia']] },
  BE: { now: 'Belgium', p: [[O, I, 'Belgium']] },
  NL: { now: 'Netherlands', p: [[O, I, 'Netherlands']] },
  IL: { now: 'Israel', p: [[O, 1917, 'Ottoman Empire'], [1920, 1948, 'British Mandate Palestine'], [1948, I, 'Israel']] },
  US: { now: 'United States', p: [[O, I, 'United States']] },
  UK: { now: 'United Kingdom', p: [[O, I, 'United Kingdom']] },
};
// [canonical name, region key, ...variants]
const T = `Budapest|HU|Pest|Buda|Ofen
Debrecen|HU|Debreczin
Szeged|HU|Segedin
Miskolc|HU|Miskolcz|Mishkoltz
Nyíregyháza|HU|Nyiregyhaza
Sátoraljaújhely|HU|Satoraljaujhely|Ujhel|Ihel|Újhely
Tokaj|HU|Tokay
Kisvárda|HU|Kisvarda|Kleinwardein|Kleinvardein
Mátészalka|HU|Mateszalka|Salka
Nyírbátor|HU|Nyirbator
Hajdúnánás|HU|Hajdunanas
Sopron|HU|Ödenburg|Oedenburg
Győr|HU|Gyor|Raab
Pápa|HU|Papa
Bodrogkeresztúr|HU|Kerestir|Keresztur
Abaújszántó|HU|Abaujszanto|Santov
Nagykálló|HU|Nagykallo|Kalov|Kaliv
Makó|HU|Mako|Makava
Balassagyarmat|HU|Gyarmat
Vác|HU|Vac|Waitzen
Pécs|HU|Pecs|Fünfkirchen
Eger|HU|Erlau
Kecskemét|HU|Kecskemet
Szerencs|HU|Serencs
Tállya|HU|Tallya
Munkács|SUBCARP|Mukachevo|Munkacs|Munkatch|Munkatsch|Mukacevo|Mukačevo
Ungvár|SUBCARP|Uzhhorod|Uzhgorod|Ungvar|Uzhorod|Užhorod|Ungwar
Beregszász|SUBCARP|Berehove|Beregovo|Beregszasz|Berehovo
Huszt|SUBCARP|Khust|Chust|Hust|Chust
Nagyszőlős|SUBCARP|Vynohradiv|Sevlus|Sevlush|Nagyszolos|Vinogradov
Técső|SUBCARP|Tiachiv|Tecso|Tetsh|Tyachiv|Tačovo
Rahó|SUBCARP|Rakhiv|Raho|Rachov
Szolyva|SUBCARP|Svaliava|Szolyva|Svalyava
Kőrösmező|SUBCARP|Yasinia|Korosmezo|Jasina|Yasinya
Nagybocskó|SUBCARP|Velykyi Bychkiv|Nagybocsko|Bocskó
Ökörmező|SUBCARP|Mizhhiria|Okormezo|Volove
Szerednye|SUBCARP|Seredne|Seredne
Ilosva|SUBCARP|Irshava|Ilosva
Nagyberezna|SUBCARP|Velykyi Bereznyi|Berezna
Csap|SUBCARP|Chop|Čop
Máramarossziget|NTRANS|Sighetu Marmației|Sighet|Siget|Sziget|Marmaros Sziget|Sighetu Marmatiei|Sigut
Szatmárnémeti|NTRANS|Satu Mare|Satmar|Szatmar|Szatmarnemeti|Sathmar
Nagyvárad|NTRANS|Oradea|Grosswardein|Nagyvarad|Grossvardein
Kolozsvár|NTRANS|Cluj-Napoca|Cluj|Klausenburg|Kolozsvar|Kluzh
Nagybánya|NTRANS|Baia Mare|Nagybanya|Frauenbach
Felsővisó|NTRANS|Vișeu de Sus|Viseu de Sus|Felsoviso|Ober-Wischau|Vishiva
Borsa|NTRANS|Borșa|Borsha
Dés|NTRANS|Dej|Des|Desch
Beszterce|NTRANS|Bistrița|Bistrita|Bistritz
Szilágysomlyó|NTRANS|Șimleu Silvaniei|Simleu Silvaniei|Shomlo|Szilagysomlyo
Nagykároly|NTRANS|Carei|Nagykaroly|Karoly|Karol
Szászrégen|NTRANS|Reghin|Szaszregen|Sächsisch-Regen
Marosvásárhely|NTRANS|Târgu Mureș|Targu Mures|Marosvasarhely|Neumarkt am Mieresch
Dragomérfalva|NTRANS|Dragomirești|Dragomiresti
Szaplonca|NTRANS|Săpânța|Sapanta
Avasfelsőfalu|NTRANS|Negrești-Oaș|Negresti-Oas|Avasfelsofalu
Temesvár|STRANS|Timișoara|Timisoara|Temeschburg|Temeswar|Temesvar
Arad|STRANS|Arad
Brassó|STRANS|Brașov|Brasov|Kronstadt|Brasso
Nagyszeben|STRANS|Sibiu|Hermannstadt
Lugos|STRANS|Lugoj
Gyulafehérvár|STRANS|Alba Iulia|Karlsburg|Weissenburg
Kassa|SSLOV|Košice|Kosice|Kaschau|Kashoi
Érsekújvár|SSLOV|Nové Zámky|Nove Zamky|Neuhäusel|Ersekujvar
Komárom (north)|SSLOV|Komárno|Komarno (Slovakia)|Komarom
Losonc|SSLOV|Lučenec|Lucenec|Losontz
Rimaszombat|SSLOV|Rimavská Sobota|Rimavska Sobota
Királyhelmec|SSLOV|Kráľovský Chlmec|Kralovsky Chlmec|Kiralyhelmec|Helmetz
Dunaszerdahely|SSLOV|Dunajská Streda|Dunajska Streda|Serdahel
Galánta|SSLOV|Galanta
Léva|SSLOV|Levice|Lewenz
Párkány|SSLOV|Štúrovo|Sturovo|Parkany
Rozsnyó|SSLOV|Rožňava|Roznava|Rosenau
Pozsony|SLOV|Bratislava|Pressburg|Pozsony|Preshburg
Nyitra|SLOV|Nitra|Neutra
Eperjes|SLOV|Prešov|Presov|Preschau|Pryashev
Bártfa|SLOV|Bardejov|Bartfeld|Bardiov|Bartfa
Nagymihály|SLOV|Michalovce|Nagymihaly|Mihalovitz
Homonna|SLOV|Humenné|Humenne|Homona
Pöstyén|SLOV|Piešťany|Piestany|Pistyan
Trencsén|SLOV|Trenčín|Trencin|Trentschin
Zsolna|SLOV|Žilina|Zilina|Sillein
Nagyszombat|SLOV|Trnava|Tyrnau
Sztropkó|SLOV|Stropkov|Stropkov
Varannó|SLOV|Vranov nad Topľou|Vranov|Vranov nad Toplou
Galgóc|SLOV|Hlohovec|Freistadtl
Kismarton|BURG|Eisenstadt|Ash|Asch
Nagymarton|BURG|Mattersburg|Mattersdorf
Sopronkeresztúr|BURG|Deutschkreutz|Tzelem|Zelem|Tseilem
Köpcsény|BURG|Kittsee
Boldogasszony|BURG|Frauenkirchen
Lakompak|BURG|Lackenbach
Kabold|BURG|Kobersdorf
Rohonc|BURG|Rechnitz
Vienna|AT|Wien|Bécs|Vina|Viena
Graz|AT|Graz
Linz|AT|Linz
Salzburg|AT|Salzburg
Innsbruck|AT|Innsbruck
Prague|BOHMOR|Praha|Prag|Prog
Brno|BOHMOR|Brünn|Bruenn
Boskovice|BOHMOR|Boskowitz
Olomouc|BOHMOR|Olmütz|Olmutz
Prostějov|BOHMOR|Prossnitz|Prostejov
Třebíč|BOHMOR|Trebitsch|Trebic
Plzeň|BOHMOR|Pilsen|Plzen
Ostrava|BOHMOR|Mährisch Ostrau
Mikulov|SUDET|Nikolsburg|Nikolsburg
Teplice|SUDET|Teplitz|Teplitz-Schönau
Karlovy Vary|SUDET|Karlsbad|Carlsbad
Kraków|WGAL|Krakow|Krakau|Cracow|Kroke
Tarnów|WGAL|Tarnow|Tarne
Rzeszów|WGAL|Rzeszow|Reishe|Reische
Przemyśl|WGAL|Przemysl|Pshemishl|Premisla
Nowy Sącz|WGAL|Nowy Sacz|Sanz|Tsanz|Neu Sandez
Bobowa|WGAL|Bobov|Bobow
Sanok|WGAL|Sonik
Gorlice|WGAL|Gorlitz
Dukla|WGAL|Dukla
Jasło|WGAL|Jaslo|Yasla
Dębica|WGAL|Debica|Dembitz
Ropczyce|WGAL|Ropshitz|Ropczyce
Tarnobrzeg|WGAL|Dzików|Dzikov|Dzikow
Leżajsk|WGAL|Lezajsk|Lizensk|Lizhensk
Łańcut|WGAL|Lancut|Lantzut|Landshut
Bochnia|WGAL|Bochnia
Oświęcim|WGAL|Oswiecim|Auschwitz|Oshpitzin
Nowy Targ|WGAL|Neumarkt
Rymanów|WGAL|Rymanow
Lesko|WGAL|Lisko
Jarosław|WGAL|Jaroslaw|Yaroslav
Kolbuszowa|WGAL|Kolbushov
Mielec|WGAL|Melitz
Lwów|EGAL|Lviv|Lemberg|Lvov|Lwow|Lemberik
Stanisławów|EGAL|Ivano-Frankivsk|Stanislau|Stanislawow|Stanislav
Tarnopol|EGAL|Ternopil|Ternopol
Kołomyja|EGAL|Kolomyia|Kolomea|Kolomyja|Kolomey
Brody|EGAL|Brod
Drohobycz|EGAL|Drohobych|Drohobitch|Drohobycz
Stryj|EGAL|Stryi|Stry
Sambor|EGAL|Sambir
Czortków|EGAL|Chortkiv|Tshortkov|Czortkow|Chortkov
Husiatyn|EGAL|Husiatyn|Gusyatin|Husyatin
Buczacz|EGAL|Buchach|Butchatch
Bełz|EGAL|Belz (Galicia)|Belz
Żółkiew|EGAL|Zhovkva|Zolkiew|Zholkva
Brzeżany|EGAL|Berezhany|Brzezany
Zbaraż|EGAL|Zbarazh|Zbaraz
Skole|EGAL|Skole
Bolechów|EGAL|Bolekhiv|Bolechow
Kosów|EGAL|Kosiv|Kossov|Kosov
Nadwórna|EGAL|Nadvirna|Nadworna
Zaleszczyki|EGAL|Zalishchyky
Komarno (Galicia)|EGAL|Komarno Lviv
Rohatyn|EGAL|Rohatyn
Żydaczów|EGAL|Zhydachiv|Zidichov|Zydaczow
Sokal|EGAL|Sokal
Rawa Ruska|EGAL|Rava-Ruska|Rava Ruska
Czernowitz|NBUK|Chernivtsi|Cernăuți|Cernauti|Czerniowce|Tshernovits
Sadagóra|NBUK|Sadhora|Sadigura|Sadagora|Sadeger
Wiżnica|NBUK|Vyzhnytsia|Vizhnitz|Wiznitz|Vijnita
Storożyniec|NBUK|Storozhynets|Storojinet
Kitsman|NBUK|Kotzman|Cozmeni
Suceava|SBUK|Suczawa|Shotz
Rădăuți|SBUK|Radauti|Radautz
Câmpulung Moldovenesc|SBUK|Kimpolung|Campulung Moldovenesc
Siret|SBUK|Sereth
Vatra Dornei|SBUK|Dorna-Watra|Dorna Vatra
Gura Humorului|SBUK|Gura Humora
Warsaw|CPOL|Warszawa|Varshe|Warschau|Varsha
Łódź|CPOL|Lodz|Litzmannstadt|Lodzh
Lublin|CPOL|Lublin
Radom|CPOL|Radom
Kielce|CPOL|Keltz
Częstochowa|CPOL|Czestochowa|Chenstochov
Piotrków Trybunalski|CPOL|Piotrkow|Petrikov|Pietrkov
Góra Kalwaria|CPOL|Gora Kalwaria|Ger|Gur|Gerer
Kock|CPOL|Kotzk|Kotsk
Aleksandrów Łódzki|CPOL|Aleksandrow Lodzki|Alexander
Radzymin|CPOL|Radzimin
Otwock|CPOL|Otwock
Płock|CPOL|Plock|Plotsk
Kalisz|CPOL|Kalish
Siedlce|CPOL|Shedlitz
Zamość|CPOL|Zamosc|Zamoshtsh
Chełm|CPOL|Chelm|Khelm
Radzyń Podlaski|CPOL|Radzyn|Radzin
Izbica|CPOL|Izbitza
Opatów|CPOL|Opatow|Apt
Kozienice|CPOL|Kozhnitz
Sochaczew|CPOL|Sochatchov|Sochaczew
Grodzisk Mazowiecki|CPOL|Grodzisk
Mszczonów|CPOL|Amshinov|Mszczonow
Warka|CPOL|Vorka
Przysucha|CPOL|Pshischa|Peshischa
Będzin|CPOL|Bedzin|Bendin
Sosnowiec|CPOL|Sosnovitz
Pabianice|CPOL|Pabianitz
Zgierz|CPOL|Zgierz
Tomaszów Mazowiecki|CPOL|Tomaszow Mazowiecki
Ostrowiec Świętokrzyski|CPOL|Ostrowiec|Ostrovtse
Suwałki|CPOL|Suwalki|Suvalk
Mława|CPOL|Mlawa|Mlave
Białystok|BIALY|Bialystok|Byalistok|Belostok
Łomża|BIALY|Lomza|Lomzhe
Tykocin|BIALY|Tiktin
Grajewo|BIALY|Grayevo
Zambrów|BIALY|Zambrow
Pińsk|KRESBY|Pinsk|Karlin
Brześć|KRESBY|Brest|Brisk|Brest-Litovsk|Brzesc
Grodno|KRESBY|Hrodna|Horodna|Grodne
Słonim|KRESBY|Slonim
Baranowicze|KRESBY|Baranavichy|Baranovich|Baranovichi
Lida|KRESBY|Lida
Nowogródek|KRESBY|Navahrudak|Novhorodok|Novogrudok
Mir|KRESBY|Mir
Wołożyn|KRESBY|Valozhyn|Volozhin|Wolozyn
Stolin|KRESBY|Stolin
Kobryń|KRESBY|Kobryn|Kobrin
Kleck|KRESBY|Kletsk|Kletzk
Nieśwież|KRESBY|Nesvizh|Nyesvizh
Radun|KRESBY|Raduń
Oszmiana|KRESBY|Ashmyany|Oshmene|Oshmiany
Smorgonie|KRESBY|Smarhon|Smorgon
Głębokie|KRESBY|Hlybokaye|Glubokoye
Lachowicze|KRESBY|Lyakhavichy|Lechovitch
Dawidgródek|KRESBY|David-Horodok|Davyd-Haradok
Równe|VOLH|Rivne|Rovno|Rowne
Łuck|VOLH|Lutsk|Luck|Lutzk
Kowel|VOLH|Kovel|Kovle
Krzemieniec|VOLH|Kremenets|Kremenetz
Dubno|VOLH|Dubno
Ostróg|VOLH|Ostroh|Ostrog
Włodzimierz Wołyński|VOLH|Volodymyr|Ludmir|Vladimir-Volynsky
Sarny|VOLH|Sarny
Turzysk|VOLH|Turiisk|Trisk|Turzysk
Korzec|VOLH|Korets|Koretz
Stepań|VOLH|Stepan
Wilno|VILNA|Vilnius|Vilna|Vilne|Wilna
Ejszyszki|VILNA|Eišiškės|Eisiskes|Eishishok
Święciany|VILNA|Švenčionys|Svencionys|Sventsian
Kaunas|LT|Kovno|Kowno|Kovne
Slabodka|LT|Vilijampolė|Vilijampole|Slobodka
Šiauliai|LT|Siauliai|Shavel|Szawle|Shavli
Panevėžys|LT|Panevezys|Ponevezh|Poniewiez
Telšiai|LT|Telsiai|Telz|Telsh|Telshe
Ukmergė|LT|Ukmerge|Vilkomir
Kėdainiai|LT|Kedainiai|Keidan
Raseiniai|LT|Rasein|Raseiniai
Kelmė|LT|Kelme|Kelm
Plungė|LT|Plunge|Plungyan
Biržai|LT|Birzai|Birzh
Rokiškis|LT|Rokiskis|Rakishok
Utena|LT|Utyan
Marijampolė|LT|Marijampole|Mariampol
Kretinga|LT|Kretinga
Jurbarkas|LT|Yurburg
Riga|LV|Rīga
Daugavpils|LV|Dvinsk|Dünaburg|Duenaburg|Dvinsk
Liepāja|LV|Liepaja|Libau
Jelgava|LV|Mitau
Rēzekne|LV|Rezekne|Rezhitse
Ludza|LV|Lutsin
Kyiv|EUKR|Kiev|Kijów|Kiew
Odesa|EUKR|Odessa|Ades
Berdychiv|EUKR|Berditchev|Berdyczów|Berdichev
Zhytomyr|EUKR|Zhitomir|Zhitomir
Uman|EUKR|Human
Bila Tserkva|EUKR|Belaya Tserkov|Sdeh Lavan
Medzhybizh|EUKR|Mezhbizh|Medzhibozh|Mezibuz
Chornobyl|EUKR|Chernobyl|Tshernobil
Skvyra|EUKR|Skver|Skvira
Talne|EUKR|Talna|Talnoye
Ruzhyn|EUKR|Rizhin|Ruzhin
Bratslav|EUKR|Breslov|Bratzlav
Kamianets-Podilskyi|EUKR|Kamenets-Podolsk|Kaminetz
Vinnytsia|EUKR|Vinnitsa
Kharkiv|EUKR|Kharkov
Dnipro|EUKR|Yekaterinoslav|Dnipropetrovsk|Ekaterinoslav
Mezhyrich|EUKR|Mezritch|Mezeritch
Polonne|EUKR|Polonnoye|Polnoye
Makariv|EUKR|Makarov
Kremenchuk|EUKR|Kremenchug
Bershad|EUKR|Bershad
Minsk|EBY|Minsk
Vitebsk|EBY|Viciebsk
Mogilev|EBY|Mahilyow|Mohilev
Babruysk|EBY|Bobruisk|Bobroisk
Gomel|EBY|Homel
Slutsk|EBY|Slutzk
Lyady|EBY|Liadi|Liozna
Shklov|EBY|Shklow
Lyubavichi|RUS|Lubavitch|Lubavitsh
Smolensk|RUS|Smolensk
Moscow|RUS|Moskva
Saint Petersburg|RUS|St Petersburg|Petrograd|Leningrad
Chișinău|BESS|Kishinev|Kishinau|Chisinau|Keshenev
Bălți|BESS|Balti|Beltz (Bessarabia)|Beltsy
Soroca|BESS|Soroki
Orhei|BESS|Orgeyev|Uriv
Bender|BESS|Tighina|Bendery
Edineț|BESS|Edinet|Yedinitz
Briceni|BESS|Brichany|Britshan
Lipcani|BESS|Lipkany
Bucharest|ROOLD|București|Bucuresti|Bukarest
Iași|ROOLD|Iasi|Jassy|Yas|Yassy
Botoșani|ROOLD|Botosani|Botoshan
Piatra Neamț|ROOLD|Piatra Neamt
Bacău|ROOLD|Bacau|Bakoi
Galați|ROOLD|Galati|Galatz
Focșani|ROOLD|Focsani
Dorohoi|ROOLD|Dorohoi
Fălticeni|ROOLD|Falticeni|Foltitchen
Târgu Neamț|ROOLD|Targu Neamt
Pașcani|ROOLD|Pascani|Pashkan
Buhuși|ROOLD|Buhusi|Bohush
Ștefănești|ROOLD|Stefanesti|Shtefanesht
Berlin|DE|Berlin
Frankfurt am Main|DE|Frankfurt|Frankfort
Hamburg|DE|Hamburg
Altona|DE|Altona
Munich|DE|München|Muenchen
Leipzig|DE|Leipzig
Cologne|DE|Köln|Koeln
Fürth|DE|Fuerth|Fürth
Mainz|DE|Mayence
Worms|DE|Vermayza
Speyer|DE|Spira
Würzburg|DE|Wuerzburg
Nuremberg|DE|Nürnberg|Nuernberg
Hanover|DE|Hannover
Dresden|DE|Dresden
Düsseldorf|DE|Duesseldorf
Mannheim|DE|Mannheim
Karlsruhe|DE|Karlsruhe
Stuttgart|DE|Stuttgart
Halberstadt|DE|Halberstadt
Bremen|DE|Bremen
Essen|DE|Essen
Dortmund|DE|Dortmund
Chemnitz|DE|Chemnitz
Kassel|DE|Cassel
Wiesbaden|DE|Wiesbaden
Offenbach|DE|Offenbach am Main
Breslau|DEPL|Wrocław|Wroclaw
Stettin|DEPL|Szczecin
Gleiwitz|DEPL|Gliwice
Beuthen|DEPL|Bytom
Kattowitz|KATO|Katowice
Posen|POSEN|Poznań|Poznan
Bromberg|POSEN|Bydgoszcz
Lissa|POSEN|Leszno
Gnesen|POSEN|Gniezno
Thorn|POSEN|Toruń|Torun
Danzig|DANZIG|Gdańsk|Gdansk
Königsberg|KBERG|Kaliningrad|Koenigsberg
Szabadka|VOJV|Subotica|Maria-Theresiopel
Újvidék|VOJV|Novi Sad|Ujvidek|Neusatz
Zenta|VOJV|Senta
Zombor|VOJV|Sombor
Antwerp|BE|Antwerpen|Anvers
Brussels|BE|Bruxelles|Brussel
Amsterdam|NL|Amsterdam
Jerusalem|IL|Yerushalayim|Jeruzalem
Bnei Brak|IL|Bene Beraq
Tel Aviv|IL|Tel Aviv-Yafo
New York|US|NYC|Brooklyn|Manhattan|Bronx|Queens
Monsey|US|Monsey NY
Williamsburg|US|Williamsburg Brooklyn
Lakewood|US|Lakewood NJ
London|UK|Stamford Hill
Manchester|UK|Manchester`;

const strip = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[łŁ]/g, 'l').replace(/ß/g, 'ss').toLowerCase().replace(/[^a-z0-9\u0590-\u05ff ]+/g, ' ').replace(/\s+/g, ' ').trim();
export const PLACES = [];
const INDEX = new Map();
for (const line of T.split('\n')) {
  const [name, key, ...vars] = line.split('|');
  if (!R[key]) continue;
  const entry = { name, key, variants: vars.filter(v => !/\?/.test(v)), ...R[key] };
  PLACES.push(entry);
  for (const v of [name, ...entry.variants]) { const k = strip(v.replace(/\s*\(.*\)$/, '')); if (k && !INDEX.has(k)) INDEX.set(k, entry); const k2 = strip(v); if (k2 && !INDEX.has(k2)) INDEX.set(k2, entry); }
}
const COUNTRY_WORDS = /\b(hungary|ukraine|romania|poland|slovakia|czech republic|czechia|czechoslovakia|austria|germany|lithuania|latvia|belarus|russia|moldova|serbia|yugoslavia|israel|usa|united states|belgium|uk|england|ussr|galicia|bukovina|transylvania)\b/g;

/** Find a known town in free text ("Munkacs, Hungary" → Munkács entry). */
export function lookupPlace(text) {
  if (!text) return null;
  const segs = String(text).split(/[,;/]/).map(s => strip(s)).filter(Boolean);
  for (const s of segs) { if (INDEX.has(s)) return INDEX.get(s); const t = s.replace(COUNTRY_WORDS, '').trim(); if (t && INDEX.has(t)) return INDEX.get(t); }
  const all = strip(text);
  for (const [k, v] of INDEX) if (k.length >= 5 && (all === k || all.startsWith(k + ' '))) return v;
  return null;
}
export function countryAt(entry, year) {
  if (!entry) return null;
  if (!year) return null;
  let hit = null;
  for (const [a, b, n] of entry.p) if (year >= a && year <= b) { hit = n; if (year !== b) break; }
  return hit;
}
/** Everything the UI shows about a place: canonical label, now-country, state at that year, full timeline. */
export function placeInfo(text, year) {
  const e = lookupPlace(text);
  if (!e) return null;
  const alt = e.variants.filter(v => !/\(/.test(v)).slice(0, 3);
  return {
    name: e.name, label: `${e.name}${alt[0] && alt[0] !== e.name ? ` (${alt[0]})` : ''}, ${e.now}`,
    now: e.now, region: e.region || '', then: countryAt(e, year), year,
    timeline: e.p.map(([a, b, n]) => `${a === 0 ? '…' : a}–${b === 9999 ? 'today' : b}: ${n}`),
    variants: e.variants,
  };
}
/** Every state a place belonged to over a span of years (used to suggest which ancestor fits a target country). */
export function statesBetween(text, y1, y2) {
  const e = lookupPlace(text); if (!e) return [];
  const a = y1 || 1850, b = y2 || a + 60;
  return e.p.filter(([s, t]) => t >= a && s <= b).map(x => x[2]);
}
export function placeSuggestions(q, limit = 8) {
  const s = strip(q); if (s.length < 2) return [];
  const out = []; const seen = new Set();
  for (const e of PLACES) {
    const names = [e.name, ...e.variants];
    if (names.some(n => strip(n).startsWith(s)) && !seen.has(e.name)) { seen.add(e.name); out.push(e); if (out.length >= limit) break; }
  }
  return out.map(e => ({ value: `${e.name}, ${e.now}`, label: `${e.name}${e.variants[0] && e.variants[0] !== e.name ? ' / ' + e.variants[0] : ''} — ${e.region ? e.region + ', ' : ''}now ${e.now}` }));
}
