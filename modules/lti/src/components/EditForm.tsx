import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import {
    EventMetadataField,
    EventMetadataContainer,
    EventMetadataCollection
} from "../OpencastRest";
import Select from "react-select";
import i18next from "i18next";
import { ActionMeta, ValueType } from "react-select/src/types"; // tslint:disable-line no-submodule-imports

import CreatableSelect from "react-select/creatable";

const allowedFields = ["title", "language", "license", "creator"];

interface OptionType {
    value: string;
    label: string;
}

interface EditFormProps extends WithTranslation {
    readonly data: EventMetadataContainer;
    readonly withUpload: boolean;
    readonly onDataChange: (newData: EventMetadataContainer) => void;
    readonly onPresenterFileChange: (file: Blob) => void;
    readonly onCaptionFileChange: (file: Blob) => void;
    readonly onSubmit: () => void;
    readonly pending: boolean;
}

interface MetadataFieldProps {
    readonly field: EventMetadataField;
    readonly valueChange: (id: string, newValue: string | string[]) => void;
    readonly t: i18next.TFunction;
}

interface MetadataCollectionKey {
    label: string;
    order?: number;
    selectable?: boolean;
}

function parseMetadataCollectionKey(s: string): MetadataCollectionKey {
    if (s[0] !== "{")
        return { label: s };
    return JSON.parse(s);
}

function collectionToOptions(collection: EventMetadataCollection, translatable: boolean, t: i18next.TFunction): OptionType[] {
    const options: OptionType[] = [];
    Object.keys(collection).forEach((k) => {
        const label = parseMetadataCollectionKey(k).label;
        if (collection !== undefined)
            options.push({
                value: collection[k],
                label: translatable ? t(label) : label,
            });
    });
    return options;

}

function MetadataFieldInner(props: MetadataFieldProps) {
    const field = props.field;
    const t = props.t;
    const valueChange = props.valueChange;
    if (field.type === "text" && field.collection === undefined && field.readOnly === true)
        return <div>{field.value}</div>;
    if (field.type === "text" && field.collection === undefined)
        return <input
            type="text"
            id={field.id}
            className="form-control"
            value={field.value}
            onChange={(e) => valueChange(field.id, e.currentTarget.value)} />;

    if (field.collection !== undefined && field.type === "mixed_text")
        return <CreatableSelect
            isMulti={true}
            isClearable={true}
            id={field.id}
            value={(field.value as string[]).map((e) => ({ value: e, label: e }))}
            onChange={(value: ValueType<OptionType>, _: ActionMeta) =>
                valueChange(
                    field.id,
                    value === undefined || value === null || !Array.isArray(value) ? [] : (value as OptionType[]).map((v) => v.value))} />;

    if (field.collection !== undefined) {
        const options: OptionType[] = collectionToOptions(field.collection, field.translatable, t);
        const currentValue = options.find((o: OptionType) => o.value === field.value);
        console.log("current value " + currentValue)
        return <Select
            id={field.id}
            onChange={(value: ValueType<OptionType>, _: ActionMeta) =>
                valueChange(
                    field.id,
                    value === undefined || value === null || Array.isArray(value) ? "" : (value as OptionType).value)}
            value={currentValue}
            options={options}
            placeholder={t("SELECT_OPTION")} />
    }
    return <div>Cannot display control of type {field.type}</div>
}

function MetadataField(props: MetadataFieldProps) {
    return <div className="form-group">
        <label htmlFor={props.field.id}>{props.t(props.field.label)}</label>
        <MetadataFieldInner {...props} />
    </div>;
}

class TranslatedEditForm extends React.Component<EditFormProps> {
    onChangePresenterFile(e: React.FormEvent<HTMLInputElement>) {
        if (e.currentTarget.files === null)
            return;
        this.props.onPresenterFileChange(e.currentTarget.files[0]);
    }

    onChangeCaptionFile(e: React.FormEvent<HTMLInputElement>) {
        if (e.currentTarget.files === null)
            return;
        this.props.onCaptionFileChange(e.currentTarget.files[0]);
    }

    fieldValueChange(id: string, newValue: string | string[]) {
        this.props.onDataChange(
            {
                ...this.props.data,
                fields: this.props.data.fields.map((field) => field.id !== id ? field : ({
                    ...field,
                    value: newValue
                }))
            }
        );
    }

    render() {
        return <form>
            {this.props.data.fields
                .filter((field) => allowedFields.includes(field.id))
                .map((field) => <MetadataField
                    key={field.id}
                    t={this.props.t}
                    field={field}
                    valueChange={this.fieldValueChange.bind(this)} />)}
            {this.props.withUpload &&
                <div className="form-group">
                    <label htmlFor="presenter">{this.props.t("PRESENTER")}</label>
                    <input type="file" className="form-control-file" onChange={this.onChangePresenterFile.bind(this)} />
                    <small className="form-text text-muted">{this.props.t("PRESENTER_DESCRIPTION")}</small>
                </div>
            }
            {this.props.withUpload &&
                <div className="form-group">
                    <label htmlFor="caption">{this.props.t("CAPTION")}</label>
                    <input type="file" className="form-control-file" onChange={this.onChangeCaptionFile.bind(this)} />
                    <small className="form-text text-muted">{this.props.t("CAPTION_DESCRIPTION")}</small>
                </div>
            }
            <button
                type="button"
                className="btn btn-primary"
                onClick={(_: any) => this.props.onSubmit()}
                disabled={this.props.pending}>
                {this.props.t(this.props.pending ? "UPLOADING" : "UPLOAD")}
            </button>
        </form>
    }
}

export const EditForm = withTranslation()(TranslatedEditForm);
