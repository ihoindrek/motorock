import type { LegalSection } from "@/components/legal/legal-document-view";
import { buildCookieSections } from "@/data/cookie-policy-content";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { SHOWROOM, getShowroomCopy } from "@/data/showroom";
import {
  COURIER_DELIVERY,
  DELIVERY_TIMES,
  INTERNATIONAL_CARRIERS_NOTE,
  ORDER_PROCESSING_DAYS,
  PARCEL_LOCKERS,
  PAYMENT_METHODS_CHECKOUT,
  POLICY_EMAILS,
  POLICY_PHONE,
  shippingCostsCheckoutText,
  showroomPickupLabel,
} from "@/data/storefront-policies";

const companyName = "Motomonopol OÜ";
const companyRegistryCode = "17332522";
const storefrontDomain = "motorock.eu";
const contactEmail = SHOWROOM.email;
const showroomAddress = `${SHOWROOM.addressLine}, ${SHOWROOM.city}`;

function externalLink(href: string, label?: string) {
  return {
    type: "link" as const,
    label: label ?? href,
    href,
    external: true,
  };
}

function buildPrivacySections(locale: Locale): readonly LegalSection[] {
  if (locale === "et") {
    return [
      {
        id: "general",
        title: "Üldsätted",
        paragraphs: [
          `Käesolev privaatsuspoliitika reguleerib veebipoe ${storefrontDomain} (edaspidi Veebipood) isikuandmete kogumist, töötlemist ja säilitamist käsitlevaid põhimõtteid. Isikuandmeid kogub, töötleb ja säilitab isikuandmete vastutav töötleja ${companyName} (registrikood ${companyRegistryCode}). Salong asub aadressil ${showroomAddress}. Telefon ${SHOWROOM.phone} ja e-post ${contactEmail}.`,
          "Andmesubjekt privaatsuspoliitika tähenduses on klient või muu füüsiline isik, kelle isikuandmeid andmetöötleja töötleb.",
          "Klient privaatsuspoliitika tähenduses on igaüks, kes ostab andmetöötleja kodulehelt kaupu või teenuseid.",
          "Andmetöötleja järgib õigusaktides sätestatud andmete töötlemise põhimõtteid, muuhulgas töötleb andmetöötleja isikuandmeid seaduslikult, õiglaselt ja turvaliselt. Andmetöötleja on võimeline kinnitama, et isikuandmeid on töödeldud vastavalt õigusaktides sätestatule.",
        ],
      },
      {
        id: "data-processed",
        title: "Milliseid isikuandmeid töödeldakse",
        paragraphs: [],
        bullets: [
          "nimi, telefoninumber ja e-posti aadress",
          "kauba kohaletoimetamise aadress",
          "pangakonto number",
          "kaupade ja teenuste maksumus ja maksetega seotud andmed (ostuajalugu)",
          "klienditoe andmed",
          "veebilehe ja turunduskanalite (reklaamid, otsepostitus) külastusstatistika",
          "IP-aadress",
        ],
      },
      {
        id: "data-collection",
        title: "Andmete kogumine",
        paragraphs: [
          "Lisaks eeltoodule on andmetöötlejal õigus koguda kliendi kohta andmeid, mis on kättesaadavad avalikes registrites.",
          "Isikuandmed, mida andmetöötleja kogub, töötleb ja säilitab, on kogutud elektrooniliselt, peamiselt kodulehe ja e-posti vahendusel, kuid lisaks ka kontaktüritustel nagu demopäevad, messid jms.",
          "Oma isikuandmete jagamisega annab andmesubjekt andmetöötlejale õiguse koguda, korraldada, kasutada ja hallata privaatsuspoliitikas määratletud eesmärgil isikuandmeid, mida andmesubjekt otse või kaudselt kodulehel kaupu või teenuseid ostes andmetöötlejale jagab.",
          "Andmesubjekt vastutab selle eest, et tema poolt esitatud andmed oleksid täpsed, õiged ja terviklikud. Teadlikult valeandmete esitamist peetakse privaatsuspoliitika rikkumiseks. Andmesubjekt on kohustatud andmetöötlejat viivitamatult teavitama esitatud andmete muutumisest.",
          "Andmetöötleja ei vastuta andmesubjekti poolt valeandmete esitamisest põhjustatud kahju eest andmesubjektile või kolmandatele osapooltele.",
        ],
      },
      {
        id: "purposes",
        title: "Mis eesmärgil isikuandmeid töödeldakse",
        paragraphs: [
          "Isikuandmeid kasutatakse kliendi tellimuste haldamiseks ja kauba kohaletoimetamiseks.",
          "Ostuajaloo andmeid (ostu kuupäev, kaup, kogus, kliendi andmed) kasutatakse ostetud kaupade ja teenuste ülevaate koostamiseks, kliendieelistuste analüüsimiseks ning tarbijavaidluste lahendamise eesmärgil.",
          "Pangakonto numbrit kasutatakse kliendile maksete tagastamiseks.",
          "Isikuandmeid nagu e-post, telefoni nr ja kliendi nimi töödeldakse selleks, et lahendada kaupade ja teenuste osutamise seonduvaid küsimusi (klienditugi). E-posti kasutatakse lisaks arvete saatmiseks ning telefoni numbrit kasutatakse pakiautomaati jõudnud kauba kohta teavituse saatmiseks kauba tellijale.",
          "Veebipoe kasutaja IP-aadressi või teisi võrguidentifikaatoreid töödeldakse veebipoe kui infoühiskonna teenuse osutamiseks ning veebikasutusstatistika tegemiseks.",
          "Veebilehe ja turunduskanalite statistikat kogutakse ja töödeldakse veebipoe kasutajakogemuse parandamiseks, tootesortimendi osas otsuste langetamise ning klientidele sobivamate pakkumiste tegemise eesmärgil.",
        ],
      },
      {
        id: "cookies",
        title: "Küpsiste kasutamine veebilehel",
        paragraphs: [
          `Külastades veebilehte ${storefrontDomain}, võidakse teie tuvastamiseks kasutada mitmesuguseid tehnoloogiaid, mille abil saame oma kasutajate kohta lisateavet. See võib toimuda otse või kolmanda osapoole tehnoloogia kaudu. Näiteks võib olla tegemist küpsiste kasutamisega.`,
          "Küpsiseid on kahte tüüpi. Esimene neist salvestab tekstifaili pikema aja jooksul ja sellel on aegumistähtaeg. Selle küpsise eesmärk on näiteks anda teile teada, mida uut on tehtud pärast teie viimatist külastust.",
          "Teist tüüpi küpsist nimetatakse seansiküpsiseks ja sellele aegumistähtaega pole. Selle puhul salvestatakse tekstifail ajutiselt ajal, kui meie saiti külastate. See aitab meil meeles pidada näiteks seda, millist keelt soovite kasutada. Tekstifail kustutatakse kohe pärast brauseri sulgemist.",
          "Küpsised aitavad:",
        ],
        bullets: [
          "toimida veebilehel teie ootustele vastavalt, näiteks vältida vajadust ühe sessiooni jooksul mitu korda sisse logida",
          "mäletada teie seadistusi ja muuta lehe sisu teie jaoks personaalsemaks, et infot kiiremini leida",
          `parandada ${storefrontDomain} veebilehe kiirust ja turvalisust`,
          "et veebilehe sisu sotsiaalmeedias hõlpsamini jagada (Facebook)",
          "plaanida veebilehe parandusi ja arendusi",
        ],
      },
      {
        id: "third-party-cookies",
        title: "Kolmandate poolte funktsioonid",
        paragraphs: [
          "Näiteks Facebook ja Google võivad kasutada oma küpsiseid või muid meetodeid, et koguda teavet meie veebilehe sisu kohta, millel olete klõpsanud. Nad kasutavad sedalaadi teavet selleks, et pakkuda kasutusstatistika analüüse ja reklaame teid huvitavatel teemadel.",
          "Neile küpsistele me ei pääse ligi ega kontrolli neid. Kolmandate osapoolte küpsiste kasutamine kuulub paigaldajate privaatsuspoliitika alla. Selleks soovitame teil eraldi tutvuda kõigi kolmandate poolte privaatsuspoliitikaga.",
          "Facebooki küpsiste tingimustega saate tutvuda siin:",
          [
            externalLink("https://www.facebook.com/policies/cookies"),
          ],
          "Google'i küpsiste tingimustega saate tutvuda siin:",
          [
            externalLink("https://www.google.com/policies/technologies/cookies"),
          ],
          "MailChimp (uudiskirjad) küpsiste tingimustega saate tutvuda siin:",
          [
            externalLink("https://mailchimp.com/legal/"),
            " ja siin: ",
            externalLink("https://mailchimp.com/legal/privacy/"),
          ],
          "Hotjar küpsiste tingimustega saate tutvuda siin:",
          [
            externalLink("https://www.hotjar.com/legal/compliance/gdpr-commitment"),
          ],
        ],
      },
      {
        id: "legal-basis",
        title: "Õiguslik alus",
        paragraphs: [
          "Isikuandmete töötlemine toimub kliendiga sõlmitud lepingu täitmise eesmärgil (kliendi tellimuste haldamine, kohaletoimetamine, kauba ja maksete tagastamine).",
          "Isikuandmete töötlemine toimub seadusjärgse kohustuse täitmiseks (nt raamatupidamine).",
          "Isikuandmete töötlemine on vajalik vastutava töötleja õigustatud huvi tõttu, mis seisneb võimalike tarbijavaidluste lahendamise eesmärgil ostuajaloo andmete kogumises.",
        ],
      },
      {
        id: "recipients",
        title: "Vastuvõtjad, kellele isikuandmed edastatakse",
        paragraphs: [
          "Isikuandmed edastatakse veebipoe klienditoele ostude ja ostuajaloo haldamiseks ja kliendiprobleemide lahendamiseks.",
          "Nimi, telefoninumber ja e-posti aadress edastatakse kliendi poolt valitud transporditeenuse pakkujale. Kui tegemist on kulleriga kohale toimetatava kaubaga, siis edastatakse lisaks kontaktandmetele ka kliendi aadress.",
          "Kui veebipoe raamatupidamine toimub teenusepakkuja poolt, siis edastatakse isikuandmed teenusepakkujale raamatupidamistoimingute tegemiseks.",
          "Isikuandmeid võidakse edastada infotehnoloogia teenuste pakkujatele, kui see on vajalik veebipoe funktsionaalsuse või andmemajutuse tagamiseks.",
        ],
      },
      {
        id: "security",
        title: "Turvalisus ja andmetele ligipääs",
        paragraphs: [
          "Isikuandmeid hoitakse Elkdata OÜ serverites, mis asuvad Euroopa Liidu liikmesriigi või Euroopa Liidu majanduspiirkonnaga liitunud riikide territooriumil. Andmeid võidakse edastada riikidesse, mille andmekaitse taset on Euroopa Komisjon hinnanud piisavaks või kolmanda riigi ettevõttele, mille osas on kohaldatud isikuandmete kaitse üldmääruse artiklis 46 või 47 või 49 lõikes 1 nimetatud kaitsemeedet.",
          "Juurdepääs isikuandmetele on veebipoe töötajatel, kes saavad isikuandmetega tutvuda selleks, et lahendada veebipoe kasutamisega seonduvaid tehnilisi küsimusi ning osutada klienditoe teenust.",
          "Veebipood rakendab asjakohaseid füüsilisi, organisatsioonilisi ja infotehnilisi turvameetmeid, et kaitsta isikuandmeid juhusliku või ebaseadusliku hävitamise, kaotsimineku, muutmise või loata juurdepääsu ja avalikustamise eest, milleks on:",
        ],
        bullets: [
          "andmevahetus e-poega toimub krüpteeritud ühenduse kaudu (TLS)",
          "kliendi paroole hoitakse krüpteeritult",
          "e-kirjade saatmisel on kasutusel standardne krüpteerimine",
          "e-poe serverite kaitseks on rakendatud tulemüüri ja asjakohast viirusetõrjet, luuakse regulaarseid varukoopiaid",
        ],
      },
      {
        id: "processors",
        title: "Volitatud töötlejad",
        paragraphs: [
          "Isikuandmete edastamine veebipoe volitatud töötlejatest vastuvõtjatele (nt transporditeenuse pakkuja ja andmemajutus) toimub veebipoe ja volitatud töötlejatega sõlmitud lepingute alusel.",
          "Volitatud töötlejaid on kohustatud tagama isikuandmete töötlemisel asjakohased kaitsemeetmed kooskõlas isikuandmete kaitse üldmääruse artikliga 28.",
        ],
      },
      {
        id: "access",
        title: "Isikuandmetega tutvumine ja parandamine",
        paragraphs: [
          "Isikuandmetega saab tutvuda ja teha parandusi veebipoe kasutajaprofiilis või klienditoe vahendusel. Kui ost on sooritatud ilma kasutajakontota, siis saab tutvuda isikuandmetega klienditoe vahendusel. Kui isikuandmetega tutvumise taotlus on esitatud elektrooniliselt, esitatakse ka teave üldkasutatavate elektrooniliste vahendite kaudu.",
        ],
      },
      {
        id: "consent",
        title: "Nõusoleku tagasivõtmine",
        paragraphs: [
          "Kui isikuandmete töötlemine toimub kliendi nõusoleku alusel, siis on kliendil õigus nõusolek tagasi võtta kliendikonto seadete all või teavitades sellest kliendituge e-posti teel.",
        ],
      },
      {
        id: "storage",
        title: "Säilitamine",
        paragraphs: [
          "Veebipoe kliendikonto sulgemisel kustutatakse isikuandmed, va isikuandmed (ostuajaloo andmed), mida on vaja säilitada raamatupidamise jaoks või tarbijavaidluste lahendamiseks.",
          "Maksetega ja tarbijavaidlustega seotud vaidluste korral säilitatakse isikuandmed kuni nõude täitmiseni või aegumistähtaja lõpuni.",
          "Raamatupidamise algdokumentides sisalduvaid isikuandmeid säilitatakse seitse aastat.",
        ],
      },
      {
        id: "restriction",
        title: "Piiramine",
        paragraphs: [
          "Kliendil on õigus taotleda oma isikuandmete töötlemise piiramist, kui andmed on ebaõiged või pole täielikud või kui tema isikuandmeid töödeldakse ebaseaduslikult.",
        ],
      },
      {
        id: "objections",
        title: "Vastuväited",
        paragraphs: [
          "Kliendil on õigus esitada vastuväiteid seoses tema isikuandmete töötlemisega, kui tal on alust arvata, et tema isikuandmete töötlemiseks puudub seaduslik alus.",
        ],
      },
      {
        id: "deletion",
        title: "Kustutamine",
        paragraphs: [
          "Isikuandmete kustutamiseks tuleb võtta ühendust klienditoega e-posti teel. Kustutamistaotlusele vastatakse mitte hiljem kui kuu aja jooksul ning täpsustakse andmete kustutamise perioodi.",
          "Vastuses taotlusele tuuakse ka välja need isikuandmed, mida ei kustuta ning see, millisel õiguslikul alusel ja põhjusel neid ei kustutata.",
        ],
      },
      {
        id: "transfer",
        title: "Ülekandmine",
        paragraphs: [
          "E-posti teel esitatud isikuandmete ülekandmise taotlusele vastatakse hiljemalt kuu aja jooksul.",
          "Klienditugi tuvastab isikusamasuse ja teavitab isikuandmetest, mis kuuluvad ülekandmisele.",
        ],
      },
      {
        id: "marketing",
        title: "Otseturustusteated",
        paragraphs: [
          "E-kirja aadressi ja telefoninumbrit kasutatakse otseturundusteadete saatmiseks, kui klient on andnud vastava nõusoleku. Kui klient ei soovi saada otseturustusteateid, siis tuleb valida e-kirja jaluses vastav viide või võtta ühendust klienditoega.",
        ],
      },
      {
        id: "disputes",
        title: "Vaidluste lahendamine",
        paragraphs: [
          [
            "Isikuandmete töötlemisega seotud vaidluste lahendamine toimub klienditoe vahendusel ",
            externalLink(`mailto:${contactEmail}`, contactEmail),
            ". Järelevalveasutus on Eesti Andmekaitse Inspektsioon (",
            externalLink("mailto:info@aki.ee", "info@aki.ee"),
            ").",
          ],
        ],
      },
    ];
  }

  return [
    {
      id: "general",
      title: "General provisions",
      paragraphs: [
        `This privacy policy governs the principles governing the collection, processing and storage of personal data by the online shop ${storefrontDomain} (hereinafter referred to as the Online Shop). The personal data is collected and stored by the controller of personal data ${companyName} (registration code ${companyRegistryCode}). Our showroom is located at ${showroomAddress}. Phone ${SHOWROOM.phone} and e-mail ${contactEmail}.`,
        "For the purposes of the Privacy Policy, a data subject is a customer or other natural person whose personal data is processed by a data processor.",
        "For the purposes of this Privacy Policy, a customer is anyone who purchases goods or services from the website of the data processor.",
        "The data processor complies with the data processing principles laid down in the legislation, including the lawful, fair and secure processing of personal data. The data controller is able to confirm that the personal data have been processed in accordance with the law.",
      ],
    },
    {
      id: "data-processed",
      title: "What personal data is processed",
      paragraphs: [],
      bullets: [
        "name, telephone number and e-mail address",
        "delivery address",
        "bank account number",
        "the cost of goods and services and payment details (purchase history)",
        "customer support details",
        "statistics on visits to the website and marketing channels (ads, direct mail)",
        "IP address",
      ],
    },
    {
      id: "data-collection",
      title: "Collection of personal data",
      paragraphs: [
        "In addition to the above, the data controller is entitled to collect data about the customer that is available in public registers.",
        "The personal data collected, processed and stored by the data processor are collected electronically, mainly through the website and e-mail, but also through contact events such as demo days, trade fairs, etc.",
        "By sharing his or her personal data, the data subject grants the data processor the right to collect, organise, use and manage, for the purposes specified in the Privacy Policy, the personal data that the data subject directly or indirectly shares with the data processor when purchasing goods or services on the website.",
        "It is the data subject's responsibility to ensure that the information he or she provides is accurate, correct and complete. Knowingly providing false information will be considered a breach of the Privacy Policy. It is the data subject's responsibility to inform the data processor immediately of any changes to the data provided.",
        "The data processor shall not be liable for any damage caused by the submission of incorrect data by the data subject to the data subject or to third parties.",
      ],
    },
    {
      id: "purposes",
      title: "Purposes for which personal data is processed",
      paragraphs: [
        "Personal data is used for the management of customer orders and the delivery of goods.",
        "Purchase history data (date of purchase, goods, quantity, customer details) is used to provide an overview of the goods and services purchased, to analyse customer preferences and to resolve consumer disputes.",
        "The bank account number is used to refund payments to the customer.",
        "Personal data, such as e-mail, telephone number, customer's name, are processed in order to resolve issues related to the provision of goods and services (customer support). In addition, e-mail is used to send invoices and the telephone number is used to notify the customer of the arrival of the goods at the parcel machine.",
        "A web shop user's IP address or other network identifiers are processed for the purposes of providing the web shop as an information society service and for web usage statistics.",
        "Website and marketing channel statistics are collected and processed for the purposes of improving the user experience of the online shop, making decisions about product ranges and making more appropriate offers to customers.",
      ],
    },
    {
      id: "cookies",
      title: "Use of cookies on the website",
      paragraphs: [
        `When you visit ${storefrontDomain}, we may use a variety of technologies to identify you and to obtain additional information about our users. This may be directly or through third party technology. For example, it may involve the use of cookies.`,
        "There are two types of cookies. The first saves a text file for a longer period of time and has an expiry date. The purpose of this cookie is, for example, to let you know what's new since your last visit.",
        "Another type of cookie is called a session cookie and has no expiry date. In this case, a text file is temporarily stored when you visit our site. This helps us to remember, for example, which language you prefer to use. The text file will be deleted as soon as you close the browser.",
        "Cookies help:",
      ],
      bullets: [
        "manage the website according to your expectations, for example, avoid the need to log in several times in one session",
        "remember your settings and personalise page content for you to find information faster",
        `improve the speed and security of the ${storefrontDomain} website`,
        "make it easier to share website content on social media (Facebook)",
        "plan website improvements and developments",
      ],
    },
    {
      id: "third-party-cookies",
      title: "Functions of third parties",
      paragraphs: [
        "For example, Facebook and Google may use their cookies or other methods to collect information about the content of our website that you have clicked on. They use this type of information to provide usage statistics analysis and advertisements on topics of interest to you.",
        "We do not access or control these cookies. The use of third party cookies is subject to the privacy policy of the installers. To this end, we recommend that you read the privacy policies of each third party separately.",
        "You can read the Facebook Cookie Policy here:",
        [externalLink("https://www.facebook.com/policies/cookies")],
        "You can read Google's terms and conditions for cookies here:",
        [externalLink("https://www.google.com/policies/technologies/cookies")],
        "You can read the terms and conditions of MailChimp (newsletters) cookies here:",
        [
          externalLink("https://mailchimp.com/legal/"),
          " and here: ",
          externalLink("https://mailchimp.com/legal/privacy/"),
        ],
        "You can read the terms and conditions of Hotjar cookies here:",
        [externalLink("https://www.hotjar.com/legal/compliance/gdpr-commitment")],
      ],
    },
    {
      id: "legal-basis",
      title: "Legal basis",
      paragraphs: [
        "The processing of personal data is carried out for the purposes of the performance of the contract with the customer (management of customer orders, delivery, return of goods and payments).",
        "Processing of personal data for the performance of a legal obligation (e.g. accounting).",
        "The processing of personal data is necessary for the purposes of the legitimate interest pursued by the controller in the collection of purchase history data for the settlement of possible consumer disputes.",
      ],
    },
    {
      id: "recipients",
      title: "Recipients to whom personal data are disclosed",
      paragraphs: [
        "Personal data will be transferred to the online shop's customer support for the purpose of managing purchases and purchase history and resolving customer issues.",
        "The name, telephone number and e-mail address will be transmitted to the transport service provider chosen by the customer. In the case of goods to be delivered by courier, the customer's address will be transmitted in addition to the contact details.",
        "In the case of an online shop where the accounting is carried out by a service provider, the personal data will be transmitted to the service provider for the purpose of carrying out accounting operations.",
        "Personal data may be transferred to information technology service providers if this is necessary to ensure the functionality or data availability of the online shop.",
      ],
    },
    {
      id: "security",
      title: "Security and data access",
      paragraphs: [
        "Personal data is stored on Elkdata OÜ servers located in the territory of a Member State of the European Union or in the territory of countries that have joined the European Economic Area. The data may be transferred to countries whose level of data protection has been assessed as adequate by the European Commission or to a third country undertaking to which a safeguard measure referred to in Articles 46 or 47 or 49(1) of the GDPR has been applied.",
        "Access to personal data is granted to the employees of the online shop who can access personal data in order to resolve technical issues related to the use of the online shop and to provide customer support services.",
        "The online shop implements appropriate physical, organisational and IT security measures to protect personal data against accidental or unlawful destruction, loss, alteration or unauthorised access and disclosure, such as:",
      ],
      bullets: [
        "data exchange with the e-shop takes place over an encrypted connection (TLS)",
        "customer passwords are kept encrypted",
        "emails are sent using standard encryption",
        "a firewall and appropriate anti-virus protection is in place to protect the e-shop servers, and regular backups are made",
      ],
    },
    {
      id: "processors",
      title: "Data processors",
      paragraphs: [
        "Transfers of personal data from the online shop to recipients (e.g. transport service providers and data aggregators) are based on contracts between the online shop and the processors.",
        "Processors are obliged to ensure appropriate safeguards for the processing of personal data in accordance with Article 28 of the GDPR.",
      ],
    },
    {
      id: "access",
      title: "Accessing and correcting personal data",
      paragraphs: [
        "Personal data can be accessed and corrections can be made in the online shop's user profile or via customer support. If the purchase has been made without a user account, the personal data can be accessed via the online support. If the request for access to personal data has been made electronically, the information will also be provided through publicly available electronic means.",
      ],
    },
    {
      id: "consent",
      title: "Withdrawal of consent",
      paragraphs: [
        "If the processing of personal data is carried out on the basis of the customer's consent, the customer has the right to withdraw the consent in the customer account settings or by informing customer support by e-mail.",
      ],
    },
    {
      id: "storage",
      title: "Storage",
      paragraphs: [
        "When you close your online shop account, your personal data will be deleted, with the exception of personal data (purchase history data) that need to be stored for accounting purposes or to resolve consumer disputes.",
        "In the case of disputes relating to payments and consumer disputes, personal data will be kept until the claim is settled or the limitation period expires.",
        "Personal data contained in accounting records shall be kept for seven years.",
      ],
    },
    {
      id: "restriction",
      title: "Restriction",
      paragraphs: [
        "You have the right to request the restriction of the processing of your personal data if the data is inaccurate or incomplete or if your personal data is processed unlawfully.",
      ],
    },
    {
      id: "objections",
      title: "Objections",
      paragraphs: [
        "The customer has the right to object to the processing of his/her personal data if he/she has reason to believe that there is no lawful basis for the processing of his/her personal data.",
      ],
    },
    {
      id: "deletion",
      title: "Deletion",
      paragraphs: [
        "If you wish to have your personal data deleted, please contact customer support by e-mail. A reply to the deletion request will be sent within one month at the latest, specifying the period of deletion.",
        "The reply to the request shall also specify the personal data that will not be deleted and the legal basis and reason for the non-deletion.",
      ],
    },
    {
      id: "transfer",
      title: "Transfer of personal data",
      paragraphs: [
        "Requests for transfer of personal data made by e-mail will be answered within one month at the latest.",
        "Customer Support will verify the identity and notify the personal data to be transferred.",
      ],
    },
    {
      id: "marketing",
      title: "Direct marketing communications",
      paragraphs: [
        "The email address and telephone number will be used to send direct marketing messages if the customer has given their consent. If the customer does not wish to receive direct marketing communications, he/she should select the appropriate reference in the footer of the e-mail or contact customer support.",
      ],
    },
    {
      id: "disputes",
      title: "Dispute resolution",
      paragraphs: [
        [
          "Disputes relating to the processing of personal data can be resolved by contacting customer support at ",
          externalLink(`mailto:${contactEmail}`, contactEmail),
          ". The supervisory authority is the Estonian Data Protection Inspectorate (",
          externalLink("mailto:info@aki.ee", "info@aki.ee"),
          ").",
        ],
      ],
    },
  ];
}

