import { Loading } from "./Loading";
import Helmet from "react-helmet";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import {
    Language,
    License,
    getJobs,
    JobResult,
    uploadFile,
    getEventMetadata,
    findFieldSingleValue,
    findFieldMultiValue,
    findFieldCollection,
    EventMetadataContainer
} from "../OpencastRest";
import { parsedQueryString } from "../utils";
import { EditForm, EditFormData } from "./EditForm";

interface UploadState {
    readonly jobs: JobResult[] | string;
    readonly uploadState: "success" | "error" | "pending" | "none";
    readonly jobsTimerId?: ReturnType<typeof setTimeout>;
    readonly editMetadata?: EventMetadataContainer;
    readonly formData?: EditFormData;
}

interface UploadProps extends WithTranslation {
}

function languageOptions(metadata: EventMetadataContainer) {
    const languages = findFieldCollection("language", metadata);
    if (languages === undefined) {
        return [];
    }
    const result: Language[] = [];
    Object.keys(languages).forEach((k) => result.push({
        shortCode: languages[k],
        translationCode: k
    }));
    return result;
}

function presenters(metadata: EventMetadataContainer): string[] {
    const collection = findFieldMultiValue("creator", metadata);
    if (collection === undefined) {
        return [];
    }
    return collection;
}

function licenseOptions(metadata: EventMetadataContainer) {
    const licenses = findFieldCollection("license", metadata);
    if (licenses === undefined) {
        return [];
    }
    const result: License[] = [];
    Object.keys(licenses).forEach((k) => result.push({
        key: licenses[k],
        label: JSON.parse(k).label
    }));
    return result;
}


function formDataFromMetadata(metadata: EventMetadataContainer): EditFormData {
    const license = findFieldSingleValue("license", metadata);
    const language = findFieldSingleValue("language", metadata);
    return {
        title: findFieldSingleValue("title", metadata) || "",
        presenters: presenters(metadata),
        licenses: licenseOptions(metadata),
        languages: languageOptions(metadata),
        license: license !== "" ? license : undefined,
        language: language !== "" ? language : undefined,
    };
}

class TranslatedUpload extends React.Component<UploadProps, UploadState> {
    constructor(props: UploadProps) {
        super(props);
        this.state = {
            jobs: [],
            uploadState: "none",
        };
    }

    retrieveJobs() {
        const qs = parsedQueryString();
        getJobs(
            typeof qs.series === "string" ? qs.series : undefined,
            typeof qs.seriesName === "string" ? qs.seriesName : undefined
        ).then((jobs) => this.setState({
            ...this.state,
            jobs: jobs
        })).catch((error) => this.setState({
            ...this.state,
            jobs: error.message
        }));
    }

    jobsTimer() {
        this.retrieveJobs();
    }

    episodeId(): string | undefined {
        const qs = parsedQueryString();
        return typeof qs.episode_id === "string" ? qs.episode_id : undefined;
    }

    componentDidMount() {
        this.retrieveJobs();
        getEventMetadata(this.episodeId()).then((metadataCollection) => {
            if (metadataCollection.length > 0) {
                const metadata = metadataCollection[0];
                this.setState({
                    ...this.state,
                    editMetadata: metadata,
                    formData: formDataFromMetadata(metadata)
                });
            }
        });

        this.setState({
            ...this.state,
            jobsTimerId: setInterval(this.jobsTimer.bind(this), 1000),
        });
    }

    componentWillUnmount() {
        if (this.state.jobsTimerId !== undefined)
            clearInterval(this.state.jobsTimerId);
    }

    onSubmit() {
        if (this.state.formData === undefined)
            return;
        const formData = this.state.formData;
        if (this.episodeId() === undefined && formData.selectedFile === undefined)
            return;
        const qs = parsedQueryString();
        this.setState({
            ...this.state,
            uploadState: "pending"
        });
        uploadFile(
            formData.title,
            formData.presenters,
            formData.selectedFile,
            this.episodeId(),
            formData.selectedCaption,
            formData.license,
            formData.language,
            typeof qs.series === "string" ? qs.series : undefined,
            typeof qs.seriesName === "string" ? qs.seriesName : undefined
        ).then((_) => {
            if (this.state.editMetadata === undefined)
                return;
            this.setState({
                ...this.state,
                uploadState: "success"
            });
            if (this.episodeId() === undefined) {
                this.setState({
                    ...this.state,
                    formData: {
                        title: "",
                        presenters: [],
                        licenses: licenseOptions(this.state.editMetadata),
                        languages: languageOptions(this.state.editMetadata),
                    },
                });
            }
        }).catch((_) => {
            this.setState({
                ...this.state,
                uploadState: "error"
            });
        });
    }

    onDataChange(newData: EditFormData) {
        this.setState({
            ...this.state,
            formData: newData
        });
    }

    render() {
        if (this.state.editMetadata === undefined || this.state.formData === undefined)
            return <Loading />;
        return <>
            <Helmet>
                <title>{this.props.t(this.episodeId() === undefined ? "UPLOAD_TITLE" : "EDIT_TITLE")}</title>
            </Helmet>
            <h2>{this.props.t(this.episodeId() === undefined ? "NEW_UPLOAD" : "EDIT_UPLOAD")}</h2>
            {this.state.uploadState === "success" && <div className="alert alert-success">
                {this.props.t("UPLOAD_SUCCESS")}<br />
            </div>}
            {this.state.uploadState === "error" && <div className="alert alert-danger">
                {this.props.t("UPLOAD_FAILURE")}<br />
                <div className="text-muted">{this.props.t("UPLOAD_FAILURE_DESCRIPTION")}</div>
            </div>}
            <EditForm
                withUpload={this.episodeId() === undefined}
                data={this.state.formData}
                onDataChange={this.onDataChange.bind(this)}
                onSubmit={this.onSubmit.bind(this)} pending={this.state.uploadState === "pending"} />
            <h2>{this.props.t("CURRENT_JOBS")}</h2>
            {typeof this.state.jobs !== "string" &&
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>{this.props.t("TITLE")}</th>
                            <th>{this.props.t("STATUS")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.jobs.map((job) => <tr key={job.title}>
                            <td>{job.title}</td>
                            <td>{this.props.t(job.status)}</td>
                        </tr>)}
                    </tbody>
                </table>
            }
        </>;
    }
}

export const Upload = withTranslation()(TranslatedUpload);
