const wasteDefinitions = [
  {
    category: 'Odpad technologiczny',
    definition: 'Odpad powstający jako naturalny i przewidywalny element procesu technologicznego, niemożliwy lub ekonomicznie nieuzasadniony do całkowitego wyeliminowania przy zachowaniu obowiązującego standardu produkcji.',
    characteristics: [
      'wynika z technologii procesu',
      'jest przewidywalny',
      'może posiadać ustalone normy',
      'nie wynika z błędu człowieka ani awarii',
    ],
    examples: [
      'rozruch maszyny',
      'przezbrojenie',
      'ustawienie kolorystyki',
      'normatywne straty cięcia',
      'próbki technologiczne',
      'końcówki "materiału" niemożliwe do wykorzystania',
    ],
  },
  {
    category: 'Odpad wynikający z błędu',
    definition: 'Odpad powstający na skutek nieprawidłowości, odstępstwa od standardu lub zakłócenia procesu produkcyjnego, którego wystąpienie mogło zostać ograniczone lub wyeliminowane.',
    characteristics: [
      'nie jest planowany',
      'wynika z błędu, awarii lub niezgodności',
      'wymaga identyfikacji przyczyny',
      'stanowi podstawę do działań korygujących',
    ],
    examples: [
      'błędne ustawienie maszyny',
      'błąd operatora',
      'błędne cięcie',
      'błędne klejenie',
      'wada druku',
      'uszkodzenie "materiału"',
      'awaria urządzenia',
      'niezgodność jakościowa',
      'pomyłka produkcyjna',
    ],
  },
];

