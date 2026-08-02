import { SectionHeading } from '@/components/brand/SectionHeading';
import { EditorialImage } from '@/components/brand/EditorialImage';
import { getImageUrl } from '@/lib/image-url';

export function CommunityGrid({ images }: { images: string[] }) {
  const tiles = images.slice(0, 6);
  if (tiles.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <SectionHeading eyebrow="@paribelle" title="Styled by You" align="center" showRule />
      <div className="mt-8 grid grid-cols-3 gap-2 md:gap-3">
        {tiles.map((img, i) => (
          <EditorialImage key={i} src={getImageUrl(img)} alt="" aspect="1 / 1" sizes="33vw" />
        ))}
      </div>
    </section>
  );
}
