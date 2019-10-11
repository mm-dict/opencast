import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import deJson from "./i18n/de-DE.json";
import enJson from "./i18n/en-US.json";

console.log(JSON.stringify(enJson));

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        // we init with resources
        resources: {
            en: {
                translations: enJson
            },
            de: {
                translations: deJson
            }
        },
        fallbackLng: "en",
        debug: true,

        // have a common namespace used around the full app
        ns: ["translations"],
        defaultNS: "translations",

        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
