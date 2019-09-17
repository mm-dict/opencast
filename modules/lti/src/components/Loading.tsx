import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

export const Loading: React.SFC<{}> = () => <div><FontAwesomeIcon icon={faSpinner} spin /><span> Loading...</span></div>;
