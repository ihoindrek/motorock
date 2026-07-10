import type { LegalSection } from "@/components/legal/legal-document-view";
import type { Locale } from "@/i18n/config";
import { SHOWROOM } from "@/data/showroom";

const COOKIE_POLICY_UPDATED = "18 March 2026";
const COOKIE_POLICY_UPDATED_ET = "18.03.2026";
const WEBSITE_URL = "https://motorock.eu";

const PLACED_COOKIES = {
  en: [
    "Google reCAPTCHA — Functional",
    "WooCommerce — Functional",
    "Google Analytics — Statistics",
    "Sourcebuster JS — Statistics",
    "Stripe — Functional",
    "WordPress — Functional",
    "Google AdSense — Marketing",
    "WPML — Functional",
    "Wordfence — Functional",
    "Miscellaneous — Purpose pending investigation",
  ],
  et: [
    "Google reCAPTCHA — funktsionaalsed",
    "WooCommerce — funktsionaalsed",
    "Google Analytics — statistika",
    "Sourcebuster JS — statistika",
    "Stripe — funktsionaalsed",
    "WordPress — funktsionaalsed",
    "Google AdSense — turundus",
    "WPML — funktsionaalsed",
    "Wordfence — funktsionaalsed",
    "Muu — eesmärk täpsustamisel",
  ],
} as const;

const CONSENT_CATEGORIES = {
  en: [
    "Functional — Always active",
    "Preferences",
    "Statistics",
    "Marketing",
  ],
  et: [
    "Funktsionaalsed — alati aktiivsed",
    "Eelistused",
    "Statistika",
    "Turundus",
  ],
} as const;

export function cookiePolicyUpdatedLabel(locale: Locale) {
  return locale === "et" ? COOKIE_POLICY_UPDATED_ET : COOKIE_POLICY_UPDATED;
}

