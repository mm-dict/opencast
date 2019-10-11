import { Loading } from "./Loading";
import Helmet from "react-helmet";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { getJobs, JobResult, uploadFile, getEditMetadata, EditMetadata } from "../OpencastRest";
import { parsedQueryString } from "../utils";
import Select from "react-select";
import { ActionMeta, ValueType } from "react-select/src/types"; // tslint:disable-line no-submodule-imports

import CreatableSelect from "react-select/creatable";

export interface OptionType {
    value: string;
    label: string;
}


interface UploadState {
    readonly jobs: JobResult[] | string;
    readonly selectedFile?: Blob;
    readonly uploadState: "success" | "error" | "pending" | "none";
    readonly title: string;
    readonly jobsTimerId?: ReturnType<typeof setTimeout>;
    readonly editMetadata?: EditMetadata;
    readonly license?: string;
    readonly language?: string;
    readonly presenters: string[];
}

interface UploadProps extends WithTranslation {
}


class TranslatedUpload extends React.Component<UploadProps, UploadState> {
    constructor(props: UploadProps) {
        super(props);
        this.state = {
            jobs: [],
            uploadState: "none",
            title: "",
            presenters: []
        };
    }

    languageOptions() {
        if (this.state.editMetadata === undefined) {
            return [];
        }
        return this.state.editMetadata.languages.map((l) => ({ value: l.shortCode, label: l.translationCode }));
    }

    licenseOptions() {
        if (this.state.editMetadata === undefined) {
            return [];
        }
        return this.state.editMetadata.licenses.map((l) => ({ value: l.key, label: l.label }));
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
            editMetadata: metadata
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

    onChangeFile(e: any) {
        this.setState({
            ...this.state,
            selectedFile: e.target.files[0]
        });
    }

    onChangeLicense(value: ValueType<OptionType>, _: ActionMeta) {
        this.setState({
            ...this.state,
            license: value === undefined || value === null || Array.isArray(value) ? undefined : (value as OptionType).value
        });
    }

    onChangeLanguage(value: ValueType<OptionType>, _: ActionMeta) {
        this.setState({
            ...this.state,
            language: value === undefined || value === null || Array.isArray(value) ? undefined : (value as OptionType).value
        });
    }

    onChangePresenter(value: ValueType<OptionType>, _: ActionMeta) {
        if (value === null || value === undefined || !Array.isArray(value))
            return;
        const newPresenters = value.map((v) => v.value);
        this.setState({
            ...this.state,
            presenters: newPresenters,
        });
    }

    onSubmit(_: any) {
        if (this.state.selectedFile === undefined)
            return;
        const qs = parsedQueryString();
        this.setState({
            ...this.state,
            uploadState: "pending"
        });
        uploadFile(
            this.state.selectedFile,
            this.state.title,
            this.state.presenters,
            this.state.license,
            this.state.language,
            typeof qs.series === "string" ? qs.series : undefined,
            typeof qs.seriesName === "string" ? qs.seriesName : undefined
        ).then((_) => {
            this.setState({
                ...this.state,
                selectedFile: undefined,
                uploadState: "success",
                title: "",
                license: undefined,
                language: undefined,
                presenters: []
            });
        }).catch((_) => {
            this.setState({
                ...this.state,
                uploadState: "error"
            });
        });
    }

    render() {
        if (this.state.editMetadata === undefined)
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
            <form>
                <div className="form-group">
                    <label htmlFor="title">{this.props.t("TITLE")}</label>
                    <input type="text" className="form-control" value={this.state.title} onChange={(e) => this.setState({ ...this.state, title: e.target.value })} />
                    <small className="form-text text-muted">{this.props.t("TITLE_DESCRIPTION")}</small>
                </div>
                <div className="form-group">
                    <label htmlFor="presenter">{this.props.t("PRESENTER")}</label>
                    <input type="file" className="form-control-file" onChange={this.onChangeFile.bind(this)} />
                    <small className="form-text text-muted">{this.props.t("PRESENTER_DESCRIPTION")}</small>
                </div>
                <div className="form-group">
                    <label htmlFor="license">{this.props.t("LICENSE")}</label>
                    <Select
                        id="license"
                        onChange={this.onChangeLicense.bind(this)}
                        options={this.licenseOptions()}
                        placeholder={this.props.t("SELECT_LICENSE")} />
                </div>

                <div className="form-group">
                    <label htmlFor="language">{this.props.t("LANGUAGE")}</label>
                    <Select
                        id="language"
                        onChange={this.onChangeLanguage.bind(this)}
                        options={this.languageOptions()}
                        placeholder={this.props.t("SELECT_LANGUAGE")} />
                </div>

                <div className="form-group">
                    <label htmlFor="presenters">{this.props.t("PRESENTERS")}</label>
                    <CreatableSelect
                        isMulti={true}
                        isClearable={true}
                        id="presenters"
                        value={this.state.presenters.map((e) => ({ value: e, label: e }))}
                        onChange={this.onChangePresenter.bind(this)}
                    />
                </div>

                <button type="button" className="btn btn-primary" onClick={this.onSubmit.bind(this)} disabled={this.state.uploadState === "pending"}>{this.props.t(this.state.uploadState === "pending" ? "UPLOADING" : "UPLOAD")}</button>
            </form>
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
