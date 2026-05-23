import React from 'react';

/**
 * A reusable, styled video embed component for documentation screen recordings.
 * Wraps the iframe in a <figure> with an optional <figcaption> below.
 *
 * @param {object} props - The component props.
 * @param {string} props.src - The embed URL of the video (required).
 * @param {string} props.title - Accessible title for the iframe (required).
 * @param {string} [props.caption] - Optional caption displayed below the video.
 * @param {number | string} [props.width] - Iframe width (default: 900).
 * @param {number | string} [props.height] - Iframe height (default: 520).
 * @returns {React.ReactElement} The rendered video embed.
 */
const VideoEmbed = ({
                        src,
                        title,
                        caption,
                        width = 900,
                        height = 520,
                    }: {
    src: string;
    title: string;
    caption?: string;
    width?: number | string;
    height?: number | string;
}): React.ReactElement => {
    return (
        <figure style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem', margin: '1.5rem 0', width: 'fit-content' }}>
            <iframe
                width={width}
                height={height}
                src={src}
                title={title}
                frameBorder="0"
                allowFullScreen
                style={{ border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: '8px', display: 'block' }}
            />
            {caption && <figcaption style={{ fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center' }}>{caption}</figcaption>}
        </figure>
    );
};

export default VideoEmbed;