export function buildCookieSections(locale: Locale): readonly LegalSection[] {
  if (locale === "et") {
    return [
      {
        id: "introduction",
        title: "1. Sissejuhatus",
        paragraphs: [
          `Meie veebileht ${WEBSITE_URL} (edaspidi: „veebileht“) kasutab küpsiseid ja muid seonduvaid tehnoloogiaid (mugavuse huvides viitame kõikidele tehnoloogiatele kui „küpsised“). Küpsiseid paigaldavad ka kolmandad osapooled, kellega oleme lepingu sõlminud. Allpool teavitame teid küpsiste kasutamisest meie veebilehel.`,
        ],
      },
      {
        id: "what-are-cookies",
        title: "2. Mis on küpsised?",
        paragraphs: [
          "Küpsis on väike lihtne fail, mis saadetakse koos selle veebilehe lehtedega ja mida teie brauser salvestab teie arvuti või muu seadme kõvakettale. Salvestatud teavet võidakse järgmisel külastusel edastada meie serveritesse või asjakohaste kolmandate osapoolte serveritesse.",
        ],
      },
      {
        id: "scripts",
        title: "3. Mis on skriptid?",
        paragraphs: [
          "Skript on programmikoodi osa, mida kasutatakse meie veebilehe nõuetekohase ja interaktiivse toimimise tagamiseks. Seda koodi täidetakse meie serveris või teie seadmes.",
        ],
      },
      {
        id: "web-beacons",
        title: "4. Mis on veebimajakas?",
        paragraphs: [
          "Veebimajakas (või piksli silt) on veebilehel väike, nähtamatu teksti- või pildifragment, mida kasutatakse veebilehe liikluse jälgimiseks. Selleks salvestatakse veebimajakate abil erinevaid andmeid teie kohta.",
        ],
      },
      {
        id: "cookie-types",
        title: "5. Küpsised",
        paragraphs: [
          "5.1 Tehnilised või funktsionaalsed küpsised — need tagavad, et teatud veebilehe osad toimivad korralikult ja teie kasutajaeelistused jäävad meelde. Funktsionaalsete küpsiste paigaldamisega muudame veebilehe külastamise lihtsamaks. Näiteks ei pea te külastamisel korduvalt samu andmeid sisestama ja ostukorvi tooted jäävad alles kuni makse sooritamiseni. Võime neid küpsiseid paigaldada ilma teie nõusolekuta.",
          "5.2 Statistika küpsised — kasutame statistika küpsiseid, et optimeerida kasutajakogemust. Nende abil saame ülevaate veebilehe kasutamisest. Statistika küpsiste paigaldamiseks küsime teie luba.",
          "5.3 Reklaamiküpsised — kasutame reklaamiküpsiseid, et saada ülevaadet kampaaniate tulemustest. See toimub profiili alusel, mis põhineb teie käitumisel motorock.eu lehel. Need küpsised seovad külastaja unikaalse ID-ga, kuid ei profiili teie käitumist ega huvisid isikupärastatud reklaamide jaoks.",
          "5.4 Turundus-/jälgimisküpsised — neid kasutatakse kasutajaprofiilide loomiseks reklaami kuvamiseks või kasutaja jälgimiseks sellel või mitmel veebilehel sarnastel turunduseesmärkidel. Kuna need on märgitud jälgimisküpsistena, küsime nende paigaldamiseks teie luba.",
        ],
      },
      {
        id: "social-media",
        title: "5.5 Sotsiaalmeedia",
        paragraphs: [
          "Meie veebilehel on lisatud Facebooki ja Instagrami sisu veebilehtede edendamiseks (nt „meeldib“, „jaga“) sotsiaalvõrgustikes. See sisu on manustatud Facebooki ja Instagrami koodiga ja paigaldab küpsiseid. See sisu võib salvestada ja töödelda teatud teavet isikupärastatud reklaamide jaoks.",
          "Lugege nende võrgustike privaatsusavaldusi (mis võivad muutuda), et mõista, mida nad nende küpsiste abil teie (isiku)andmetega teevad. Hangitud andmeid anonümiseeritakse võimalikult palju. Facebook ja Instagram asuvad Ameerika Ühendriikides.",
        ],
      },
      {
        id: "placed-cookies",
        title: "6. Paigaldatud küpsised",
        paragraphs: [],
        bullets: [...PLACED_COOKIES.et],
      },
      {
        id: "consent",
        title: "7. Nõusolek",
        paragraphs: [
          "Kui külastate meie veebilehte esimest korda, kuvame hüpikakna küpsiste selgitusega. Niipea kui klõpsate „Salvesta eelistused“, annate nõusoleku kasutada hüpikaknas valitud küpsiste kategooriaid ja pluginaid, nagu on kirjeldatud käesolevas küpsisepoliitikas. Saate küpsiste kasutamise brauseris välja lülitada, kuid võtke arvesse, et veebileht ei pruugi siis korralikult toimida.",
        ],
      },
      {
        id: "consent-settings",
        title: "7.1 Nõusoleku seadete haldamine",
        paragraphs: [],
        bullets: [...CONSENT_CATEGORIES.et],
      },
      {
        id: "manage-cookies",
        title: "8. Küpsiste lubamine, keelamine ja kustutamine",
        paragraphs: [
          "Saate kasutada internetibrauserit küpsiste automaatseks või käsitsi kustutamiseks. Samuti saate määrata, et teatud küpsiseid ei tohi paigaldada. Teine võimalus on muuta brauseri seadeid nii, et saate teate iga küpsise paigaldamisel. Lisateavet leiate brauseri abi jaotisest.",
          "Kui keelate kõik küpsised, ei pruugi veebileht korralikult toimida. Kui kustutate brauseris küpsised, paigaldatakse need uuesti pärast nõusoleku andmist järgmisel külastusel.",
        ],
      },
      {
        id: "rights",
        title: "9. Teie õigused seoses isikuandmetega",
        paragraphs: [
          "Teil on järgmised õigused seoses oma isikuandmetega:",
        ],
        bullets: [
          "õigus teada, miks teie isikuandmeid vajatakse, mis nendega juhtub ja kui kaua neid säilitatakse",
          "õigus tutvuda meile teadaolevate isikuandmetega",
          "õigus andmeid täiendada, parandada, kustutada või blokeerida",
          "õigus nõusolek tagasi võtta ja isikuandmed kustutada",
          "õigus nõuda kõiki oma isikuandmeid ja edastada need teisele vastutavale töötlejale",
          "õigus esitada vastuväiteid töötlemisele — järgime seda, välja arvatud kui on õigustatud põhjused töötlemiseks",
        ],
      },
      {
        id: "rights-contact",
        title: "Õiguste kasutamine",
        paragraphs: [
          "Nende õiguste kasutamiseks võtke meiega ühendust (kontaktandmed allpool). Kui teil on kaebus andmete töötlemise kohta, võite pöörduda ka järelevalveasutuse poole (Andmekaitse Inspektsioon).",
        ],
      },
      {
        id: "contact",
        title: "10. Kontaktandmed",
        paragraphs: [
          `Küsimuste ja/või kommentaaride korral küpsisepoliitika kohta võtke ühendust:`,
          `Motorock, ${SHOWROOM.addressLine}, ${SHOWROOM.city}, Eesti`,
          `Veebileht: ${WEBSITE_URL}`,
          `E-post: ${SHOWROOM.email}`,
          `Telefon: ${SHOWROOM.phone}`,
        ],
      },
    ];
  }

  return [
    {
      id: "introduction",
      title: "1. Introduction",
      paragraphs: [
        `Our website, ${WEBSITE_URL} (hereinafter: "the website") uses cookies and other related technologies (for convenience all technologies are referred to as "cookies"). Cookies are also placed by third parties we have engaged. In the document below we inform you about the use of cookies on our website.`,
      ],
    },
    {
      id: "what-are-cookies",
      title: "2. What are cookies?",
      paragraphs: [
        "A cookie is a small simple file that is sent along with pages of this website and stored by your browser on the hard drive of your computer or another device. The information stored therein may be returned to our servers or to the servers of the relevant third parties during a subsequent visit.",
      ],
    },
    {
      id: "scripts",
      title: "3. What are scripts?",
      paragraphs: [
        "A script is a piece of program code that is used to make our website function properly and interactively. This code is executed on our server or on your device.",
      ],
    },
    {
      id: "web-beacons",
      title: "4. What is a web beacon?",
      paragraphs: [
        "A web beacon (or a pixel tag) is a small, invisible piece of text or image on a website that is used to monitor traffic on a website. In order to do this, various data about you is stored using web beacons.",
      ],
    },
    {
      id: "cookie-types",
      title: "5. Cookies",
      paragraphs: [
        "5.1 Technical or functional cookies — Some cookies ensure that certain parts of the website work properly and that your user preferences remain known. By placing functional cookies, we make it easier for you to visit our website. This way, you do not need to repeatedly enter the same information when visiting our website and, for example, the items remain in your shopping cart until you have paid. We may place these cookies without your consent.",
        "5.2 Statistics cookies — We use statistics cookies to optimize the website experience for our users. With these statistics cookies we get insights in the usage of our website. We ask your permission to place statistics cookies.",
        "5.3 Advertising cookies — On this website we use advertising cookies, enabling us to gain insights into the campaign results. This happens based on a profile we create based on your behavior on motorock.eu. With these cookies you, as website visitor, are linked to a unique ID but these cookies will not profile your behavior and interests to serve personalized ads.",
        "5.4 Marketing/Tracking cookies — Marketing/Tracking cookies are cookies or any other form of local storage, used to create user profiles to display advertising or to track the user on this website or across several websites for similar marketing purposes. Because these cookies are marked as tracking cookies, we ask your permission to place these.",
      ],
    },
    {
      id: "social-media",
      title: "5.5 Social media",
      paragraphs: [
        "On our website, we have included content from Facebook and Instagram to promote web pages (e.g. “like”, “pin”) or share (e.g. “tweet”) on social networks like Facebook and Instagram. This content is embedded with code derived from Facebook and Instagram and places cookies. This content might store and process certain information for personalized advertising.",
        "Please read the privacy statement of these social networks (which can change regularly) to read what they do with your (personal) data which they process using these cookies. The data that is retrieved is anonymized as much as possible. Facebook and Instagram are located in the United States.",
      ],
    },
    {
      id: "placed-cookies",
      title: "6. Placed cookies",
      paragraphs: [],
      bullets: [...PLACED_COOKIES.en],
    },
    {
      id: "consent",
      title: "7. Consent",
      paragraphs: [
        "When you visit our website for the first time, we will show you a pop-up with an explanation about cookies. As soon as you click on \"Save preferences\", you consent to us using the categories of cookies and plug-ins you selected in the pop-up, as described in this Cookie Policy. You can disable the use of cookies via your browser, but please note that our website may no longer work properly.",
      ],
    },
    {
      id: "consent-settings",
      title: "7.1 Manage your consent settings",
      paragraphs: [],
      bullets: [...CONSENT_CATEGORIES.en],
    },
    {
      id: "manage-cookies",
      title: "8. Enabling/disabling and deleting cookies",
      paragraphs: [
        "You can use your internet browser to automatically or manually delete cookies. You can also specify that certain cookies may not be placed. Another option is to change the settings of your internet browser so that you receive a message each time a cookie is placed. For more information about these options, please refer to the instructions in the Help section of your browser.",
        "Please note that our website may not work properly if all cookies are disabled. If you do delete the cookies in your browser, they will be placed again after your consent when you visit our website again.",
      ],
    },
    {
      id: "rights",
      title: "9. Your rights with respect to personal data",
      paragraphs: ["You have the following rights with respect to your personal data:"],
      bullets: [
        "You have the right to know why your personal data is needed, what will happen to it, and how long it will be retained for.",
        "Right of access: You have the right to access your personal data that is known to us.",
        "Right to rectification: you have the right to supplement, correct, have deleted or blocked your personal data whenever you wish.",
        "If you give us your consent to process your data, you have the right to revoke that consent and to have your personal data deleted.",
        "Right to transfer your data: you have the right to request all your personal data from the controller and transfer it in its entirety to another controller.",
        "Right to object: you may object to the processing of your data. We comply with this, unless there are justified grounds for processing.",
      ],
    },
    {
      id: "rights-contact",
      title: "Exercising your rights",
      paragraphs: [
        "To exercise these rights, please contact us using the contact details below. If you have a complaint about how we handle your data, we would like to hear from you, but you also have the right to submit a complaint to the supervisory authority (the Data Protection Authority).",
      ],
    },
    {
      id: "contact",
      title: "10. Contact details",
      paragraphs: [
        "For questions and/or comments about our Cookie Policy and this statement, please contact us by using the following contact details:",
        `Motorock, ${SHOWROOM.addressLine}, ${SHOWROOM.city}`,
        "Estonia",
        `Website: ${WEBSITE_URL}`,
        `Email: ${SHOWROOM.email}`,
        `Phone number: ${SHOWROOM.phone}`,
      ],
    },
  ];
}

export function cookiePolicyScopeText(locale: Locale) {
  if (locale === "et") {
    return `Käesolevat küpsisepoliitikat viimati uuendati ${COOKIE_POLICY_UPDATED_ET} ja see kehtib Euroopa Majanduspiirkonna ja Šveitsi kodanike ning alaliste elanike suhtes.`;
  }

  return `This Cookie Policy was last updated on ${COOKIE_POLICY_UPDATED} and applies to citizens and legal permanent residents of the European Economic Area and Switzerland.`;
}