function termsDeliveryBullets(locale: Locale) {
  return [
    ...PARCEL_LOCKERS[locale],
    COURIER_DELIVERY[locale],
    showroomPickupLabel(locale),
  ];
}

function buildTermsSections(locale: Locale): readonly LegalSection[] {
  const returnsHref = localizedHref(locale, "/returns#withdrawal-form");
  const consumerDisputesHref =
    locale === "et"
      ? "https://ttja.ee/et/tarbijavaidluste-komisjon"
      : "https://ttja.ee/en/consumer-disputes-committee";
  const odrHref = "https://ec.europa.eu/consumers/odr";
  const hereLabel = locale === "et" ? "siit" : "here";

  if (locale === "et") {
    return [
      {
        id: "terms-of-sale",
        title: "Müügitingimused",
        paragraphs: [
          `Veebipoe ${storefrontDomain} (edaspidi Veebipood) omanik on ${companyName} (registrikood ${companyRegistryCode}). Salong asub aadressil ${showroomAddress}. Kontakt: ${SHOWROOM.phone}, ${contactEmail}.`,
        ],
      },
      {
        id: "validity",
        title: "Müügilepingu, toote- ja hinnateabe kehtivus",
        paragraphs: [
          "Müügitingimused kehtivad veebipoest kaupade ostmisel.",
          "Veebipoes müüdavate toodete hinnad on märgitud toodete kõrval. Hinnale lisandub kättetoimetamistasu. Kõik hinnad on eurodes.",
          "Tarnetasu sõltub ostja asukohast ja valitud tarneviisist. Tarnetasu kuvatakse ostjale tellimuse vormistamise ajal.",
          "Tooteinfo on veebipoes toote kõrval.",
        ],
      },
      {
        id: "placing-order",
        title: "Tellimuse esitamine",
        paragraphs: [
          "Toote tellimiseks tuleb soovitud tooted lisada ostukorvi. Tellimuse vormistamiseks tuleb täita nõutud väljad ja valida sobiv kättetoimetamisviis. Seejärel kuvatakse kogusumma, mille saab turvaliselt tasuda järgmiste makseviiside abil:",
        ],
        bullets: [...PAYMENT_METHODS_CHECKOUT.et],
      },
      {
        id: "payment",
        title: "Maksete töötlemine",
        paragraphs: [
          [
            "Täpsemad makseviisi valikud on saadaval makseteenuse pakkuja Montonio Finance UAB veebisaidil: ",
            {
              type: "link",
              label: "https://montonio.com/et/maksed/",
              href: "https://montonio.com/et/maksed/",
              external: true,
            },
          ],
          "NB! Pangalingi kaudu makstes tuleb kindlasti pärast makse sooritamist panga lehel klõpsata nupul „Tagasi kaupmehe juurde“.",
          "Makseid töötleb Montonio Finance UAB. Maksed tehakse väljaspool veebipoodi turvalises keskkonnas – pangalingi kasutamisel panga turvalises keskkonnas ja krediitkaardi kasutamisel Montonio turvalises keskkonnas. Müüjal puudub juurdepääs kliendi panga- ega krediitkaardiandmetele. Leping jõustub alates tasumisele kuuluva summa laekumisest veebipoe pangakontole.",
          "Veebipoe omanik on isikuandmete vastutav töötleja ja edastab vajalikud isikuandmed volitatud töötleja Maksekeskus AS-ile maksete töötlemiseks.",
          "Kui tellitud toodet ei ole võimalik tarnida selle laoseisu puudumise või muul põhjusel, teavitatakse ostjat sellest esimesel võimalusel ning tasutud summa (sh kättetoimetamiskulud) tagastatakse viivitamata, kuid mitte hiljem kui 14 päeva jooksul teate saatmisest.",
        ],
      },
      {
        id: "delivery",
        title: "Kohaletoimetamine",
        paragraphs: [
          "Tooteid saadetakse kõikidesse Euroopa Liidu liikmesriikidesse.",
          "Ostjal on checkoutis järgmised kättetoimetamisvõimalused (sõltuvalt tarneriigist ja tellimusest):",
        ],
        bullets: termsDeliveryBullets("et"),
      },
      {
        id: "delivery-times",
        title: "Tarneajad ja kulud",
        paragraphs: [
          "Saatmiskulud kannab ostja ja need kuvatakse checkoutis tarneviisi kõrval.",
          DELIVERY_TIMES.estonia.et,
          DELIVERY_TIMES.finland.et,
          DELIVERY_TIMES.eu.et,
          `Tellimusi töödeldakse tavaliselt ${ORDER_PROCESSING_DAYS.et} enne väljasaatmist.`,
          INTERNATIONAL_CARRIERS_NOTE.et,
          "Erandjuhtudel on Veebipoel õigus toode kohale toimetada kuni 45 kalendripäeva jooksul.",
          "Kui Veebipood on ostjat veebisaidil või tellimuse kinnituses teavitanud tarneprobleemidest või üle 30 kalendripäeva kestvast viivitusest, kohaldatakse Veebipoe määratud tähtaega.",
        ],
      },
      {
        id: "withdrawal",
        title: "Taganemisõigus",
        paragraphs: [
          "Pärast tellimuse kättesaamist on ostjal õigus veebipoe vahendusel sõlmitud lepingust 14 päeva jooksul taganeda.",
          "Taganemisõigus ei kehti, kui ostja on juriidiline isik.",
          "14-päevase tagastusõiguse kasutamiseks võib toodet kasutada ainult viisil, mis on vajalik toote olemuse, omaduste ja toimimise kontrollimiseks – nagu see oleks lubatud füüsilises poes.",
          "Kui toodet on kasutatud muul otstarbel kui on vaja selle olemuse, omaduste või toimimise kindlakstegemiseks või sellel on kasutamise või kulumise märke, on Veebipoel õigus vähendada tagastatavat summat vastavalt toote väärtuse vähenemisele.",
          [
            "Toote tagastamiseks esitage taganemisavaldus veebilehe ",
            { type: "link", label: hereLabel, href: returnsHref },
            " vormi kaudu või saatke avaldus aadressile ",
            contactEmail,
            " hiljemalt 14 päeva jooksul alates kauba kättesaamisest.",
          ],
          "Kauba tagastamise kulud kannab ostja, välja arvatud juhul, kui tagastamise põhjuseks on see, et kohale toimetatud asi ei vasta tellimusele (nt vale või defektne toode).",
          "Ostja peab toote tagastama 14 päeva jooksul alates taganemisavalduse esitamisest või esitama tõendi, et on selle aja jooksul kullerile üle andnud.",
          "Tagastatud kauba kättesaamisel tagastab Veebipood ostjale kõik lepingu alusel saadud tasud viivitamata, kuid mitte hiljem kui 14 päeva jooksul alates taganemisteate kättesaamisest.",
          "Veebipood võib tagasimakset edasi lükata kuni toote tagastamiseni või kuni ostja on esitanud tagastamise kohta tõendi, olenevalt sellest, kumb toimub varem.",
          "Kui ostja on sõnaselgelt valinud Veebipoe pakutavast kõige odavamast tavapärasest kättetoimetamise viisist erineva kättetoimetamise viisi, ei ole Veebipood kohustatud ülemäärast kättetoimetamise kulu tagastama.",
          "Veebipoel on õigus müügitehingust taganeda ja nõuda kauba tagastamist, kui hind oli eksimuse tõttu oluliselt alla turuväärtuse.",
        ],
      },
      {
        id: "complaints",
        title: "Kaebuste esitamise õigus",
        paragraphs: [
          "Veebipood vastutab toote mis tahes mittevastavuse või defekti eest, mis oli olemas kauba üleandmise ajal ning ilmneb kahe aasta jooksul alates kauba üleandmisest. Esimese aasta jooksul eeldatakse, et defekt oli olemas kauba üleandmise ajal, kui veebipood ei tõenda vastupidist.",
          `Ostja peab veebipoodi defektist teatama kahe kuu jooksul alates selle avastamisest, saates e-kirja aadressile ${contactEmail}.`,
          "Veebipood ei vastuta puuduste eest, mis ilmnevad pärast toote üleandmist ostjale.",
          "Kui veebipoest ostetud tootel on defekt, mille eest veebipood vastutab, parandab või asendab veebipood defektse toote. Kui toodet ei ole võimalik parandada ega asendada, tagastab veebipood ostjale kõik müügilepinguga seotud tasud.",
          "Veebipood vastab tarbijate kaebustele kirjalikult või kirjalikku taasesitamist võimaldavas vormis 15 päeva jooksul.",
        ],
      },
      {
        id: "marketing",
        title: "Otseturundus ja isikuandmete töötlemine",
        paragraphs: [
          "Veebipood kasutab ostja sisestatud isikuandmeid ainult tellimuse töötlemiseks ja kauba kohaletoimetamiseks. Veebipood edastab isikuandmeid transporditeenuse pakkujatele ainult ulatuses, mis on vajalik kauba kohaletoimetamiseks.",
          "Veebipood saadab ostjale uudiskirju ja pakkumisi tema e-posti aadressile ainult juhul, kui ostja on selleks selgesõnalise nõusoleku andnud, sisestades veebilehel oma e-posti aadressi ja andes nõusoleku otseturunduse saamiseks.",
          "Ostja saab uudiskirjadest ja reklaammeilidest igal ajal loobuda, teavitades sellest veebipoodi e-posti teel või järgides igas reklaammeilis sisalduvaid juhiseid.",
        ],
      },
      {
        id: "disputes",
        title: "Vaidluste lahendamine",
        paragraphs: [
          `Kui ostjal on veebipoe kohta kaebusi, tuleks need saata aadressile ${contactEmail}.`,
          "Kui ostja ja Veebipood ei suuda vaidlust kokkuleppe teel lahendada, on ostjal võimalik pöörduda Tarbijavaidluste komisjoni poole.",
          [
            "Menetluse ja kaebuse esitamise kohta saate lugeda ",
            { type: "link", label: hereLabel, href: consumerDisputesHref, external: true },
            ". Tarbijavaidluste komisjonil on õigus lahendada ostja ja Veebipoe vahel sõlmitud lepingutest tulenevaid vaidlusi. Kaebuse läbivaatamine komisjonis on tasuta.",
          ],
          [
            "Ostja võib pöörduda ka Euroopa Liidu veebipõhise vaidluste lahendamise platvormi poole: ",
            { type: "link", label: odrHref, href: odrHref, external: true },
          ],
        ],
      },
    ];
  }

  return [
    {
      id: "terms-of-sale",
      title: "Terms of Sale",
      paragraphs: [
        `The owner of the online store ${storefrontDomain} (hereinafter referred to as the Web Store) is ${companyName} (registry code ${companyRegistryCode}). Our showroom is located at ${showroomAddress}. Contact: ${SHOWROOM.phone}, ${contactEmail}.`,
      ],
    },
    {
      id: "validity",
      title: "Validity of the Sales Agreement, Product and Price Information",
      paragraphs: [
        "The terms of sale apply when purchasing goods from the Web Store.",
        "The prices of the products sold in the Web Store are indicated next to the products. A delivery fee will be added to the price. All prices are in euros.",
        "The delivery fee depends on the buyer's location and the selected delivery method. The delivery fee is shown to the buyer during the checkout process.",
        "Product information is provided next to the product in the Web Store.",
      ],
    },
    {
      id: "placing-order",
      title: "Placing an Order",
      paragraphs: [
        "To order a product, the desired items must be added to the shopping cart. To finalize the order, the required fields must be filled in and a suitable delivery method selected. Then, the total fee will be displayed, which can be paid securely using the following payment methods:",
      ],
      bullets: [...PAYMENT_METHODS_CHECKOUT.en],
    },
    {
      id: "payment",
      title: "Payment processing",
      paragraphs: [
        [
          "Detailed payment method options are available on the payment service provider Montonio Finance UAB's website: ",
          {
            type: "link",
            label: "https://montonio.com/et/maksed/",
            href: "https://montonio.com/et/maksed/",
            external: true,
          },
        ],
        "NB! When paying via bank link, be sure to click the \"Return to merchant\" button after completing the payment on the bank's page.",
        "Payments are processed by Montonio Finance UAB. Payments are made outside the Web Store in a secure environment — in the bank's secure environment when using a bank link and in Montonio's secure environment when using a credit card. The seller does not have access to the customer's bank or credit card data. The agreement becomes effective upon the receipt of the payable amount to the Web Store's bank account.",
        "The Web Store owner is the controller of personal data and forwards the necessary personal data to the authorized processor Maksekeskus AS for payment processing.",
        "If it is not possible to deliver the ordered product due to it being out of stock or for any other reason, the buyer will be informed as soon as possible and the paid amount (including delivery fees) will be refunded immediately, but no later than within 14 days of sending the notice.",
      ],
    },
    {
      id: "delivery",
      title: "Delivery",
      paragraphs: [
        "Products are shipped to all European Union member states.",
        "At checkout, the buyer can choose from the following delivery options (depending on destination and order):",
      ],
      bullets: termsDeliveryBullets("en"),
    },
    {
      id: "delivery-times",
      title: "Delivery times and costs",
      paragraphs: [
        "The shipping cost is covered by the buyer and displayed at checkout next to the delivery method.",
        DELIVERY_TIMES.estonia.en,
        DELIVERY_TIMES.finland.en,
        DELIVERY_TIMES.eu.en,
        `Orders are typically processed within ${ORDER_PROCESSING_DAYS.en} before dispatch.`,
        INTERNATIONAL_CARRIERS_NOTE.en,
        "In exceptional cases, the Web Store has the right to deliver the product within up to 45 calendar days.",
        "If the Web Store has informed the buyer of delivery problems or a delay exceeding 30 calendar days on the website or order confirmation, the Web Store's stated timeframe applies.",
      ],
    },
    {
      id: "withdrawal",
      title: "Right of Withdrawal",
      paragraphs: [
        "After receiving the order, the buyer has the right to withdraw from the contract concluded via the Web Store within 14 days.",
        "The right of withdrawal does not apply if the buyer is a legal entity.",
        "To use the 14-day return right, the product may only be used in a way necessary to inspect the nature, features, and functioning of the item — as would be allowed in a physical store.",
        "If the product has been used for purposes other than what is necessary to determine its nature, features, or functioning, or shows signs of use or wear, the Web Store has the right to reduce the refundable amount according to the diminished value of the item.",
          [
            "To return a product, submit a withdrawal request using the ",
            { type: "link", label: hereLabel, href: returnsHref },
            " form on our website or send your request to ",
            contactEmail,
            " no later than 14 days after receiving the item.",
          ],
        "The cost of returning the goods is borne by the buyer, except if the reason for the return is that the delivered item does not match the order (e.g., wrong or defective product).",
        "The buyer must return the product within 14 days of submitting the withdrawal request or provide proof that the item has been handed over to the courier within this period.",
        "Upon receiving the returned item, the Web Store will refund all fees received from the buyer under the contract without delay, but no later than 14 days from receiving the withdrawal notice.",
        "The Web Store may withhold the refund until the product has been returned or the buyer has provided proof of return, whichever occurs first.",
        "If the buyer has expressly chosen a delivery method that differs from the cheapest standard delivery option offered by the Web Store, the Web Store is not obligated to refund the excess delivery cost.",
        "The Web Store has the right to withdraw from the sales transaction and demand the return of the item if the price was significantly below the market value due to an error.",
      ],
    },
    {
      id: "complaints",
      title: "Right to Submit Complaints",
      paragraphs: [
        "The Web Store is responsible for any non-conformity or defect in the product that existed at the time of delivery and becomes apparent within two years of delivery. Within the first year, it is assumed that the defect existed at the time of delivery unless proven otherwise by the Web Store.",
        `The buyer must notify the Web Store of any defect within two months of its discovery by sending an email to ${contactEmail}.`,
        "The Web Store is not liable for defects that occur after the product has been delivered to the buyer.",
        "If the product bought from the Web Store has a defect for which the Web Store is responsible, the Web Store will repair or replace the defective item. If the product cannot be repaired or replaced, the Web Store will refund the buyer all fees related to the sales contract.",
        "The Web Store will respond to consumer complaints in writing or in a format that can be reproduced in writing within 15 days.",
      ],
    },
    {
      id: "marketing",
      title: "Direct Marketing and Processing of Personal Data",
      paragraphs: [
        "The Web Store uses the personal data entered by the buyer only for processing the order and delivering the goods. The Web Store transmits personal data to transport service providers only to the extent necessary for delivery.",
        "The Web Store sends newsletters and offers to the buyer's email address only if the buyer has explicitly agreed by entering their email on the website and consenting to receive direct marketing.",
        "The buyer can unsubscribe from newsletters and promotional emails at any time by notifying the Web Store via email or by following the instructions included in each promotional email.",
      ],
    },
    {
      id: "disputes",
      title: "Dispute Resolution",
      paragraphs: [
        `If the buyer has any complaints regarding the Web Store, they should be sent to ${contactEmail}.`,
        "If the buyer and the Web Store cannot resolve the dispute by agreement, the buyer may contact the Consumer Disputes Committee.",
        [
          "You can read about the procedure and submit a complaint ",
          { type: "link", label: hereLabel, href: consumerDisputesHref, external: true },
          ". The Consumer Disputes Committee has the authority to resolve disputes arising from contracts concluded between a buyer and the Web Store. The review of a complaint by the committee is free of charge.",
        ],
        [
          "The buyer may also contact the European Union's online dispute resolution platform: ",
          { type: "link", label: odrHref, href: odrHref, external: true },
        ],
      ],
    },
  ];
}

