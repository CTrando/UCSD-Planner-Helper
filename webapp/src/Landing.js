import React, {Component} from 'react';
import {connect} from "react-redux";
import {bindActionCreators} from "redux";
import "./css/Landing.css";
import {LeftSidePanel} from './components/landing/LeftSidePanel';
import RightSidePanel from './components/landing/RightSidePanel';
import MainPanel from './components/landing/MainPanel';
import MessageHandler from "./utils/MessageHandler";
import {initMessageHandler} from "./actions/ClassInputActions";
import {CacheManager} from "./utils/CacheManager";

const CURRENT_VERSION = "1.1";
class Landing extends Component {
    async componentDidMount() {
        await CacheManager.get().checkVersion(CURRENT_VERSION);
    }

    render() {
        // have to remove padding from grid
        return (
            <div className="container">
                <LeftSidePanel/>
                <MainPanel/>
                <RightSidePanel/>

                <MessageHandler ref={(el) => this.props.initMessageHandler(el)}/>
            </div>
        );
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        initMessageHandler: initMessageHandler,
    }, dispatch);
}

export default connect(null, mapDispatchToProps)(Landing);