const table1 = [
  { lp: 1, kod: '03 01 05', nazwa: 'Trociny, wióry, ścinki, drewno, płyta wiórowa i fornir inne niż wymienione w 03 01 04' },
  { lp: 2, kod: '03 03 08', nazwa: 'Odpady z sortowania papieru i tektury przeznaczone do recyklingu' },
  { lp: 3, kod: '07 02 04*', nazwa: 'Inne rozpuszczalniki organiczne, roztwory z przemywania i ciecze macierzyste' },
  { lp: 4, kod: '07 02 13', nazwa: 'Odpady tworzyw sztucznych' },
  { lp: 5, kod: '07 02 80', nazwa: 'Odpady z przemysłu gumowego i produkcji gumy' },
  { lp: 6, kod: '07 02 99', nazwa: 'Inne niewymienione odpady' },
  { lp: 7, kod: '07 07 99', nazwa: 'Inne niewymienione odpady' },
  { lp: 8, kod: '08 01 11*', nazwa: 'Odpady farb i lakierów zawierających rozpuszczalniki organiczne lub inne substancje niebezpieczne' },
  { lp: 9, kod: '08 01 21*', nazwa: 'Zmywacz farb lub lakierów' },
  { lp: 10, kod: '08 03 08', nazwa: 'Odpady ciekłe zawierające farby drukarskie' },
  { lp: 11, kod: '08 03 12*', nazwa: 'Odpady farb drukarskich zawierające substancje niebezpieczne' },
  { lp: 12, kod: '08 03 18', nazwa: 'Odpadowy toner drukarski inny niż wymieniony w 08 03 17' },
  { lp: 13, kod: '08 04 09*', nazwa: 'Odpadowe kleje i szczeliwa zawierające rozpuszczalniki organiczne lub inne substancje niebezpieczne' },
  { lp: 14, kod: '08 04 10', nazwa: 'Odpadowe kleje i szczeliwa inne niż wymienione w 08 04 09' },
  { lp: 15, kod: '09 01 01*', nazwa: 'Wodne roztwory wywoływaczy i aktywatorów' },
  { lp: 16, kod: '09 01 04*', nazwa: 'Roztwory utrwalaczy' },
  { lp: 17, kod: '09 01 05*', nazwa: 'Roztwory wybielaczy i kąpieli wybielająco-utrwalających' },
  { lp: 18, kod: '09 01 07', nazwa: 'Błony i papier fotograficzny zawierające srebro lub związki srebra' },
  { lp: 19, kod: '09 01 08', nazwa: 'Błony i papier fotograficzny niezawierające srebra' },
  { lp: 20, kod: '09 01 99', nazwa: 'Inne niewymienione odpady' },
  { lp: 21, kod: '10 12 08', nazwa: 'Wybrakowane wyroby ceramiczne, cegły, kafle i ceramika budowlana (po przeróbce termicznej)' },
  { lp: 22, kod: '12 01 01', nazwa: 'Odpady z toczenia i piłowania żelaza oraz jego stopów' },
  { lp: 23, kod: '12 01 03', nazwa: 'Odpady z tłoczenia i piłowania metali nieżelaznych' },
  { lp: 24, kod: '12 01 21', nazwa: 'Zużyte materiały szlifierskie inne niż wymienione w 12 01 20' },
  { lp: 25, kod: '13 02 05*', nazwa: 'Mineralne oleje silnikowe, przekładniowe i smarowe niezawierające związków chlorowcoorganicznych' },
  { lp: 26, kod: '13 02 08*', nazwa: 'Inne oleje silnikowe, przekładniowe i smarowe' },
  { lp: 27, kod: '15 01 01', nazwa: 'Opakowania z papieru i tektury' },
  { lp: 28, kod: '15 01 02', nazwa: 'Opakowania z tworzyw sztucznych' },
  { lp: 29, kod: '15 01 03', nazwa: 'Opakowania z drewna' },
  { lp: 30, kod: '15 01 04', nazwa: 'Opakowania z metali' },
  { lp: 31, kod: '15 01 05', nazwa: 'Opakowania wielomateriałowe' },
  { lp: 32, kod: '15 01 06', nazwa: 'Zmieszane odpady opakowaniowe' },
  { lp: 33, kod: '15 01 07', nazwa: 'Opakowania ze szkła' },
  { lp: 34, kod: '15 01 09', nazwa: 'Opakowania z tekstyliów' },
  { lp: 35, kod: '15 01 10*', nazwa: 'Opakowania zawierające pozostałości substancji niebezpiecznych lub nimi zanieczyszczone' },
  { lp: 36, kod: '15 01 11*', nazwa: 'Opakowania z metali zawierające niebezpieczne porowate elementy wzmocnienia konstrukcyjnego (np. azbest), włącznie z pustymi pojemnikami ciśnieniowymi' },
  { lp: 37, kod: '15 02 02*', nazwa: 'Sorbenty, materiały filtracyjne (w tym filtry olejowe nieujęte w innych grupach), tkaniny do wycierania (np. szmaty, ścierki) i ubrania ochronne zanieczyszczone substancjami niebezpiecznymi (np. PCB)' },
  { lp: 38, kod: '15 02 03', nazwa: 'Sorbenty, materiały filtracyjne, tkaniny do wycierania (np. szmaty, ścierki) i ubrania ochronne inne niż wymienione w 15 02 02' },
  { lp: 39, kod: '16 01 03', nazwa: 'Zużyte opony' },
  { lp: 40, kod: '16 01 07*', nazwa: 'Filtry olejowe' },
  { lp: 41, kod: '16 01 14*', nazwa: 'Płyny zapobiegające zamarzaniu zawierające niebezpieczne substancje' },
  { lp: 42, kod: '16 01 99', nazwa: 'Inne niewymienione odpady' },
  { lp: 43, kod: '16 01 15', nazwa: 'Płyny zapobiegające zamarzaniu inne niż wymienione w 16 01 14' },
  { lp: 44, kod: '16 02 13*', nazwa: 'Zużyte urządzenia zawierające niebezpieczne elementy inne niż wymienione w 16 02 09 do 16 02 12' },
  { lp: 45, kod: '16 02 14', nazwa: 'Zużyte urządzenia inne niż wymienione w 16 02 09 do 16 02 13' },
  { lp: 46, kod: '16 02 16', nazwa: 'Elementy usunięte ze zużytych urządzeń inne niż wymienione w 16 02 15' },
  { lp: 47, kod: '16 06 04', nazwa: 'Baterie alkaliczne (z wyłączeniem 16 06 03)' },
  { lp: 48, kod: '16 06 05', nazwa: 'Inne baterie i akumulatory' },
  { lp: 49, kod: '16 10 01*', nazwa: 'Uwodnione odpady ciekłe zawierające substancje niebezpieczne' },
  { lp: 50, kod: '16 80 01', nazwa: 'Magnetyczne i optyczne nośniki informacji' },
  { lp: 51, kod: '17 01 01', nazwa: 'Odpady betonu oraz gruz betonowy z rozbiórek i remontów' },
  { lp: 52, kod: '17 01 07', nazwa: 'Zmieszane odpady z betonu, gruzu ceglanego, odpadowych materiałów ceramicznych i elementów wyposażenia inne niż wymienione w 17 01 06' },
  { lp: 53, kod: '17 02 01', nazwa: 'Drewno' },
  { lp: 54, kod: '17 04 07', nazwa: 'Mieszaniny metali' },
  { lp: 55, kod: '17 04 11', nazwa: 'Kable inne niż wymienione w 17 04 10' },
  { lp: 56, kod: '17 08 02', nazwa: 'Materiały budowlane zawierające gips inne niż wymienione w 17 08 01' },
  { lp: 57, kod: '19 12 01', nazwa: 'Papier i tektura' },
  { lp: 58, kod: '17 04 05', nazwa: 'Żelazo i stal' },
  { lp: 59, kod: '08 03 13', nazwa: 'Odpady farb drukarskich inne niż wymienione w 08 03 12' },
  { lp: 60, kod: '13 03 10*', nazwa: 'Inne oleje i ciecze stosowane jako elektroizolatory oraz nośniki ciepła' },
  { lp: 61, kod: '16 03 04', nazwa: 'Nieorganiczne odpady inne niż wymienione w 16 03 03, 16 03 80' },
  { lp: 62, kod: '17 02 02', nazwa: 'Szkło' },
  { lp: 63, kod: '13 05 08*', nazwa: 'Mieszanina odpadów z piaskowników i z odwadniania olejów w separatorach' },
];

