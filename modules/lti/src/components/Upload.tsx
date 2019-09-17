import Helmet from "react-helmet";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { RouteComponentProps } from "react-router";
import { parse as parseQuery } from "query-string";
import { getJobs, JobResult, uploadFile } from "../OpencastRest";

interface UploadState {
    readonly jobs: JobResult[] | string;
    readonly selectedFile?: Blob;
    readonly uploadState: "success" | "error" | "pending" | "none";
    readonly title: string;
    readonly jobsTimerId?: ReturnType<typeof setTimeout>;
}

interface UploadProps extends RouteComponentProps<any>, WithTranslation {
}


class TranslatedUpload extends React.Component<UploadProps, UploadState> {
    constructor(props: UploadProps) {
        super(props);
        this.state = {
            jobs: [],
            uploadState: "none",
            title: ""
        };
    }

    retrieveJobs() {
        const qs = parseQuery(this.props.location.search);
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

    onSubmit(_: any) {
        if (this.state.selectedFile === undefined)
            return;
        const qs = parseQuery(this.props.location.search);
        this.setState({
            ...this.state,
            uploadState: "pending"
        });
        uploadFile(
            this.state.selectedFile,
            this.state.title,
            typeof qs.series === "string" ? qs.series : undefined,
            typeof qs.seriesName === "string" ? qs.seriesName : undefined
        ).then((_) => {
            this.setState({
                ...this.state,
                selectedFile: undefined,
                uploadState: "success",
                title: "",
            });
        }).catch((_) => {
            this.setState({
                ...this.state,
                uploadState: "error"
            });
        });
    }

    render() {
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