function buildShippingSections(locale: Locale): readonly LegalSection[] {
  const isEt = locale === "et";
  const parcelLockers = PARCEL_LOCKERS[locale];

  return [
    {
      id: "overview",
      title: isEt ? "Tarneinfo" : "Delivery Information",
      paragraphs: [
        isEt
          ? `Me tarnime kõikidesse Euroopa Liidu liikmesriikidesse. Tellimused töödeldakse tavaliselt ${ORDER_PROCESSING_DAYS.et}.`
          : `We deliver to all European Union member states. Orders are typically processed within ${ORDER_PROCESSING_DAYS.en}.`,
      ],
    },
    {
      id: "methods",
      title: isEt ? "Tarneviisid" : "Delivery Methods",
      paragraphs: [isEt ? "Enamiku toodete puhul checkoutis:" : "For most products at checkout:"],
      bullets: parcelLockers,
    },
    {
      id: "courier",
      title: isEt ? "Kullertarne" : "Courier delivery",
      paragraphs: [COURIER_DELIVERY[locale]],
    },
    {
      id: "pickup",
      title: isEt ? "Salongist kättesaamine" : "Showroom pickup",
      paragraphs: [showroomPickupLabel(locale)],
    },
    {
      id: "motorcycle-delivery",
      title: isEt ? "Mootorratastele" : "For Motorcycles",
      paragraphs: [
        isEt
          ? "Transport kokkuleppel — võtke meiega ühendust mootorrataste kohandatud tarnekorralduse saamiseks. Tarnekulud lepitakse eraldi kokku."
          : "Transport by Agreement – Contact us for custom delivery arrangements for motorcycles. Delivery cost will be agreed upon separately.",
      ],
    },
    {
      id: "times",
      title: isEt ? "Tarneajad" : "Delivery Times",
      paragraphs: [],
      bullets: [
        DELIVERY_TIMES.estonia[locale],
        DELIVERY_TIMES.finland[locale],
        DELIVERY_TIMES.eu[locale],
      ],
    },
    {
      id: "costs",
      title: isEt ? "Veokulud" : "Shipping Costs",
      paragraphs: [shippingCostsCheckoutText(locale)],
    },
    {
      id: "tracking",
      title: isEt ? "Tellimuse jälgimine" : "Order Tracking",
      paragraphs: [
        isEt
          ? "Kui teie tellimus on lähetatud, saate jälgimisnumbri e-posti teel, et jälgida oma tarne staatust."
          : "Once your order is dispatched, you will receive a tracking number via email to monitor your delivery status.",
      ],
    },
    {
      id: "international",
      title: isEt ? "Rahvusvaheline tarne" : "International Shipping",
      paragraphs: [
        isEt
          ? "Me tarnime kõikidesse ELi liikmesriikidesse. Väljaspool ELi toimingute puhul võtke meiega ühendust, et leppida kokku tolli- ja veokorraldus."
          : "We ship to all EU member states. For deliveries outside the EU, please contact us for custom and shipping arrangements.",
        INTERNATIONAL_CARRIERS_NOTE[locale],
      ],
    },
    {
      id: "contact",
      title: isEt ? "Võtke meiega ühendust" : "Contact Us",
      paragraphs: [
        isEt
          ? [
              "Kui teil on küsimusi saatmise kohta, võtke meiega ühendust aadressil ",
              externalLink(`mailto:${POLICY_EMAILS.shop}`, POLICY_EMAILS.shop),
              " või helistage ",
              POLICY_PHONE,
              ".",
            ]
          : [
              "If you have any questions about shipping, please contact us at ",
              externalLink(`mailto:${POLICY_EMAILS.shop}`, POLICY_EMAILS.shop),
              " or call ",
              POLICY_PHONE,
              ".",
            ],
      ],
    },
  ];
}

