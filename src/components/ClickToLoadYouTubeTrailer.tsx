import { useState } from 'react';

export function ClickToLoadYouTubeTrailer({
  title,
  videoId,
  experienceSlug,
  eyebrowLabel = 'Official trailer · YouTube',
  noteLabel = 'Click to load · no video request before play',
}: {
  title: string;
  videoId: string;
  experienceSlug: string;
  eyebrowLabel?: string;
  noteLabel?: string;
}) {
  const [requested, setRequested] = useState(false);
  return (
    <div className="youtube-trailer" data-youtube-trailer={experienceSlug} data-youtube-video-id={videoId}>
      {requested ? (
        <iframe
          className="youtube-trailer__player"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          loading="eager"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          data-youtube-player={experienceSlug}
        />
      ) : (
        <button
          className="youtube-trailer__poster"
          type="button"
          onClick={() => setRequested(true)}
          aria-label={`Play ${title}. Loads YouTube only after you select this button.`}
          data-trailer-play={experienceSlug}
          data-trailer-click-only="true"
        >
          <span className="youtube-trailer__eyebrow">{eyebrowLabel}</span>
          <span className="youtube-trailer__play" aria-hidden="true">▶</span>
          <span className="youtube-trailer__title">{title}</span>
          <span className="youtube-trailer__note">{noteLabel}</span>
        </button>
      )}
    </div>
  );
}
