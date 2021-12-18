import statsEmitter from '../../features/connection-indicator/statsEmitter';
import { appNavigate } from '../app/actions';
import { APP_WILL_MOUNT } from '../base/app';
import { CONFERENCE_JOINED, CONFERENCE_LEFT, CONFERENCE_WILL_JOIN, CONFERENCE_WILL_LEAVE, getCurrentConference, PARTICIPANT_LEFT, SET_ROOM } from '../base/conference';
import { CONNECTION_ESTABLISHED, CONNECTION_WILL_CONNECT } from '../base/connection';
import { LIB_DID_INIT } from '../base/lib-jitsi-meet';
import { getLocalParticipant, PARTICIPANT_JOINED, PARTICIPANT_UPDATED } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { SET_MAX_RECEIVER_VIDEO_QUALITY, SET_PREFERRED_VIDEO_QUALITY } from '../video-quality';

import { getAPIID, getMeetingID, getMyID, getMyName, setAPIID, setAPIKey, setCurrentPreferredVideoQuality, setMeetingID, setMyID, setMyName, setRoom, setVideoAPIURL } from './api';
import { getAPIInfo } from './functions';
import { checkStats, reportSignIn, reportTimestamp, sendReport } from './stats';
import { disconnect } from '../base/connection';


export function initCheckStats(store) {
    const state = store.getState();
    const participant = getLocalParticipant(state);

    statsEmitter.subscribeToClientStats(participant.id, checkStats);
}

function waitAndHangup(store, conference) {
    setTimeout(() => {
        if (conference && conference.getParticipantCount() === 1) {
            const data = {};

            data.type = 'auto-exit';
            data.timestamp = Date.now();
            data.participantId = getMyID();
            data.participantName = getMyName();

            const payload = {
                tenant_id: getAPIID(),
                session_id: getMeetingID(),
                room: getRoom(),
                metrics: JSON.stringify(data)
            };

            sendReport(payload);

            reportTimestamp('CONFERENCE_WILL_LEAVE');
            reportSignIn();

            if (navigator.product === 'ReactNative') {
                store.dispatch(appNavigate(undefined));
            } else {
                store.dispatch(disconnect(true));
            }
        }
    }, 5 * 60 * 1000);
}


export function waitForMeetingID(store, cb) {
    setTimeout(() => {
        const conference = getCurrentConference(store.getState());

        if (conference.getMeetingUniqueId() === undefined) {
            waitForMeetingID(store, cb);
        } else {
            const meetingId = conference.getMeetingUniqueId();
            if (!meetingId) {
                waitForMeetingID(store, cb);

                return;
            }
            setMeetingID(meetingId);
            setMyID(conference.myUserId());
            conference.getParticipants()
            .map(member => {
                if (member.getId() === getMyID() && getMyName() === '') {
                    setMyName(member.getDisplayName());
                }
            });
            initCheckStats(store);
            cb(store);
        }
    }, 500);
}



MiddlewareRegistry.register(store => next => action => {
    /* eslint-disable no-fallthrough */

    switch (action.type) {
    case APP_WILL_MOUNT:
        if (action.app && action.app.props && action.app.props.url) {
            setAPIID(action.app.props.url.apiID);
            setAPIKey(action.app.props.url.apiKey);
        } else {
            const apiInfo = getAPIInfo();

            setAPIID(apiInfo.apiID);
            setAPIKey(apiInfo.apiKey);
        }

        break;


    case CONFERENCE_JOINED:
        reportTimestamp(action.type);
        waitForMeetingID(store, () => {
            checkStats({});
            reportSignIn();
        });
        break;

    case SET_MAX_RECEIVER_VIDEO_QUALITY:
        break;
    case PARTICIPANT_JOINED:
        if (navigator.product !== 'ReactNative') {
            document.dispatchEvent(new CustomEvent('videoapi-update-all-videos'));
        }
        break;

    case PARTICIPANT_LEFT:
        {
            const { conference } = action.participant;

            if (conference && conference.getParticipantCount() === 1) {
                waitAndHangup(store, conference);
            }
            if (navigator.product !== 'ReactNative') {
                document.dispatchEvent(new CustomEvent('videoapi-update-all-videos'));
            }
        }
        break;

    case PARTICIPANT_UPDATED:
        if (action.participant && action.participant.name !== undefined && action.participant.name !== getMyName()) {
            setMyName(action.participant.name);
        }
        break;

    case CONNECTION_WILL_CONNECT:
    case CONNECTION_ESTABLISHED:
    case CONFERENCE_WILL_JOIN:
        reportTimestamp(action.type);
        break;

    case CONFERENCE_LEFT:
        if (navigator.product === 'ReactNative') {
            global.lastExit = Date.now();
        }
        break;

    case LIB_DID_INIT:
        const state = store.getState()
        const {
            videoapiURL
        } = state['features/base/config'];

        reportTimestamp(action.type);
        setVideoAPIURL(videoapiURL);
        break;

    case CONFERENCE_WILL_LEAVE:
        reportTimestamp(action.type);
        reportSignIn();

        break;

    case SET_ROOM:
        setRoom(action.room);
        break;

    case SET_PREFERRED_VIDEO_QUALITY:
        setCurrentPreferredVideoQuality(action.preferredVideoQuality);
        break;

    default:
        break;
    }

    return next(action);
});