const table2 = [
  { lp: 1, kod: '03 01 05', nazwa: 'Trociny, wióry, ścinki, drewno, płyta wiórowa i fornir inne niż wymienione w 03 01 04', opis: 'płyta MDF, płyta OSB, płyta wiórowa, wióra drewniane, sklejka drewnopodobna, płyta HDF, powstaje podczas prac manualnych lub z użyciem maszyn do cięcia elektronicznych i elektrycznych' },
  { lp: 2, kod: '03 03 08', nazwa: 'Odpady z sortowania papieru i tektury przeznaczone do recyklingu', opis: 'papier niezadrukowany, papier zadrukowany, cięta tektura lita. Odpad powstaje podczas prac manualnych lub przy użyciu maszyn introligatorskich' },
  { lp: 3, kod: '07 02 04*', nazwa: 'Inne rozpuszczalniki organiczne, roztwory z przemywania i ciecze macierzyste', opis: 'pozostałości rozcieńczalnika, środka czyszczącego, rozpuszczlnika Buhnen, pozostałości z separatora przepływu materiałów eksploatacyjnych 106.90100.127' },
  { lp: 4, kod: '07 02 13', nazwa: 'Odpady tworzyw sztucznych', opis: 'płótno do druku poliester, pleksa akrylowa, płyta polipropylenowa, kanalikowa, gruba folia, rolki z tworzywa sztucznego, folia laminacyjna (klej Prolamination)' },
  { lp: 5, kod: '07 02 80', nazwa: 'Odpady z przemysłu gumowego i produkcji gumy', opis: 'odpady z gumy, paski klinowe' },
  { lp: 6, kod: '07 02 99', nazwa: 'Inne niewymienione odpady', opis: 'odpady z tworzywa sztucznego (inne których nie można zaklasyfikować do kodów z tej grupy)' },
  { lp: 7, kod: '07 07 99', nazwa: 'Inne niewymienione odpady', opis: 'pozostałości lakieru Lakier UV Wash 1076 (środek myjący do offsetowych maszyn drukujących)' },
  { lp: 8, kod: '08 01 11*', nazwa: 'Odpady farb i lakierów zawierających rozpuszczalniki organiczne lub inne substancje niebezpieczne', opis: 'farby, lakiery zawierające substancje niebezpieczne, farby, lakiery z przedawnionym terminem użycia, pozostałości lakieru UV COATING 2006 Gloss, pozostałości lakieru UV COAT 2200 G wraz z alkoholem izopropylowym (IPA), pozostałości Polysense 500' },
  { lp: 9, kod: '08 01 21*', nazwa: 'Zmywacz farb lub lakierów', opis: 'zmywacz farb lub lakierów, zmywacz Cleaning fluid 2' },
  { lp: 10, kod: '08 03 08', nazwa: 'Odpady ciekłe zawierające farby drukarskie', opis: 'mieszanina farb HP zanieczyszczonych olejem HP, mieszanina tuszy Epson z płynem czyszczącym, zlewki tuszu Canon Dream Labo, zlewki Canon PRO, zlewki/ pozostałości tuszu Cartridge Latex Ink, pozostałości tuszu sublimacyjnego do kubków' },
  { lp: 11, kod: '08 03 12*', nazwa: 'Odpady farb drukarskich zawierające substancje niebezpieczne', opis: 'resztki rozpuszczalnika Solvent 400, zlewki tuszu Canon Arizona, zlewki tuszu Teba Mimaki' },
  { lp: 12, kod: '08 03 18', nazwa: 'Odpadowy toner drukarski inny niż wymieniony w 08 03 17', opis: 'proszek z toneru do druku kserograficznego iGen, Chamonix' },
  { lp: 13, kod: '08 04 09*', nazwa: 'Odpadowe kleje i szczeliwa zawierające rozpuszczalniki organiczne lub inne substancje niebezpieczne', opis: 'kleje i szczeliwa zawierające substancje niebezpieczne lub rozpuszczalniki organiczne, pozostałości klejów: Spray-KON CA 300, Technomelt PUR 3317BR, Tesa spray, Super cyjanoakrylowy gęsty, UHU epoxy ultra strong' },
  { lp: 14, kod: '08 04 10', nazwa: 'Odpadowe kleje i szczeliwa inne niż wymienione w 08 04 09', opis: 'kleje i szczeliwa, pozostałości klejów: Aquence GA 7214, Plakal Covertack 535, technomelt GA 3635, ET 50C, ET 249, ET 117, ET 114, Prodas 2163, Makrolep ES, SI 1220, SI3233, SI5292, Idrotex do kasetek 100, Pure Photo Hotmelt' },
  { lp: 15, kod: '09 01 01*', nazwa: 'Wodne roztwory wywoływaczy i aktywatorów', opis: 'zmieszane koncentraty wywoływaczy Tetenal, aktywatorów Tetenal i wody' },
  { lp: 16, kod: '09 01 04*', nazwa: 'Roztwory utrwalaczy', opis: 'koncentrat utrwalacza Tetenal zmieszany z wodą' },
  { lp: 17, kod: '09 01 05*', nazwa: 'Roztwory wybielaczy i kąpieli wybielająco-utrwalających', opis: 'koncentrat wybielacza i utrwalacza' },
  { lp: 18, kod: '09 01 07', nazwa: 'Błony i papier fotograficzny zawierające srebro lub związki srebra', opis: 'papier fotograficzny naświetlony, papier fotograficzny nienaświetlony, ścinki' },
  { lp: 19, kod: '09 01 08', nazwa: 'Błony i papier fotograficzny niezawierające srebra', opis: 'papier fotograficzny naświetlony, papier fotograficzny nienaświetlony, ścinki' },
  { lp: 20, kod: '09 01 99', nazwa: 'Inne niewymienione odpady', opis: 'pozostałe odpady z przemysłu fotograficznego których nie można zaklasyfikować do pozostałych kodów z tej grupy' },
  { lp: 21, kod: '10 12 08', nazwa: 'Wybrakowane wyroby ceramiczne, cegły, kafle i ceramika budowlana (po przeróbce termicznej)', opis: 'uszkodzone kubki ceramiczne z nadrukiem lub bez' },
  { lp: 22, kod: '12 01 01', nazwa: 'Odpady z toczenia i piłowania żelaza oraz jego stopów', opis: 'wióra stalowe powstałe podczas obróbki metalu' },
  { lp: 23, kod: '12 01 03', nazwa: 'Odpady z tłoczenia i piłowania metali nieżelaznych', opis: 'wióra z metali kolorowych (aluminium, brąz, miedź) powstałe podczas obróbki metali nieżelaznych' },
  { lp: 24, kod: '12 01 21', nazwa: 'Zużyte materiały szlifierskie inne niż wymienione w 12 01 20', opis: 'materiały szlifierskie, tarcze, ściernice, papier ścierny, kostki ścierne' },
  { lp: 25, kod: '13 02 05*', nazwa: 'Mineralne oleje silnikowe, przekładniowe i smarowe niezawierające związków chlorowcoorganicznych', opis: 'zużyty olej' },
  { lp: 26, kod: '13 02 08*', nazwa: 'Inne oleje silnikowe, przekładniowe i smarowe', opis: 'zużyty olej' },
  { lp: 27, kod: '15 01 01', nazwa: 'Opakowania z papieru i tektury', opis: 'pudełka kartonowe, całe rolki, tekturowe gilzy, formatki z tektury litej, paspartu, czarne kartki' },
  { lp: 28, kod: '15 01 02', nazwa: 'Opakowania z tworzyw sztucznych', opis: 'folia stretch, folia bąbelkowa, folia zabezpieczająca materiał (np. wierzchnia folia na pleksi), włóknina, pianka, styropian, folia termokurczliwa, taśma klejąca, foliopaki (koperty foliowe), folia pakowa, worki foliowe, woreczki strunowe' },
  { lp: 29, kod: '15 01 03', nazwa: 'Opakowania z drewna', opis: 'palety drewniane, skrzynie drewniane, kawaki drewna, listwy drewniane, opakowania drewniane które nie przeszły kontroli jakości' },
  { lp: 30, kod: '15 01 04', nazwa: 'Opakowania z metali', opis: 'puszki aluminiowe, metalowe, spirale z kalendarzy, metalowe zapinki do taśm' },
  { lp: 31, kod: '15 01 05', nazwa: 'Opakowania wielomateriałowe', opis: 'pleksa podklejona zdjęciem lub wydrukiem, papier zalaminowany, papier lakierowany, tektura z gąbką, materiał tekstylny lub skórzany podklejony, okładka (składająca się z następujących materiałów w różnych wariantach): tektura, zszywka, gąbka, materiał tekstylny, materiał skórzany, papier laminowany, pleksa, klej), papier z etykiet termicznych (papier woskowany), gilza z resztką foli, pianka podklejona wydrukiem lub zdjęciem, opakowanie drewniane wraz z materiałem tekstylnym, opakowanie po papierze fotograficznym połączenie papieru z folią, koperta papierowa połączona z folią, kartka z warstwą kleju, zużyta mata introligatorka (mata podkładkowa do cięcia), mata czyszcząca (mata która przyklejana jest na podłoże, tworzywo z warstwą kleju), rakla (połączenia drewna i filcu lub tworzywa i filcu), folia magnetyczna, washpapa, płyta Planbond (płyta z tworzywa sztucznego, połączona z 2 cienkimi warstwami aluminium), dibond podklejony tekturą, tekturą z gąbką, taśmą, płytą MFD lub HDF, opakowanie po tuszu lub farbie (z tworzywa sztucznego z etykietą papierową zabrudzone tuszem lub farbą)' },
  { lp: 32, kod: '15 01 06', nazwa: 'Zmieszane odpady opakowaniowe', opis: 'odpady zmieszane' },
  { lp: 33, kod: '15 01 07', nazwa: 'Opakowania ze szkła', opis: 'opakowania szklane, bezbarwne, białe, kolorowe' },
  { lp: 34, kod: '15 01 09', nazwa: 'Opakowania z tekstyliów', opis: 'lamówki, wykładzina, sznurek jutowy' },
  { lp: 35, kod: '15 01 10*', nazwa: 'Opakowania zawierające pozostałości substancji niebezpiecznych lub nimi zanieczyszczone', opis: 'opakowania z metali, tworzyw sztucznych zanieczyszczone klejem, farbą, lakierem, substancją czyszczącą, np. opakowania po chemii używanej na naświetlarni' },
  { lp: 36, kod: '15 01 11*', nazwa: 'Opakowania z metali zawierające niebezpieczne porowate elementy wzmocnienia konstrukcyjnego (np. azbest), włącznie z pustymi pojemnikami ciśnieniowymi', opis: 'puszki metalowe pod ciśnieniem' },
  { lp: 37, kod: '15 02 02*', nazwa: 'Sorbenty, materiały filtracyjne (w tym filtry olejowe nieujęte w innych grupach), tkaniny do wycierania (np. szmaty, ścierki) i ubrania ochronne zanieczyszczone substancjami niebezpiecznymi (np. PCB)', opis: 'materiały, papier, rękawiczki ochronne (bawełniane, nitrylowe, gumowe, lateksowe, materiałowe powlekane gumą) zanieczyszczone substancją niebezpieczną czyszczącą, klejem, olejem lub smarem, lakierem lub tuszem, patyczki czyszczące, filtry zanieczyszczone chemią fotograficzną' },
  { lp: 38, kod: '15 02 03', nazwa: 'Sorbenty, materiały filtracyjne, tkaniny do wycierania (np. szmaty, ścierki) i ubrania ochronne inne niż wymienione w 15 02 02', opis: 'materiały, papier, rękawiczki ochronne zabrudzone farbą, klejem, tuszem, lub substancja czyszczącą, patyczki czyszczące' },
  { lp: 39, kod: '16 01 03', nazwa: 'Zużyte opony', opis: 'zużyte opony' },
  { lp: 40, kod: '16 01 07*', nazwa: 'Filtry olejowe', opis: 'filtry zanieczyszczone olejem' },
  { lp: 41, kod: '16 01 14*', nazwa: 'Płyny zapobiegające zamarzaniu zawierające niebezpieczne substancje', opis: 'glikol (zabierany bezzwłocznie przez firmę serwisową)' },
  { lp: 42, kod: '16 01 99', nazwa: 'Inne niewymienione odpady', opis: 'filtry powietrza' },
  { lp: 43, kod: '16 01 15', nazwa: 'Płyny zapobiegające zamarzaniu inne niż wymienione w 16 01 14', opis: 'glikol (zabierany bezzwłocznie przez firmę serwisową)' },
  { lp: 44, kod: '16 02 13*', nazwa: 'Zużyte urządzenia zawierające niebezpieczne elementy inne niż wymienione w 16 02 09 do 16 02 12', opis: 'żarówki, bezpieczniki elektroniczne, lodówki, zamrażarki' },
  { lp: 45, kod: '16 02 14', nazwa: 'Zużyte urządzenia inne niż wymienione w 16 02 09 do 16 02 13', opis: 'zepsute, zużyte elektronarzędzi- myszki/ monitory, zużyte tonery drukarskie zawierające elementy elektroniki' },
  { lp: 46, kod: '16 02 16', nazwa: 'Elementy usunięte ze zużytych urządzeń inne niż wymienione w 16 02 15', opis: 'elementy z urządzeń elektronicznych, elektrycznych' },
  { lp: 47, kod: '16 06 04', nazwa: 'Baterie alkaliczne (z wyłączeniem 16 06 03)', opis: 'baterie alkaliczne' },
  { lp: 48, kod: '16 06 05', nazwa: 'Inne baterie i akumulatory', opis: 'baterie' },
  { lp: 49, kod: '16 10 01*', nazwa: 'Uwodnione odpady ciekłe zawierające substancje niebezpieczne', opis: 'chemia z naświetlani z maszyn noritsu, zmieszane odczynniki, stabilizatory, aktywatory z wodą' },
  { lp: 50, kod: '16 80 01', nazwa: 'Magnetyczne i optyczne nośniki informacji', opis: 'płyty CD' },
  { lp: 51, kod: '17 01 01', nazwa: 'Odpady betonu oraz gruz betonowy z rozbiórek i remontów', opis: 'beton i gruz z remontów' },
  { lp: 52, kod: '17 01 07', nazwa: 'Zmieszane odpady z betonu, gruzu ceglanego, odpadowych materiałów ceramicznych i elementów wyposażenia inne niż wymienione w 17 01 06', opis: 'zmieszane odpady budowlane' },
  { lp: 53, kod: '17 02 01', nazwa: 'Drewno', opis: 'płyty wiórowe, wióra drewniane, elementy drewna' },
  { lp: 54, kod: '17 04 07', nazwa: 'Mieszaniny metali', opis: 'zszywki, elementy metalowe, ostrza nożyków, części metalowe, zużyte łożyska z maszyn, śruby, nakrętki' },
  { lp: 55, kod: '17 04 11', nazwa: 'Kable inne niż wymienione w 17 04 10', opis: 'kable' },
  { lp: 56, kod: '17 08 02', nazwa: 'Materiały budowlane zawierające gips inne niż wymienione w 17 08 01', opis: 'płyty karton-gips' },
  { lp: 57, kod: '19 12 01', nazwa: 'Papier i tektura', opis: 'ścinki papieru, cięta tektura lita' },
  { lp: 58, kod: '17 04 05', nazwa: 'Żelazo i stal', opis: 'elementy żelazne i stalowe' },
  { lp: 59, kod: '08 03 13', nazwa: 'Odpady farb drukarskich inne niż wymienione w 08 03 12', opis: 'zlewki farb HP' },
  { lp: 60, kod: '13 03 10*', nazwa: 'Inne oleje i ciecze stosowane jako elektroizolatory oraz nośniki ciepła', opis: 'zużyty olej' },
  { lp: 61, kod: '16 03 04', nazwa: 'Nieorganiczne odpady inne niż wymienione w 16 03 03, 16 03 80', opis: 'produkty które nie przeszły kontroli jakości' },
  { lp: 62, kod: '17 02 02', nazwa: 'Szkło', opis: 'szkło, szyby' },
  { lp: 63, kod: '13 05 08*', nazwa: 'Mieszanina odpadów z piaskowników i z odwadniania olejów w separatorach', opis: 'Substancja podczas serwisu jest od razu pompowana do samochodów firmy zajmującej się jej utylizacją i wymianą w maszynach' },
];

