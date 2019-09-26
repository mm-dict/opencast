import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { RouteComponentProps } from "react-router";
import { Location } from "history";
import { parse as parseQuery } from "query-string";
import { Series } from "./components/Series";
import { Upload } from "./components/Upload";
import { Welcome } from "./components/Welcome";
import "./i18n";

function transformLocation(inputLocation: Location): Location {
    if (inputLocation.search === "") {
        return {
            ...inputLocation,
            pathname: "/",
        };
    }
    const qsParsed = parseQuery(inputLocation.search);
    if (qsParsed.tool === undefined) {
        return inputLocation;
    }
    if (qsParsed.tool === "series") {
        return {
            ...inputLocation,
            pathname: "/series",
        };
    }
    if (qsParsed.tool === "upload") {
        return {
            ...inputLocation,
            pathname: "/upload",
        };
    }
    return {
        ...inputLocation,
        pathname: "/" + qsParsed.tool,
    };
}


function App() {
    return (
        <Router>
            <Route render={(routeProps: RouteComponentProps<any>) => (
                <div className="container">
                    <Switch location={transformLocation(routeProps.location)}>
                        <Route exact path="/" component={Welcome} />
                        <Route exact path="/series" component={Series} />
                        <Route exact path="/upload" component={Upload} />
                    </Switch>
                </div>
            )} />
        </Router>
    );
}

export default App;
