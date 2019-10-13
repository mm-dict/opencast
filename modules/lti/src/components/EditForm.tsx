import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { License, Language } from "../OpencastRest";
import Select from "react-select";
import { ActionMeta, ValueType } from "react-select/src/types"; // tslint:disable-line no-submodule-imports

import CreatableSelect from "react-select/creatable";

export interface OptionType {
    value: string;
    label: string;
}

export interface EditFormData {
    readonly title: string;
    readonly presenters: string[];
    readonly licenses: License[];
    readonly languages: Language[];
    readonly selectedFile?: Blob;
    readonly selectedCaption?: Blob;
    readonly license?: string;
    readonly language?: string;
}

interface EditFormProps extends WithTranslation {
    readonly data: EditFormData;
    readonly onDataChange: (newData: EditFormData) => void;
    readonly onSubmit: () => void;
    readonly pending: boolean;
}


class TranslatedEditForm extends React.Component<EditFormProps> {
    onChangeFile(e: React.FormEvent<HTMLInputElement>) {
        if (e.currentTarget.files === null)
            return;
        this.props.onDataChange({
            ...this.props.data,
            selectedFile: e.currentTarget.files[0]
        });
    }

    onChangeCaption(e: React.FormEvent<HTMLInputElement>) {
        if (e.currentTarget.files === null)
            return;
        this.props.onDataChange({
            ...this.props.data,
            selectedCaption: e.currentTarget.files[0]
        });
    }

    onChangeLicense(value: ValueType<OptionType>, _: ActionMeta) {
        this.props.onDataChange({
            ...this.props.data,
            license: value === undefined || value === null || Array.isArray(value) ? undefined : (value as OptionType).value
        });
    }

    onChangeLanguage(value: ValueType<OptionType>, _: ActionMeta) {
        this.props.onDataChange({
            ...this.props.data,
            language: value === undefined || value === null || Array.isArray(value) ? undefined : (value as OptionType).value
        });
    }

    onChangePresenter(value: ValueType<OptionType>, _: ActionMeta) {
        if (value === null || value === undefined || !Array.isArray(value))
            return;
        const newPresenters = value.map((v) => v.value);
        this.props.onDataChange({
            ...this.props.data,
            presenters: newPresenters,
        });
    }

    languageOptions() {
        return this.props.data.languages.map((l) => ({ value: l.shortCode, label: this.props.t(l.translationCode) }));
    }

    currentLanguage(): OptionType | undefined {
        return this.languageOptions().find((l) => l.value === this.props.data.language);
    }

    currentLicense(): OptionType | undefined {
        return this.licenseOptions().find((l) => l.value === this.props.data.license);
    }

    licenseOptions(): OptionType[] {
        return this.props.data.licenses.map((l) => ({ value: l.key, label: this.props.t(l.label) }));
    }

    render() {
        return <form>
            <div className="form-group">
                <label htmlFor="title">{this.props.t("TITLE")}</label>
                <input type="text" className="form-control" value={this.props.data.title} onChange={(e) => this.setState({ ...this.props.data, title: e.target.value })} />
                <small className="form-text text-muted">{this.props.t("TITLE_DESCRIPTION")}</small>
            </div>
            <div className="form-group">
                <label htmlFor="presenter">{this.props.t("PRESENTER")}</label>
                <input type="file" className="form-control-file" onChange={this.onChangeFile.bind(this)} />
                <small className="form-text text-muted">{this.props.t("PRESENTER_DESCRIPTION")}</small>
            </div>
            <div className="form-group">
                <label htmlFor="caption">{this.props.t("CAPTION")}</label>
                <input type="file" className="form-control-file" onChange={this.onChangeCaption.bind(this)} />
                <small className="form-text text-muted">{this.props.t("CAPTION_DESCRIPTION")}</small>
            </div>
            <div className="form-group">
                <label htmlFor="license">{this.props.t("LICENSE")}</label>
                <Select
                    id="license"
                    onChange={this.onChangeLicense.bind(this)}
                    value={this.currentLicense()}
                    options={this.licenseOptions()}
                    placeholder={this.props.t("SELECT_LICENSE")} />
            </div>

            <div className="form-group">
                <label htmlFor="language">{this.props.t("LANGUAGE")}</label>
                <Select
                    id="language"
                    onChange={this.onChangeLanguage.bind(this)}
                    options={this.languageOptions()}
                    value={this.currentLanguage()}
                    placeholder={this.props.t("SELECT_LANGUAGE")} />
            </div>

            <div className="form-group">
                <label htmlFor="presenters">{this.props.t("PRESENTERS")}</label>
                <CreatableSelect
                    isMulti={true}
                    isClearable={true}
                    id="presenters"
                    value={this.props.data.presenters.map((e) => ({ value: e, label: e }))}
                    onChange={this.onChangePresenter.bind(this)}
                />
            </div>

            <button type="button" className="btn btn-primary" onClick={(_: any) => this.props.onSubmit()} disabled={this.props.pending}>{this.props.t(this.props.pending ? "UPLOADING" : "UPLOAD")}</button>
        </form>
    }
}

export const EditForm = withTranslation()(TranslatedEditForm);