export function getPrivacySections(locale: Locale): readonly LegalSection[] {
  return buildPrivacySections(locale);
}

export function getTermsSections(locale: Locale): readonly LegalSection[] {
  return buildTermsSections(locale);
}

export function getShippingSections(locale: Locale): readonly LegalSection[] {
  return buildShippingSections(locale);
}

function buildReturnsSections(locale: Locale): readonly LegalSection[] {
  const returnEmail = contactEmail;

  if (locale === "et") {
    return [
      {
        id: "how-to",
        title: "Taganemisõigus",
        paragraphs: [
          "Teil on õigus käesolevast lepingust taganeda 14 päeva jooksul ilma põhjendusi esitamata.",
          "Taganemisperiood lõpeb 14 päeva pärast seda, kui teie või teie poolt määratud kolmas isik, kes ei ole vedaja, on ostetud kaubad füüsiliselt enda valdusesse võtnud.",
          [
            "Taganemisõiguse kasutamiseks täitke allpool olev taganemisvorm või teavitage meid aadressil ",
            externalLink(`mailto:${returnEmail}`, returnEmail),
            ". Taganemisavalduse saate esitada kogu 14-päevase taganemistähtaja jooksul.",
          ],
          "Taganemisõiguse kasutamise tähtajast kinnipidamiseks piisab, kui teade taganemisõiguse kasutamise kohta saadetakse enne taganemisperioodi lõppu.",
        ],
      },
      {
        id: "consequences",
        title: "Tagasivõtmise tagajärjed",
        paragraphs: [
          "Kui te taganete käesolevast lepingust, tagastame teile kõik teie poolt saadud maksed, sealhulgas tarnekulud (välja arvatud lisatasud, mis tulenevad teie valitud tarneviisist, mis ei ole meie poolt pakutav kõige odavam standardne tarneviis), kohe, kuid mitte hiljem kui 14 päeva pärast seda päeva, mil me saime teada teie otsusest lepingust taganeda. Me tagastame raha, kasutades sama makseviisi, mida kasutasite makse tegemiseks, välja arvatud juhul, kui olete selgesõnaliselt nõustunud teistsuguse makseviisi kasutamisega; igal juhul ei võeta teile sellise tagastamise eest teenustasu ega muid tasusid.",
          "Me võime keelduda tagastamisest, kuni oleme saanud lepingu eseme kätte või kuni te olete esitanud tõendid selle kohta, et olete eseme tagastanud, olenevalt sellest, kumb neist on varasem.",
          "Te tagastate või annate kauba meile tagasi ilma põhjendamatu viivituseta, kuid mitte hiljem kui 14 päeva pärast seda päeva, mil te teatate meile oma lepingust taganemisest. Tähtaeg loetakse järgituks, kui te tagastate lepinguga hõlmatud kauba enne 14-päevase tähtaja lõppu.",
          "Eseme tagastamisega seotud otsesed kulud peate kandma teie.",
        ],
      },
    ];
  }

  return [
    {
      id: "how-to",
      title: "Right of withdrawal",
      paragraphs: [
        "You have the right to withdraw from this contract within 14 days without giving any reason.",
        "The withdrawal period expires 14 days after the day on which you or a third party other than the carrier and appointed by you have taken physical possession of the purchased goods.",
        [
          "To exercise your right of withdrawal, complete the withdrawal form below or notify us at ",
          externalLink(`mailto:${returnEmail}`, returnEmail),
          ". You may submit a withdrawal request at any time during the 14-day withdrawal period.",
        ],
        "In order to respect the deadline for exercising the right of withdrawal, it is sufficient to send the notice of exercise of the right of withdrawal before the end of the withdrawal period.",
      ],
    },
    {
      id: "consequences",
      title: "Consequences of withdrawal",
      paragraphs: [
        "If you withdraw from this contract, we will refund to you all payments we have received from you, including delivery charges (excluding any additional charges resulting from your choice of delivery method other than the least expensive standard delivery method offered by us), immediately but no later than 14 days after the day on which we learn of your decision to withdraw from this contract. We will make these refunds using the same payment method that you used to make the payment, unless you have expressly agreed to a different payment method; in any event, there will be no service charge or other charge to you for such refund.",
        "We may refuse to make refunds until we have received the item to which the contract relates or until you have provided evidence that you have returned the item, whichever is the earlier.",
        "You will return or surrender the goods to us without undue delay, but no later than 14 days after the day on which you notify us of your withdrawal from the contract. The time limit will be deemed to have been observed if you return the goods covered by the contract before the end of the 14-day period.",
        "The direct costs of returning the item must be borne by you.",
      ],
    },
  ];
}

