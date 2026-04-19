import { ShieldCheck, BadgeCheck, Star, MapPin, Bed, Bath, Square } from 'lucide-react'

/**
 * PropertyCard — displays a listing card with trust badges.
 *
 * Props:
 *  listing (object) — { id, title, location, price, type, beds, baths, area,
 *             image, verified, nidVerified, badge, rating }
 */
export default function PropertyCard({ listing }) {
 const {
  title,
  location,
  price,
  type,
  beds,
  baths,
  area,
  image,
  verified,
  nidVerified,
  badge,
  rating,
 } = listing

 const typeColors = {
  rent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  buy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  marketplace: 'bg-theme-primary/20 text-orange-400 border-theme-primary/30',
 }

 return (
  <article className="card group overflow-hidden cursor-pointer">
   {/* Image */}
   <div className="relative overflow-hidden aspect-[4/3]">
    <img
     src={image}
     alt={title}
     loading="lazy"
     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

    {/* Type Badge */}
    {badge && (
     <span
      className={`absolute top-3 left-3 border text-xs font-semibold px-2.5 py-1 rounded-full ${
       typeColors[type] || typeColors.rent
      }`}
     >
      {badge}
     </span>
    )}

    {/* Rating */}
    {rating && (
     <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-yellow-400 text-xs font-semibold px-2 py-1 rounded-full">
      <Star size={11} fill="currentColor" />
      {rating}
     </span>
    )}

    {/* Trust Badges on image */}
    <div className="absolute bottom-3 left-3 flex gap-1.5">
     {verified && (
      <span className="badge-verified">
       <BadgeCheck size={11} />
       Verified
      </span>
     )}
     {nidVerified && (
      <span className="badge-nid">
       <ShieldCheck size={11} />
       NID ✓
      </span>
     )}
    </div>
   </div>

   {/* Info */}
   <div className="p-4">
    <h3 className="font-semibold text-white text-sm leading-snug mb-1.5 line-clamp-1 group-hover:text-orange-400 transition-colors duration-200">
     {title}
    </h3>
    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-3">
     <MapPin size={12} className="text-theme-primary flex-shrink-0" />
     <span className="line-clamp-1">{location}</span>
    </div>

    {/* Property Stats */}
    {(beds || baths || area) && (
     <div className="flex items-center gap-3 text-slate-400 text-xs mb-3 border-t border-slate-700/50 pt-3">
      {beds && (
       <span className="flex items-center gap-1">
        <Bed size={12} className="text-slate-500" />
        {beds} Beds
       </span>
      )}
      {baths && (
       <span className="flex items-center gap-1">
        <Bath size={12} className="text-slate-500" />
        {baths} Baths
       </span>
      )}
      {area && (
       <span className="flex items-center gap-1">
        <Square size={12} className="text-slate-500" />
        {area} sqft
       </span>
      )}
     </div>
    )}

    {/* Price */}
    <div className="flex items-end justify-between">
     <div>
      <span className="text-orange-400 font-bold text-base">{price}</span>
      {type === 'rent' && (
       <span className="text-slate-500 text-xs ml-1">/month</span>
      )}
     </div>
     <button
      className="text-xs text-theme-primary hover:text-orange-400 font-medium transition-colors duration-200"
      aria-label={`View details for ${title}`}
     >
      View →
     </button>
    </div>
   </div>
  </article>
 )
}
