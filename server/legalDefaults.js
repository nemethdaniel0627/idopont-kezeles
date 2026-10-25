// The first drafts of the terms and the privacy notice, used until an admin saves their own text (Admin →
// Feltételek és adatkezelés). The parts in [brackets] must be filled in before going live; have them checked
// by someone who knows the law. Format: "## " starts a heading, "- " a list item, an empty line a new paragraph.

const terms = `## 1. Az üzemeltető
Az Időpontfoglaló oldalt [Üzemeltető neve] ([székhely vagy cím], e-mail: [kapcsolattartó e-mail]) üzemelteti (a továbbiakban: Üzemeltető).

## 2. A szolgáltatás
Az oldalon erőforrások (például tárgyalók, parkolóhelyek) foglalhatók, és másokkal közös időpont kereshető (egyeztetés). A szolgáltatás használata ingyenes.

## 3. Regisztráció és fiók
- A regisztrációhoz valós e-mail cím kell. A jelszavadat tartsd titokban.
- A fiókodat bármikor törölheted a Profil oldalon.
- Az adminok a foglalás és az egyeztetés létrehozásának jogát megadhatják vagy visszavonhatják.

## 4. Foglalások és egyeztetések
- A foglalás megnevezését és időpontját az oldal többi látogatója is látja, az elérhetőségedet nem.
- Mások személyes adatait csak az ő beleegyezésükkel add meg, és ne írj sértő vagy jogellenes tartalmat.
- Az Üzemeltető a szabályokba ütköző foglalásokat és egyeztetéseket törölheti.

## 5. Felelősség
Az Üzemeltető törekszik az oldal folyamatos működésére, de a jogszabályok által megengedett mértékben nem felel az üzemszünetből, adatvesztésből vagy egy foglalás meghiúsulásából eredő károkért.

## 6. A feltételek módosítása
Az Üzemeltető a feltételeket módosíthatja. Lényeges változás esetén a következő belépéskor újra el kell fogadnod őket.

## 7. Kapcsolat
Kérdés esetén írj a [kapcsolattartó e-mail] címre.`;

const privacy = `## 1. Az adatkezelő
[Üzemeltető neve], [székhely vagy cím], e-mail: [kapcsolattartó e-mail].
[Ha van adatvédelmi tisztviselő: neve és elérhetősége.]

## 2. Milyen adatokat kezelünk, és miért
- Regisztráció: név, e-mail cím, telefonszám (nem kötelező), jelszó (csak visszafejthetetlen, titkosított formában), a regisztráció ideje és a feltételek elfogadása. Cél: a fiók és a belépés működése. Jogalap: a szolgáltatás nyújtása (GDPR 6. cikk (1) b) pont).
- Foglalás: a foglalás megnevezése, leírása, időpontja, valamint az e-mail cím vagy telefonszám. Cél: a foglalás nyilvántartása, módosítása, lemondása, és értesítés, ha az erőforrás megszűnik. Jogalap: GDPR 6. cikk (1) b) pont.
- Egyeztetés: a válaszadó neve, a bejelölt időpontok és a megadott (nem kötelező) elérhetőség; a szervezőnél az egyeztetés adatai. Jogalap: GDPR 6. cikk (1) b) pont.
- Biztonság: a belépéshez egy munkamenet-süti; a sikertelen belépési kísérleteknél az IP-cím legfeljebb 1 óráig, csak a szerver memóriájában. Cél: a jelszavak kitalálásának megakadályozása. Jogalap: jogos érdek (GDPR 6. cikk (1) f) pont).

## 3. Ki látja az adataidat
- A foglalások megnevezését és időpontját minden látogató látja, az elérhetőségeket csak az adminok.
- Egy egyeztetésben a neveket és az időpontokat a szervező beállításától függően a résztvevők is láthatják, az elérhetőségeket csak a szervező és az adminok.
- Az adataidat nem adjuk el, reklámcélra senkinek nem adjuk át, és nem használunk követő vagy reklámsütiket.

## 4. Adatfeldolgozók
Az oldal és az adatbázis szolgáltatói: [például Google Cloud (Google Ireland Ltd., szerver: Belgium) és Supabase (adatbázis: Írország)]. Az adatokat az Európai Unióban tároljuk.

## 5. Meddig őrizzük az adatokat
- A fiók adatait a fiók törléséig.
- A foglalások és az egyeztetések elérhetőségeit (e-mail, telefon) a foglalás vége, illetve az egyeztetés lezárása után 12 hónappal automatikusan töröljük.
- A belépés 30 nap után lejár; a jelszó-visszaállító link 1 óráig érvényes.

## 6. Sütik és helyi tárolás
Csak a működéshez szükséges munkamenet-sütit használjuk a belépéshez. Az egyeztetésekre adott válaszod privát szerkesztő kulcsát a böngésződ helyi tárolójában tartjuk, hogy később módosíthasd. Ezekhez nem kell hozzájárulás, mert nélkülük az oldal nem működne.

## 7. A jogaid
- Hozzáférés és adathordozhatóság: a Profil oldalon letöltheted az összes rólad tárolt adatot.
- Helyesbítés: a nevedet, e-mail címedet és telefonszámodat a Profil oldalon módosíthatod.
- Törlés: a Profil oldalon törölheted a fiókodat és a személyes adataidat. A jövőbeli foglalásaidat ekkor lemondjuk, a korábbiakból az elérhetőséged törlődik.
- Tiltakozás, az adatkezelés korlátozása és minden más kérés: írj a [kapcsolattartó e-mail] címre, egy hónapon belül válaszolunk.
- Panasz: a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH, 1055 Budapest, Falk Miksa utca 9–11., www.naih.hu), vagy bírósághoz fordulhatsz.

## 8. Adatbiztonság
A jelszavakat csak titkosítva tároljuk, a kapcsolat titkosított (HTTPS), és az adatbázist csak az oldal szervere éri el.`;

module.exports = { DEFAULT_TEXTS: { terms, privacy } };
