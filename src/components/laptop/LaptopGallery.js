'use client';
import PublicProductGallery from '@/components/product/PublicProductGallery';
import { publicImageList } from '@/lib/laptopSeoDomain';
// The gallery takes image DTOs only: no Product IDs, variants, or persistence.
export default function LaptopGallery({ images, cover, name }) {
 const urls = publicImageList({ images, image: cover });
 return <PublicProductGallery images={urls.map((url, index) => ({ id: url, url, isPrimary: index === 0 }))} productName={name} />;
}
