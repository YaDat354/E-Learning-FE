type StarRatingProps = {
  rating: number
  className?: string
}

function StarRating({ rating, className = '' }: StarRatingProps) {
  const full = Math.floor(rating)
  return (
    <span className={className}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  )
}

export default StarRating
