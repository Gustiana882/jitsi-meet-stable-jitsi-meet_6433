// @flow

import aliases from 'react-emoji-render/data/aliases';
import emojiAsciiAliases from 'react-emoji-render/data/asciiAliases';

import { escapeRegexp } from '../base/util';

/**
 * An ASCII emoticon regexp array to find and replace old-style ASCII
 * emoticons (such as :O) to new Unicode representation, so then devices
 * and browsers that support them can render these natively without
 * a 3rd party component.
 *
 * NOTE: this is currently only used on mobile, but it can be used
 * on web too once we drop support for browsers that don't support
 * unicode emoji rendering.
 */
const EMOTICON_REGEXP_ARRAY: Array<Array<Object>> = [];

(function() {
    for (const [ key, value ] of Object.entries(aliases)) {
        let escapedValues;
        const asciiEmojies = emojiAsciiAliases[key];

        // Adding ascii emoticons
        if (asciiEmojies) {
            escapedValues = asciiEmojies.map(v => escapeRegexp(v));
        } else {
            escapedValues = [];
        }

        // Adding slack-type emoji format
        escapedValues.push(escapeRegexp(`:${key}:`));

        const regexp = `\\B(${escapedValues.join('|')})\\B`;

        EMOTICON_REGEXP_ARRAY.push([ new RegExp(regexp, 'g'), value ]);
    }
})();

/**
 * Replaces ascii and other non-unicode emoticons with unicode emojis to let the emojis be rendered
 * by the platform native renderer.
 *
 * @param {string} message - The message to parse and replace.
 * @returns {string}
 */
export function replaceNonUnicodeEmojis(message: string) {
    let replacedMessage = message;

    for (const [ regexp, replaceValue ] of EMOTICON_REGEXP_ARRAY) {
        replacedMessage = replacedMessage.replace(regexp, replaceValue);
    }

    return replacedMessage;
}

/**
 * Selector for calculating the number of unread chat messages.
 *
 * @param {Object} state - The redux state.
 * @returns {number} The number of unread messages.
 */
export function getUnreadCount(state: Object) {
    const { lastReadMessage, messages } = state['features/chat'];
    const messagesCount = messages.length;

    if (!messagesCount) {
        return 0;
    }

    let reactionMessages = 0;

    if (navigator.product === 'ReactNative') {
        // React native stores the messages in a reversed order.
        const lastReadIndex = messages.indexOf(lastReadMessage);

        for (let i = 0; i < lastReadIndex; i++) {
            if (messages[i].isReaction) {
                reactionMessages++;
            }
        }

        return lastReadIndex - reactionMessages;
    }

    const lastReadIndex = messages.lastIndexOf(lastReadMessage);

    for (let i = lastReadIndex + 1; i < messagesCount; i++) {
        if (messages[i].isReaction) {
            reactionMessages++;
        }
    }

    return messagesCount - (lastReadIndex + 1) - reactionMessages;
}

/**
 * Selector for calculating the number of unread chat messages.
 *
 * @param {Object} state - The redux state.
 * @returns {number} The number of unread messages.
 */
export function getUnreadMessagesCount(state: Object) {
    const { nbUnreadMessages } = state['features/chat'];

    return nbUnreadMessages;
}

/**
 * Get whether the chat smileys are disabled or not.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} The disabled flag.
 */
export function areSmileysDisabled(state: Object) {
    const disableChatSmileys = state['features/base/config']?.disableChatSmileys === true;

    return disableChatSmileys;
}