export default function DictionaryTab() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Definitions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-1">📖 Definicja klasyfikacji odpadów</h2>
        <p className="text-sm text-slate-500 mb-4">
          W procesie produkcyjnym obowiązują dwie podstawowe kategorie odpadów:
        </p>
        <div className="space-y-6">
          {wasteDefinitions.map((def, i) => (
            <div key={i} className="rounded-xl border p-5 space-y-3">
              <h3 className={`text-base font-bold ${i === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {i + 1}. {def.category}
              </h3>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Definicja</p>
                <p className="text-sm text-slate-700">{def.definition}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Charakterystyka</p>
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-0.5">
                  {def.characteristics.map((c, ci) => (
                    <li key={ci}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Przykłady</p>
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-0.5">
                  {def.examples.map((e, ei) => (
                    <li key={ei}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table 1 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-1">📋 Tabela 1. Rodzaje wytwarzanych, gromadzonych i magazynowanych odpadów – Cyfrowa Foto</h2>
        <p className="text-xs text-slate-400 mb-4">Lp. | Kod odpadu | Nazwa odpadu</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-3 py-2 font-semibold text-slate-600 w-10">Lp.</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600 w-28">Kod odpadu</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Nazwa odpadu</th>
              </tr>
            </thead>
            <tbody>
              {table1.map(row => (
                <tr key={row.lp} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-400">{row.lp}</td>
                  <td className="px-3 py-2 font-mono text-slate-700">{row.kod}</td>
                  <td className="px-3 py-2 text-slate-700">{row.nazwa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-1">📋 Tabela 2. Opisy odpadów – Cyfrowa Foto</h2>
        <p className="text-xs text-slate-400 mb-4">Lp. | Kod odpadu | Nazwa odpadu | Opis odpadu</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-3 py-2 font-semibold text-slate-600 w-10">Lp.</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600 w-28">Kod odpadu</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600 w-80">Nazwa odpadu</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Opis odpadu</th>
              </tr>
            </thead>
            <tbody>
              {table2.map(row => (
                <tr key={row.lp} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-400 align-top">{row.lp}</td>
                  <td className="px-3 py-2 font-mono text-slate-700 align-top">{row.kod}</td>
                  <td className="px-3 py-2 text-slate-700 align-top text-xs leading-relaxed">{row.nazwa}</td>
                  <td className="px-3 py-2 text-slate-600 align-top text-xs leading-relaxed">{row.opis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}