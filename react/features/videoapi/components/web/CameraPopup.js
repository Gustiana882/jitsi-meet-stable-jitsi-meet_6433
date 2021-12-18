// @flow

import React, { useCallback, useState } from 'react';

import { Icon, IconArrowUp, IconCheck } from '../../../base/icons';
import IconCamOn from '../../../base/icons/videoapi/cam.png';
import IconCamOff from '../../../base/icons/videoapi/cam-off.png';
import { getParticipantCount } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { ToolboxButtonWithIcon } from '../../../base/toolbox/components';
import { setFullScreen } from '../../../toolbox/actions.web';
import ToolbarButton from '../../../toolbox/components/web/ToolbarButton';
import { toggleTileView } from '../../../video-layout';
import { getLocalVideoType, isLocalCameraTrackMuted } from '../../../base/tracks';
import {
    VIDEO_MUTISM_AUTHORITY,
    setVideoMuted
} from '../../../base/media';

import { openSettingsDialog } from '../../../settings';

import InlineDialog from './InlineDialog';
import { setAudioOnly } from '../../../base/audio-only';
import UIEvents from '../../../../../service/UI/UIEvents';

declare var APP: Object;

type Props = {

   /**
    * Component's children (the audio button).
    */
    children: React$Node,

   /**
    * Flag controlling the visibility of the popup.
    */
    isOpen: boolean,

   /**
    * Callback executed when the popup closes.
    */
    onClose: Function,
}

/**
 * Popup with audio settings.
 *
 * @returns {ReactElement}
 */
function CameraPopup({
    dispatch,
    fullScreen,
    t,
    // new
    _audioOnly,
    _videoMediaType,
    _videoMuted
}: Props) {
    const [ isOpen, setIsOpen ] = useState(false);

    const text = (isMuted) => {
        const text = isMuted ? t('toolboxTitle.videoOn') : t('toolboxTitle.videoOff');

        return text;
    }
    const _setVideoMuted = useCallback(() => {

        if(_audioOnly) {
            dispatch(setAudioOnly(false, !_videoMuted));
        }

        dispatch(setVideoMuted(!_videoMuted));
        typeof APP === 'undefined'
            || APP.UI.emitEvent(UIEvents.VIDEO_MUTED, !_videoMuted, true);
    }, [setAudioOnly, dispatch, _videoMuted, _videoMediaType, VIDEO_MUTISM_AUTHORITY, setVideoMuted])

    return (
        <div className = 'view-popup'>
            <InlineDialog
                content = { <ul className = 'overflow-menu video'>                   
                    <li
                        className = 'overflow-menu-item'
                        key = 'select-camera'
                        onClick = { () => console.log("Select camera") }>
                        <div className = 'overflow-menu-item-text'>
                            {t('toolboxTitle.selectCamera')}
                        </div>
                    </li>
                    <li
                        className = 'overflow-menu-item'
                        key = 'camera-settings'
                        onClick = { () =>  dispatch(openSettingsDialog())}>
                        <div className = 'overflow-menu-item-text'>
                            {t('toolboxTitle.cameraSettings')}
                        </div>
                    </li>
                </ul> }
                isOpen = { isOpen }
                onClose = { () => setIsOpen(false) }
                position = 'top left'>
                <ToolboxButtonWithIcon
                    title = { text(_videoMuted) }
                    icon = { IconArrowUp }
                    onIconClick = { () => setIsOpen(!isOpen) }>
                    <ToolbarButton
                        empty = { true }
                        iconImage = { _videoMuted ? IconCamOff : IconCamOn }
                        onClick = { _setVideoMuted }
                    />
                </ToolboxButtonWithIcon>
            </InlineDialog>
        </div>
    );
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    const {
        fullScreen
    } = state['features/toolbox'];
    const { tileViewEnabled } = state['features/video-layout'];
    const lonelyMeeting = getParticipantCount(state) < 2;


    const { enabled: audioOnly } = state['features/base/audio-only'];
    const tracks = state['features/base/tracks'];
    const { muted } = state['features/base/media'].video;
    return {
        _audioOnly: Boolean(audioOnly),
        _videoMediaType: getLocalVideoType(tracks),
        _videoMuted: muted || isLocalCameraTrackMuted(tracks),
        fullScreen,
        lonelyMeeting,
        tileViewEnabled
    };
}


export default connect(mapStateToProps)(CameraPopup);
