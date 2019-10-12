import axios from "axios";

export interface Language {
    readonly shortCode: string;
    readonly translationCode: string;
}

export interface License {
    readonly key: string;
    readonly label: string;
}

export interface EditMetadata {
    readonly languages: Language[];
    readonly licenses: License[];
}

export interface Attachment {
    readonly type: string;
    readonly url: string;
}

export interface JobResult {
    readonly title: string;
    readonly status: string;
}

export interface MediaPackage {
    readonly attachments: Attachment[];
}

export interface SearchEpisodeResult {
    readonly dcCreator: string;
    readonly id: string;
    readonly dcTitle: string;
    readonly dcCreated: string;
    readonly mediapackage: MediaPackage;
    readonly languageShortCode: string;
    readonly licenseKey: string;
}

export interface SearchEpisodeResults {
    readonly results: SearchEpisodeResult[];
    readonly total: number;
    readonly limit: number;
    readonly offset: number;
}

export interface LtiData {
    readonly roles: string[];
}

const debug = window.location.search.indexOf("&debug=true") !== -1;

function hostAndPort() {
    return debug ? "http://localhost:7878" : "";
}

export async function searchEpisode(
    limit: number,
    offset: number,
    episodeId?: string,
    seriesId?: string,
    seriesName?: string): Promise<SearchEpisodeResults> {
    let urlSuffix = "";
    if (seriesId !== undefined)
        urlSuffix += "&sid=" + seriesId;
    if (seriesName !== undefined)
        urlSuffix += "&sname=" + seriesName;
    if (episodeId !== undefined)
        urlSuffix += "&id=" + episodeId;
    const response = await axios.get(hostAndPort() + "/search/episode.json?limit=" + limit + "&offset=" + offset + urlSuffix);
    const resultsRaw = response.data["search-results"]["result"];
    const results = Array.isArray(resultsRaw) ? resultsRaw : resultsRaw !== undefined ? [resultsRaw] : [];
    return {
        results: results.map((result: any) => ({
            dcCreator: result.dcCreator,
            id: result.id,
            dcTitle: result.dcTitle,
            dcCreated: result.dcCreated,
            languageShortCode: result.dcLanguage,
            licenseKey: result.dcLicense,
            mediapackage: {
                creators: result.mediapackage.creators !== undefined ? result.mediapackage.creators.creator : [],
                attachments: result.mediapackage.attachments.attachment.map((attachment: any) => ({
                    type: attachment.type,
                    url: attachment.url
                }))
            }
        })),
        total: response.data["search-results"].total,
        limit: response.data["search-results"].limit,
        offset: response.data["search-results"].offset
    }
}

export function deleteEpisode(episodeId: string): Promise<void> {
    return axios.delete(hostAndPort() + "/lti-service-gui/" + episodeId);
}

export async function getLti(): Promise<LtiData> {
    const response = await axios.get(hostAndPort() + "/lti");
    return {
        roles: response.data.roles !== undefined ? response.data.roles.split(",") : [],
    }
}

export async function getEditMetadata(): Promise<EditMetadata> {
    const response = await axios.get(hostAndPort() + "/lti-service-gui/editMetadata");
    return response.data;
}

export async function getJobs(seriesId?: string, seriesName?: string): Promise<JobResult[]> {
    const urlSuffix = seriesId ? "series=" + seriesId : seriesName ? "series_name=" + seriesName : "";
    const response = await axios.get(hostAndPort() + "/lti-service-gui/jobs?" + urlSuffix);
    return response.data.map((response: any) => ({ title: response.title, status: response.status }));
}

export async function uploadFile(
    file: Blob,
    title: string,
    presenters: string[],
    captions?: Blob,
    license?: string,
    language?: string,
    seriesId?: string,
    seriesName?: string): Promise<{}> {
    const data = new FormData();
    data.append("seriesName", seriesName === undefined ? "" : seriesName);
    data.append("isPartOf", seriesId === undefined ? "" : seriesId);
    data.append("title", title);
    if (license !== undefined)
        data.append("license", license);
    if (language !== undefined)
        data.append("language", language);
    for (var i = 0; i < presenters.length; i++)
        data.append("presenterNames[]", presenters[i]);
    if (captions !== undefined)
        data.append("captions", captions);
    data.append("presenter", file);
    return axios.post(hostAndPort() + "/lti-service-gui", data);
}
