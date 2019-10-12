import { Loading } from "./Loading";
import Helmet from "react-helmet";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { getJobs, JobResult, uploadFile, getEditMetadata, EditMetadata } from "../OpencastRest";
import { parsedQueryString } from "../utils";
import { EditForm, EditFormData } from "./EditForm";

interface UploadState {
    readonly jobs: JobResult[] | string;
    readonly uploadState: "success" | "error" | "pending" | "none";
    readonly jobsTimerId?: ReturnType<typeof setTimeout>;
    readonly editMetadata?: EditMetadata;
    readonly formData?: EditFormData;
}

interface UploadProps extends WithTranslation {
}


class TranslatedUpload extends React.Component<UploadProps, UploadState> {
    constructor(props: UploadProps) {
        super(props);
        this.state = {
            jobs: [],
            uploadState: "none",
        };
    }

    languageOptions() {
        if (this.state.editMetadata === undefined) {
            return [];
        }
        return this.state.editMetadata.languages.map((l) => ({ value: l.shortCode, label: this.props.t(l.translationCode) }));
    }

    licenseOptions() {
        if (this.state.editMetadata === undefined) {
            return [];
        }
        return this.state.editMetadata.licenses.map((l) => ({ value: l.key, label: this.props.t(l.label) }));
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

    componentDidMount() {
        this.retrieveJobs();
        getEditMetadata().then((metadata) => this.setState({
            ...this.state,
            editMetadata: metadata,
            formData: {
                title: "",
                presenters: [],
                licenses: metadata.licenses,
                languages: metadata.languages,
            }
        }));
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
        if (formData.selectedFile === undefined)
            return;
        const qs = parsedQueryString();
        this.setState({
            ...this.state,
            uploadState: "pending"
        });
        uploadFile(
            formData.selectedFile,
            formData.title,
            formData.presenters,
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
                formData: {
                    title: "",
                    presenters: [],
                    licenses: this.state.editMetadata.licenses,
                    languages: this.state.editMetadata.languages,
                }
            });
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
                <title>{this.props.t("UPLOAD_TITLE")}</title>
            </Helmet>
            <h2>{this.props.t("NEW_UPLOAD")}</h2>
            {this.state.uploadState === "success" && <div className="alert alert-success">
                {this.props.t("UPLOAD_SUCCESS")}<br />
            </div>}
            {this.state.uploadState === "error" && <div className="alert alert-danger">
                {this.props.t("UPLOAD_FAILURE")}<br />
                <div className="text-muted">{this.props.t("UPLOAD_FAILURE_DESCRIPTION")}</div>
            </div>}
            <EditForm
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
