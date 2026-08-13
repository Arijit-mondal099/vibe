"use client";

interface Props {
  path: string;
}

export const VideoPlayer: React.FC<Props> = ({ path }) => {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      className="w-full h-full object-cover"
    >
      <source src={path} type="video/mp4" />
      Your browser doesn&apos;t support video.
    </video>
  );
};