function buildSupportSections(locale: Locale): readonly LegalSection[] {
  const isEt = locale === "et";
  const returnsHref = localizedHref(locale, "/returns");

  if (isEt) {
    return [
      {
        id: "reach-us",
        title: "Kuidas meieni jõuda",
        paragraphs: [
          `Kiireim viis on e-post aadressil ${POLICY_EMAILS.support} või poe küsimustes ${POLICY_EMAILS.shop}. Kiireloomuliste salongiküsimuste puhul lahtiolekuajal helista ${SHOWROOM.phone}.`,
          `Külasta meid aadressil ${getShowroomCopy("et").name}, ${SHOWROOM.addressLine}, ${SHOWROOM.city}. Lahtiolekuajad: ${getShowroomCopy("et").hours.weekdays}, ${getShowroomCopy("et").hours.saturday}, ${getShowroomCopy("et").hours.sunday}.`,
        ],
      },
      {
        id: "response",
        title: "Vastamise ajad",
        paragraphs: [
          "Püüame e-kirjadele vastata ühe tööpäeva jooksul. Tellimuse ja makseprobleemid on tööpäevadel prioriteetsed.",
          "Muul ajal helista ette ja leiame sobiva aja.",
        ],
      },
      {
        id: "orders",
        title: "Tellimused ja maksed",
        paragraphs: [],
        bullets: [
          "Tellimuse kinnitus saadetakse pärast checkouti e-postiga",
          "Checkoutis on saadaval pangalingid, kaardimaksed, Montonio BNPL ja järelmaks (sõltuvalt riigist ja tellimusest)",
          "Kui makse ebaõnnestub, mine tagasi ostukorvi ja proovi uuesti või vali teine checkoutis nähtav makseviis",
          "Pärast pangalingi makset klõpsa panga lehel „Tagasi kaupmehe juurde“",
          "Montonio või makseprobleemide puhul lisa ühendust võttes tellimuse number",
        ],
      },
      {
        id: "delivery",
        title: "Tarne ja jälgimine",
        paragraphs: [
          `Tarnevõimalused (SmartPosti, Omniva, DPD, kuller, salongist kättesaamine) ja hinnad kuvatakse checkoutis. Tellimusi töödeldakse tavaliselt ${ORDER_PROCESSING_DAYS.et}.`,
          "Kui tellimus väljastatakse, peaksid saama jälgimisnumbri e-postiga, kui vedaja seda pakub.",
          `Hilinenud või kahjustatud pakk: kirjuta ${POLICY_EMAILS.shop}, lisa tellimuse number.`,
        ],
      },
      {
        id: "returns",
        title: "Tagastused ja suurused",
        paragraphs: [
          [
            "Sul on 14-päevane taganemisõigus. Teavita meid aadressil ",
            externalLink(`mailto:${POLICY_EMAILS.returns}`, POLICY_EMAILS.returns),
            ". Tagastuse otsesed kulud kannab ostja, välja arvatud vale või defektse toote puhul. Täpsemad sammud: ",
            { type: "link", label: "tagastustingimused", href: returnsHref },
            ".",
          ],
          "Ebakindel suurus? Võta enne tellimist ühendust — aitame brändi suurustabelite põhjal.",
        ],
      },
      {
        id: "motorcycles",
        title: "Mootorrattad ja proovisõidud",
        paragraphs: [
          "Mootorratta ost, registreerimine ja transport lepitakse kokku individuaalselt. Broneeri proovisõit veebist või võta ühendust salongi külastuse planeerimiseks.",
        ],
      },
      {
        id: "policies",
        title: "Poliitikad ja dokumendid",
        paragraphs: ["Täielikud tingimused ja poliitikad:"],
      },
    ];
  }

  return [
    {
      id: "reach-us",
      title: "How to reach us",
      paragraphs: [
        `The fastest way is email at ${POLICY_EMAILS.support} or ${POLICY_EMAILS.shop} for order questions. For urgent showroom matters during opening hours, call ${SHOWROOM.phone}.`,
        `Visit us at ${SHOWROOM.name}, ${SHOWROOM.addressLine}, ${SHOWROOM.city}. Hours: ${SHOWROOM.hours.weekdays}, ${SHOWROOM.hours.saturday}, ${SHOWROOM.hours.sunday}.`,
      ],
    },
    {
      id: "response",
      title: "Response times",
      paragraphs: [
        "We aim to reply to emails within one business day. Order and payment issues are prioritised on weekdays.",
        SHOWROOM.phoneNote,
      ],
    },
    {
      id: "orders",
      title: "Orders & payments",
      paragraphs: [],
      bullets: [
        "Order confirmation is sent by email after checkout",
        "Checkout offers bank links, card payments, Montonio BNPL and hire purchase (depending on country and order)",
        "If payment fails, return to the cart and try again or choose another method shown at checkout",
        "After paying via bank link, click \"Return to merchant\" on your bank's page",
        "For Montonio or payment issues, include your order number when you contact us",
      ],
    },
    {
      id: "delivery",
      title: "Delivery & tracking",
      paragraphs: [
        `Delivery options (SmartPosti, Omniva, DPD, courier, showroom pickup) and costs are shown at checkout. Orders are typically processed within ${ORDER_PROCESSING_DAYS.en}.`,
        "When your order ships, you should receive tracking details by email where the carrier provides them.",
        `Delayed or damaged parcels: email ${POLICY_EMAILS.shop} with your order number.`,
      ],
    },
    {
      id: "returns",
      title: "Returns & sizing",
      paragraphs: [
        [
          "You have a 14-day right of withdrawal. Notify us at ",
          externalLink(`mailto:${POLICY_EMAILS.returns}`, POLICY_EMAILS.returns),
          ". Direct return costs are borne by the buyer, except for wrong or defective items. Full steps: ",
          { type: "link", label: "returns policy", href: returnsHref },
          ".",
        ],
        "Unsure about size? Contact us before ordering — we are happy to advise based on brand fit guides.",
      ],
    },
    {
      id: "motorcycles",
      title: "Motorcycles & test rides",
      paragraphs: [
        "Motorcycle purchases, registration, and transport are arranged individually. Book a test ride through the website or contact us to plan a showroom visit.",
      ],
    },
    {
      id: "policies",
      title: "Policies & documents",
      paragraphs: ["You can read our full policies here:"],
    },
  ];
}

export function getReturnsSections(locale: Locale): readonly LegalSection[] {
  return buildReturnsSections(locale);
}

export function getCookieSections(locale: Locale): readonly LegalSection[] {
  return buildCookieSections(locale);
}

export function getSupportSections(locale: Locale): readonly LegalSection[] {
  return buildSupportSections(locale);
}
