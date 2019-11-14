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

interface MetadataResult {
    readonly initial: EventMetadataContainer;
    readonly edited: EventMetadataContainer;
    readonly seriesId: string;
}

interface UploadState {
    readonly episodeId?: string;
    readonly uploadState: "success" | "error" | "pending" | "none";
    readonly metadata: MetadataResult | "error" | undefined;
    readonly presenterFile?: Blob;
    readonly captionFile?: Blob;
    readonly copyState: "success" | "error" | "pending" | "none";
    readonly copySeries?: OptionType;
}

function isMetadata(
    metadata: MetadataResult | "error" | undefined): metadata is MetadataResult {
    return metadata !== undefined && typeof metadata !== "string";
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
            metadata: undefined,
        };
    }

    resolveSeries(metadata: EventMetadataContainer): string | undefined {
        const qs = parsedQueryString();
        if (typeof qs.series === "string")
            return qs.series;
        if (typeof qs.seriesName !== "string")
            return;
        const seriesCollection = findFieldCollection("isPartOf", metadata);
        if (seriesCollection === undefined)
            return;
        const pairs = collectionToPairs(seriesCollection);
        return pairs
            .filter(([k, _]) => k === qs.seriesName)
            .map(([_, v]) => v)
            .pop();
    }

    componentDidMount() {
        getEventMetadata(this.state.episodeId).then((metadataCollection) => {
            if (metadataCollection.length > 0) {
                const metadata = metadataCollection[0];
                const seriesId = this.resolveSeries(metadata)
                if (seriesId === undefined) {
                    this.setState({
                        ...this.state,
                        metadata: "error"
                    });
                } else {
                    this.setState({
                        ...this.state,
                        metadata: {
                            initial: metadata,
                            edited: metadata,
                            seriesId: seriesId
                        },
                    });
                }
            }
        }).catch((_) => this.setState({
            ...this.state,
            metadata: "error"
        }));
    }

    onSubmit() {
        if (!isMetadata(this.state.metadata))
            return;
        if (this.state.episodeId === undefined && this.state.presenterFile === undefined)
            return;
        this.setState({
            ...this.state,
            uploadState: "pending"
        });
        uploadFile(
            this.state.metadata.edited,
            this.state.metadata.seriesId,
            this.state.episodeId,
            this.state.presenterFile,
            this.state.captionFile,
        ).then((_) => {
            if (!isMetadata(this.state.metadata))
                return;
            this.setState({
                ...this.state,
                uploadState: "success"
            });
            if (this.state.episodeId === undefined) {
                this.setState({
                    ...this.state,
                    metadata: {
                        ...this.state.metadata,
                        edited: this.state.metadata.initial
                    }
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
        if (!isMetadata(this.state.metadata))
            return;
        this.setState({
            ...this.state,
            metadata: {
                ...this.state.metadata,
                edited: newData
            }
        });
    }

    seriesItems(): OptionType[] {
        const metadata = this.state.metadata;
        if (!isMetadata(metadata))
            return [];
        const seriesCollection = findFieldCollection("isPartOf", metadata.edited);
        if (seriesCollection === undefined)
            return [];
        const pairs = collectionToPairs(seriesCollection);
        return pairs
            .filter(([_, v]) => v !== metadata.seriesId)
            .map(([k, v]) => ({ value: v, label: k }));
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
        if (this.state.metadata === undefined)
            return <Loading />;
        if (this.state.metadata === "error")
            return <div>Error loading metadata</div>;
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
                data={this.state.metadata.edited}
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
