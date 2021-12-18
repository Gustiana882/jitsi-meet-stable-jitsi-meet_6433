import LibVideoAPI from '../base/lib-jitsi-meet';


/* eslint-disable require-jsdoc */
export function getDevices() {
    return new Promise((resolve, reject) => {
        try {
            LibVideoAPI.enumerateDevices(list => {
                resolve(list);
            });
        } catch (e) {
//            reject(e);
        }
    });
}

/* eslint-disable require-jsdoc */
export function getLocality() {
    try {
        return fetch('http://geolocation-db.com/json/')
        .then(response => response.json());
    } catch (e) {
        return {
            country_code: '-',
            country_name: '-',
            city: '-',
            IPv4: "-",
            latitude: 0,
            longitude: 0,
            postal: null,
            state: '-'
        }
    }
}

/* eslint-disable require-jsdoc */

export function getAPIInfo() {
    if (!window) {
        return;
    }

    if (!window.location) {
        return;
    }
    const apiIDs = window.location.pathname.substring(1).split('-');

    let params = {};

    if (window.location.search) {
        const paramsStr =`{"${window.location.search.replace(/%22/g, '').replace(/&/g, '","').replace(/=/g,'":"')}"}`
        params = JSON.parse(paramsStr,
            function(key, value) { return key===""?value:decodeURIComponent(value) });
    }

    const data = {
        apiID: '',
        apiKey: params['apiKey'],
        roomName: ''
    }

    if (window.location.host === 'room.videoapi') {
        data.apiKey = '00000000-0000-0000-0000-000000000000';
    } else if (params['id']) {
        const keyParams = params['id'].split('-');

        if (keyParams.length === 2) {
            const k = keyParams[0];

            data.apiKey = params['id'].replace(`${k}-`, '');
        }
    }

    if (apiIDs && apiIDs.length > 5) {
        apiIDs.map((item, i) => {
            if (i < 5) {
                data.apiID = data.apiID + item;
            }
            if (i < 4) {
                data.apiID = `${data.apiID}-`;
            }
            if (i >= 5 && i < apiIDs.length) {
                data.roomName = data.roomName + item;
            }
            if (i >= 5 && i < apiIDs.length - 1) {
                data.roomName = `${data.roomName}-`;
            }

        });
    }
    if (data.apiID === '') {
        data.apiID = 'default';
    }

    return data;
}

