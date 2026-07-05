import React from 'react';

/**
 * A reusable, styled video embed component for documentation screen recordings.
 * Renders a responsive 16:9-ish iframe (capped at 900px wide) inside a <figure>
 * with an optional <figcaption> below.
 *
 * @param {object} props - The component props.
 * @param {string} props.src - The embed URL of the video (required).
 * @param {string} props.title - Accessible title for the iframe (required).
 * @param {string} [props.caption] - Optional caption displayed below the video.
 * @returns {React.ReactElement} The rendered video embed.
 */
const VideoEmbed = ({
                        src,
                        title,
                        caption,
                    }: {
    src: string;
    title: string;
    caption?: string;
}): React.ReactElement => {
    return (
        <figure style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem', margin: '1.5rem auto', width: '100%', maxWidth: '900px' }}>
            <div style={{ width: '100%', aspectRatio: '900 / 520' }}>
                <iframe
                    src={src}
                    title={title}
                    frameBorder="0"
                    allowFullScreen
                    style={{ width: '100%', height: '100%', border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: '8px', display: 'block' }}
                />
            </div>
            {caption && <figcaption style={{ fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center' }}>{caption}</figcaption>}
        </figure>
    );
};

export default VideoEmbed;
