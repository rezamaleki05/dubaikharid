import { getImageProps } from 'next/image';
import { canOptimizePublicImage } from './publicImagePolicy';

export function publicImageDelivery(source, sizes) {
  if (!canOptimizePublicImage(source)) return { src: source };
  const { props } = getImageProps({ src: source, alt: '', width: 1600, height: 1600, sizes, quality: 90 });
  // Keep the existing CSS and intrinsic source aspect ratio. The optimizer
  // resizes proportionally; no crop and no invented square DOM dimensions.
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}
