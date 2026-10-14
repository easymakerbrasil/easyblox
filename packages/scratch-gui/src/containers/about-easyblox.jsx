import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useDispatch} from 'react-redux';

import AboutEasyBloxModal from '../components/about-easyblox-modal/about-easyblox-modal.jsx';
import EasyBloxDesktopClient from '../lib/easyblox-desktop-client';
import {closeAboutModal} from '../reducers/modals';

const AboutEasyBlox = () => {
    const dispatch = useDispatch();
    const [result, setResult] = useState({status: 'loading'});
    const requestRef = useRef(null);

    useEffect(() => {
        const request = {active: true, controller: new AbortController()};
        requestRef.current = request;
        const client = new EasyBloxDesktopClient();
        const acceptInfo = function (response) {
            if (request.active && response.reason !== 'cancelled') setResult(response);
        };
        client.getAppInfo({signal: request.controller.signal}).then(acceptInfo);
        return () => {
            request.active = false;
            request.controller.abort();
            requestRef.current = null;
        };
    }, []);

    const handleClose = useCallback(() => {
        const request = requestRef.current;
        if (request) {
            request.active = false;
            request.controller.abort();
        }
        dispatch(closeAboutModal());
    }, [dispatch]);

    return (<AboutEasyBloxModal
        result={result}
        onClose={handleClose}
    />);
};

export default AboutEasyBlox;
