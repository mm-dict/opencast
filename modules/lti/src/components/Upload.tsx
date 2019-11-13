import { Loading } from "./Loading";
import Helmet from "react-helmet";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import {
    uploadFile,
    getEventMetadata,
    EventMetadataContainer
} from "../OpencastRest";
import { parsedQueryString } from "../utils";
import { EditForm } from "./EditForm";
import { JobList } from "./JobList";

interface UploadState {
    readonly uploadState: "success" | "error" | "pending" | "none";
    readonly initialMetadata?: EventMetadataContainer;
    readonly editMetadata?: EventMetadataContainer;
    readonly presenterFile?: Blob;
    readonly captionFile?: Blob;
}

interface UploadProps extends WithTranslation {
}

class TranslatedUpload extends React.Component<UploadProps, UploadState> {
    constructor(props: UploadProps) {
        super(props);
        this.state = {
            uploadState: "none",
        };
    }

    episodeId(): string | undefined {
        const qs = parsedQueryString();
        return typeof qs.episode_id === "string" ? qs.episode_id : undefined;
    }

    componentDidMount() {
        getEventMetadata(this.episodeId()).then((metadataCollection) => {
            if (metadataCollection.length > 0) {
                const metadata = metadataCollection[0];
                this.setState({
                    ...this.state,
                    initialMetadata: metadata,
                    editMetadata: metadata,
                });
            }
        });
    }

    onSubmit() {
        if (this.state.editMetadata === undefined)
            return;
        if (this.episodeId() === undefined && this.state.presenterFile === undefined)
            return;
        const qs = parsedQueryString();
        this.setState({
            ...this.state,
            uploadState: "pending"
        });
        uploadFile(
            this.state.editMetadata,
            this.episodeId(),
            this.state.presenterFile,
            this.state.captionFile,
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
                    editMetadata: this.state.initialMetadata,
                });
            }
        }).catch((_) => {
            this.setState({
                ...this.state,
                uploadState: "error"
            });
        });
    }

    onCaptionFileChange(newFile: Blob) {
        this.setState({
            ...this.state,
            captionFile: newFile
        });
    }

    onPresenterFileChange(newFile: Blob) {
        this.setState({
            ...this.state,
            presenterFile: newFile
        });
    }

    onDataChange(newData: EventMetadataContainer) {
        this.setState({
            ...this.state,
            editMetadata: newData
        });
    }

    render() {
        if (this.state.editMetadata === undefined)
            return <Loading />;
        const qs = parsedQueryString();
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
                data={this.state.editMetadata}
                onDataChange={this.onDataChange.bind(this)}
                onPresenterFileChange={this.onPresenterFileChange.bind(this)}
                onCaptionFileChange={this.onCaptionFileChange.bind(this)}
                onSubmit={this.onSubmit.bind(this)}
                pending={this.state.uploadState === "pending"} />
            <h2>{this.props.t("CURRENT_JOBS")}</h2>
            <JobList
                seriesId={typeof qs.series === "string" ? qs.series : undefined}
                seriesName={typeof qs.seriesName === "string" ? qs.seriesName : undefined} />
        </>;
    }
}

export const Upload = withTranslation()(TranslatedUpload);
