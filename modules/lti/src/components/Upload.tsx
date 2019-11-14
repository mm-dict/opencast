import { ActionMeta, ValueType } from "react-select/src/types"; // tslint:disable-line no-submodule-imports
import Select from "react-select";
import { Loading } from "./Loading";
import Helmet from "react-helmet";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import {
    uploadFile,
    copyEventToSeries,
    getEventMetadata,
    EventMetadataContainer,
    findFieldCollection,
    collectionToPairs
} from "../OpencastRest";
import { parsedQueryString } from "../utils";
import { EditForm } from "./EditForm";
import { JobList } from "./JobList";

interface OptionType {
    value: string;
    label: string;
}

interface UploadState {
    readonly episodeId?: string;
    readonly uploadState: "success" | "error" | "pending" | "none";
    readonly initialMetadata?: EventMetadataContainer;
    readonly editMetadata?: EventMetadataContainer;
    readonly presenterFile?: Blob;
    readonly captionFile?: Blob;
    readonly copyState: "success" | "error" | "pending" | "none";
    readonly copySeries?: OptionType;
}

interface UploadProps extends WithTranslation {
}

class TranslatedUpload extends React.Component<UploadProps, UploadState> {
    constructor(props: UploadProps) {
        super(props);
        const qs = parsedQueryString();
        this.state = {
            episodeId: typeof qs.episode_id === "string" ? qs.episode_id : undefined,
            uploadState: "none",
            copyState: "none",
        };
    }

    componentDidMount() {
        getEventMetadata(this.state.episodeId).then((metadataCollection) => {
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
        if (this.state.episodeId === undefined && this.state.presenterFile === undefined)
            return;
        const qs = parsedQueryString();
        this.setState({
            ...this.state,
            uploadState: "pending"
        });
        uploadFile(
            this.state.editMetadata,
            this.state.episodeId,
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
            if (this.state.episodeId === undefined) {
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

    seriesItems(): OptionType[] {
        if (this.state.editMetadata === undefined)
            return [];
        const seriesCollection = findFieldCollection("isPartOf", this.state.editMetadata);
        if (seriesCollection === undefined)
            return [];
        const pairs = collectionToPairs(seriesCollection);
        return pairs.map(([k, v]) => ({ value: v, label: k }));
    }

    onMoveToSeries(_: any) {
        const episodeId = this.state.episodeId;
        if (episodeId === undefined || this.state.copySeries === undefined)
            return;
        copyEventToSeries(episodeId, this.state.copySeries.value).then((_) => {
            this.setState({
                ...this.state,
                copyState: "success"
            });
        }).catch((_: any) => {
            this.setState({
                ...this.state,
                copyState: "error"
            });
        });
    }

    onChangeCopyTarget(v: OptionType) {
        console.log("new value " + JSON.stringify(v));
        this.setState({
            ...this.state,
            copySeries: v
        });
    }

    render() {
        if (this.state.editMetadata === undefined)
            return <Loading />;
        const qs = parsedQueryString();
        return <>
            <Helmet>
                <title>{this.props.t(this.state.episodeId === undefined ? "UPLOAD_TITLE" : "EDIT_TITLE")}</title>
            </Helmet>
            <h2>{this.props.t(this.state.episodeId === undefined ? "NEW_UPLOAD" : "EDIT_UPLOAD")}</h2>
            {this.state.uploadState === "success" && <div className="alert alert-success">
                {this.props.t("UPLOAD_SUCCESS")}<br />
            </div>}
            {this.state.uploadState === "error" && <div className="alert alert-danger">
                {this.props.t("UPLOAD_FAILURE")}<br />
                <div className="text-muted">{this.props.t("UPLOAD_FAILURE_DESCRIPTION")}</div>
            </div>}
            {this.state.copyState === "success" && <div className="alert alert-success">
                {this.props.t("COPY_SUCCESS")}<br />
                <div className="text-muted">{this.props.t("COPY_SUCCESS_DESCRIPTION")}</div>
            </div>}
            {this.state.copyState === "error" && <div className="alert alert-danger">
                {this.props.t("COPY_FAILURE")}<br />
                <div className="text-muted">{this.props.t("COPY_FAILURE_DESCRIPTION")}</div>
            </div>}
            <EditForm
                withUpload={this.state.episodeId === undefined}
                data={this.state.editMetadata}
                onDataChange={this.onDataChange.bind(this)}
                onPresenterFileChange={this.onPresenterFileChange.bind(this)}
                onCaptionFileChange={this.onCaptionFileChange.bind(this)}
                onSubmit={this.onSubmit.bind(this)}
                pending={this.state.uploadState === "pending"} />
            {this.state.episodeId !== undefined &&
                <>
                    <h2>{this.props.t("COPY_TO_SERIES")}</h2>
                    <form>
                        <div className="form-group">
                            <Select
                                options={this.seriesItems()}
                                isSearchable={true}
                                value={this.state.copySeries}
                                onChange={(value: ValueType<OptionType>, _: ActionMeta) => this.onChangeCopyTarget(value as OptionType)}
                                placeholder={this.props.t("SELECT_COPY_TARGET")} />
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={this.onMoveToSeries.bind(this)}
                            disabled={this.state.copyState === "pending" || this.state.copySeries === undefined}>
                            {this.props.t(this.state.copyState === "pending" ? "COPY_IN_PROGRESS" : "COPY")}
                        </button>
                    </form>
                </>
            }
            <h2>{this.props.t("CURRENT_JOBS")}</h2>
            <JobList
                seriesId={typeof qs.series === "string" ? qs.series : undefined}
                seriesName={typeof qs.seriesName === "string" ? qs.seriesName : undefined} />
        </>;
    }
}

export const Upload = withTranslation()(TranslatedUpload);
